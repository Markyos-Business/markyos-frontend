import { BrandRepository, SaveResult } from "../repository";
import { Account, AppState, Competitor, Moodboard, WorkspaceStage } from "../types";
import { nBetween } from "../doc/core/order";
import { DEFAULT_TEMPLATE_KEY, zonesFromTemplate } from "../moodboard/zones";
import {
  DEMO_ACCOUNT_ID,
  DEMO_PASSWORD,
  buildDemoAccount,
  defaultBilling,
  defaultClientAccess,
  defaultCompetitorColumns,
  defaultTypography,
  emptySlot,
} from "../mockData";
import { uid } from "../utils";
import { RESET_TTL_MS } from "../auth";
import { readAllBlobs, writeBlobs } from "../blobStore";

/**
 * The browser-storage implementation of BrandRepository: the behaviour the
 * prototype has always had, now behind the interface instead of inline in the
 * provider. Nothing outside this file knows that `localStorage`, IndexedDB or
 * the blob-reference format exist.
 */

const STORAGE_KEY = "markyos:v1";
const SESSION_ALIVE_KEY = "markyos:session-alive";

/** Kept here rather than imported so a stale value on disk is validated
 *  against the set this build actually understands. */
const STAGES: WorkspaceStage[] = ["discovery", "strategy", "design", "review", "delivered", "live"];

/**
 * A moodboard saved before zones existed.
 *
 * The old shape was one flat `items` array of asset references with a numeric
 * vote count. Everything on it goes into the Imagery zone of a standard board,
 * because that is what it was: a pile of reference pictures. The board keeps
 * its title and its id, so a link to it still works and nobody has to be told
 * their board was rebuilt.
 *
 * The vote count is the one thing that cannot survive faithfully — votes are
 * now one row per person and the old number does not say who. Turning "3" into
 * three anonymous voters would be inventing three people, so the count becomes
 * a single "Migrated" voter when it was above zero, which keeps the item in
 * the shortlist without claiming to know who put it there.
 */
function migrateMoodboard(input: unknown): Moodboard {
  const board = (input ?? {}) as Record<string, unknown>;
  if (Array.isArray(board.zones)) {
    /*
     * A board from before the canvas.
     *
     * Only the two collections are backfilled, and deliberately *not* the
     * positions: every card and frame gets its coordinates from
     * lib/moodboard/layout.ts, derived on render, so a board that has never
     * been arranged opens arranged and stores nothing. Writing coordinates here
     * instead would be a migration that has to be right first time for data
     * nobody can inspect, and would freeze one version of the layout into
     * storage where no later improvement could reach it.
     *
     * `view` defaults to the canvas because that is what a moodboard is. The
     * list is a mode you switch into.
     */
    return {
      ...(board as unknown as Moodboard),
      edges: Array.isArray(board.edges) ? (board.edges as Moodboard["edges"]) : [],
      view: board.view === "columns" ? "columns" : "canvas",
    };
  }

  const legacy = Array.isArray(board.items) ? (board.items as Record<string, unknown>[]) : [];
  const zones = zonesFromTemplate(DEFAULT_TEMPLATE_KEY);
  const target = zones.find((z) => z.kind === "imagery") ?? zones[0];

  if (target) {
    const keys = nBetween(null, null, Math.max(1, legacy.length));
    target.items = legacy.map((item, i) => ({
      id: typeof item.id === "string" ? item.id : uid(),
      kind: "asset" as const,
      assetId: typeof item.assetId === "string" ? item.assetId : undefined,
      note: typeof item.note === "string" ? item.note : undefined,
      order: keys[i],
      size: "m" as const,
      votes: typeof item.votes === "number" && item.votes > 0 ? ["Migrated"] : [],
      createdBy: "Migrated",
      createdAt: typeof board.createdAt === "number" ? board.createdAt : Date.now(),
    }));
  }

  return {
    id: typeof board.id === "string" ? board.id : uid(),
    title: typeof board.title === "string" ? board.title : "Exploration",
    createdAt: typeof board.createdAt === "number" ? board.createdAt : Date.now(),
    templateKey: DEFAULT_TEMPLATE_KEY,
    zones,
    edges: [],
    view: "canvas",
  };
}

/** Marks a string in the persisted snapshot as a stand-in for a payload held
 *  in IndexedDB. Chosen so it can never collide with a real `data:` URL. */
const BLOB_REF_PREFIX = "markyos-blob:";

/**
 * Swaps every inline `data:` URL in the tree for a short reference token,
 * collecting the payloads into `blobs` so they can be written to IndexedDB
 * instead of localStorage. The walk is generic rather than field-by-field so
 * an upload stored on any field — existing or added later — is covered
 * automatically and can't silently reintroduce the quota problem.
 */
function stripBlobs(
  value: unknown,
  blobs: Map<string, string>,
  keyFor: (dataUrl: string) => string
): unknown {
  if (typeof value === "string") {
    if (!value.startsWith("data:")) return value;
    const key = keyFor(value);
    blobs.set(key, value);
    return BLOB_REF_PREFIX + key;
  }
  if (Array.isArray(value)) return value.map((v) => stripBlobs(v, blobs, keyFor));
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = stripBlobs(v, blobs, keyFor);
    return out;
  }
  return value;
}

/** Inverse of `stripBlobs`. A token with no matching payload resolves to an
 *  empty string, which renders as a missing image rather than crashing. */
function restoreBlobs(value: unknown, blobs: Map<string, string>): unknown {
  if (typeof value === "string") {
    if (!value.startsWith(BLOB_REF_PREFIX)) return value;
    return blobs.get(value.slice(BLOB_REF_PREFIX.length)) ?? "";
  }
  if (Array.isArray(value)) return value.map((v) => restoreBlobs(v, blobs));
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = restoreBlobs(v, blobs);
    return out;
  }
  return value;
}

function readSessionAlive(): boolean {
  try {
    return window.sessionStorage.getItem(SESSION_ALIVE_KEY) === "1";
  } catch {
    return false;
  }
}

function writeSessionAlive(alive: boolean) {
  try {
    if (alive) window.sessionStorage.setItem(SESSION_ALIVE_KEY, "1");
    else window.sessionStorage.removeItem(SESSION_ALIVE_KEY);
  } catch {
    // Storage blocked (private mode). The session still works for this tab.
  }
}

/**
 * Repair a snapshot written by an older build.
 *
 * Every field added after some browsers already had data on disk has to be
 * defaulted here, or an old session hydrates a workspace missing whichever
 * fields postdate its snapshot and crashes deep in a page that assumes they
 * are always present.
 *
 * This whole function is storage-format repair, which is why it belongs to the
 * adapter and not to the store. The ServerAdapter will have no equivalent: a
 * column either exists because a migration added it, or it does not exist.
 */
function migrate(parsed: AppState): AppState {
  if (!Array.isArray(parsed.auditLog)) parsed.auditLog = [];
  if (!parsed.sso) parsed.sso = { enabled: false, provider: "", domain: "" };

  /*
   * Accounts: one became many, and brands gained an owner.
   *
   * A browser that last ran the previous build has `account` (one object or
   * null) and workspaces with no `ownerAccountId`. Both have to be carried
   * across here or the person loses their sign-in and every brand they made
   * becomes unreachable.
   *
   * The old single account keeps its email and its password — which is
   * plaintext, and `verifyPassword` reads that form and upgrades it the next
   * time they sign in successfully.
   */
  const legacy = (parsed as unknown as { account?: Account | null }).account;
  if (!Array.isArray(parsed.accounts)) {
    parsed.accounts = legacy
      ? [
          {
            id: DEMO_ACCOUNT_ID,
            name: legacy.name,
            email: legacy.email,
            // An account that had never set one accepted any password at all.
            // There is no honest way to carry that forward, so it becomes the
            // demo password and the login screen shows it — better than a
            // silent lockout.
            password: legacy.password || `plain$${DEMO_PASSWORD}`,
            passwordUpdatedAt: legacy.passwordUpdatedAt ?? null,
            createdAt: legacy.createdAt ?? Date.now(),
            lastLoginAt: null,
            adminLang: null,
          },
        ]
      : [buildDemoAccount()];
  }
  if (parsed.accounts.length === 0) parsed.accounts = [buildDemoAccount()];
  // Ids and emails are what everything else joins on.
  parsed.accounts = parsed.accounts.map((a) => ({
    ...a,
    id: a.id || uid(),
    email: typeof a.email === "string" ? a.email.trim().toLowerCase() : "",
    lastLoginAt: typeof a.lastLoginAt === "number" ? a.lastLoginAt : null,
    /* Null, not a language. An account written before the interface language
       became a personal setting has no preference, and inventing one would
       change what that person's app looks like on their next load. Null means
       "follow whichever brand is open", which is what the single field did. */
    adminLang: a.adminLang === "ar" || a.adminLang === "en" ? a.adminLang : null,
  }));
  delete (parsed as unknown as { account?: unknown }).account;

  if (!Array.isArray(parsed.resets)) parsed.resets = [];
  parsed.resets = parsed.resets.filter((r) => Date.now() - r.requestedAt < RESET_TTL_MS);

  // The session gained an accountId and a `remember` flag. An old one has
  // neither, so match it back by email.
  if (parsed.session) {
    const owner =
      parsed.accounts.find(
        (a) => a.email === String(parsed.session?.email ?? "").toLowerCase()
      ) ?? parsed.accounts[0];
    parsed.session = {
      accountId: parsed.session.accountId || owner.id,
      email: parsed.session.email || owner.email,
      name: parsed.session.name || owner.name,
      startedAt: parsed.session.startedAt ?? Date.now(),
      remember: parsed.session.remember !== false,
    };
    /*
     * "Stay signed in" left unticked means this browser, until it closes —
     * not until the next reload.
     *
     * `localStorage` cannot tell those apart, so a marker is written to
     * `sessionStorage` at sign-in. That survives reloads and in-tab
     * navigation and is gone once the tab closes, which is exactly the line
     * being drawn. If the session says "don't remember me" and the marker is
     * missing, the browser was closed and restarted, so the session goes.
     */
    if (!parsed.session.remember && !readSessionAlive()) parsed.session = null;
  }

  parsed.workspaces = parsed.workspaces.map((ws) => ({
    ...ws,
    // Brands made before ownership existed belong to whoever this browser's
    // original single account became — never to nobody, which would drop them
    // out of every gallery.
    ownerAccountId:
      typeof ws.ownerAccountId === "string" && ws.ownerAccountId
        ? ws.ownerAccountId
        : parsed.accounts[0].id,
    /* `lang` became `primaryLocale` when the field was split in two (see
       Workspace.primaryLocale). A snapshot written before that carries the old
       name, and reading it as a missing field would reset every Arabic brand to
       English — so the old name is accepted as the source here. This is the
       whole job of a hydration backfill, and it is also the reason the split
       had to happen before anyone's real data depended on it. */
    primaryLocale: (() => {
      const next = ws.primaryLocale ?? (ws as unknown as { lang?: unknown }).lang;
      return next === "ar" || next === "en" ? next : "en";
    })(),
    sharedStatus: ws.sharedStatus === "shared" || ws.sharedStatus === "draft" ? ws.sharedStatus : "draft",
    overviewHtml: typeof ws.overviewHtml === "string" ? ws.overviewHtml : "",
    overviewSavedAt: typeof ws.overviewSavedAt === "number" ? ws.overviewSavedAt : Date.now(),
    industry: typeof ws.industry === "string" ? ws.industry : "",
    tagline: typeof ws.tagline === "string" ? ws.tagline : "",
    foundedYear: typeof ws.foundedYear === "string" ? ws.foundedYear : "",
    colors: Array.isArray(ws.colors) ? ws.colors : [],
    logo: ws.logo ?? { arabic: emptySlot("arabic"), latin: emptySlot("latin"), symbol: emptySlot("symbol") },
    logoUsageNotes: typeof ws.logoUsageNotes === "string" ? ws.logoUsageNotes : "",
    logoColorIds: Array.isArray(ws.logoColorIds) ? ws.logoColorIds : [],
    typography: ws.typography ?? defaultTypography(),
    clientAccess: {
      ...defaultClientAccess(),
      ...(ws.clientAccess && typeof ws.clientAccess === "object" ? ws.clientAccess : {}),
      subdomain: typeof ws.clientAccess?.subdomain === "string" ? ws.clientAccess.subdomain : "",
    },
    billing: ws.billing ?? defaultBilling(),
    signOffPins: Array.isArray(ws.signOffPins) ? ws.signOffPins : [],
    strategy: {
      // Spread first, then re-assert the required fields below.
      //
      // This list used to be exhaustive, which meant every field added to
      // BrandStrategy afterwards was silently dropped on reload — the Arabic
      // copy of the strategy survived in memory and vanished on refresh.
      // Carrying unknown keys through keeps optional additions working
      // without this list having to be updated in lockstep; the guards below
      // still guarantee the shape of everything the app actually depends on.
      ...(ws.strategy && typeof ws.strategy === "object" ? ws.strategy : {}),
      purpose: typeof ws.strategy?.purpose === "string" ? ws.strategy.purpose : "",
      mission: typeof ws.strategy?.mission === "string" ? ws.strategy.mission : "",
      vision: typeof ws.strategy?.vision === "string" ? ws.strategy.vision : "",
      coreValues: Array.isArray(ws.strategy?.coreValues) ? ws.strategy.coreValues : [],
      targetAudienceSummary: typeof ws.strategy?.targetAudienceSummary === "string" ? ws.strategy.targetAudienceSummary : "",
      personas: Array.isArray(ws.strategy?.personas) ? ws.strategy.personas : [],
      competitors: (Array.isArray(ws.strategy?.competitors) ? ws.strategy.competitors : []).map(
        (c: Competitor) => ({ ...c, cells: c.cells ?? {} })
      ),
      competitorColumns: Array.isArray(ws.strategy?.competitorColumns)
        ? ws.strategy.competitorColumns
        : defaultCompetitorColumns(),
      positioningStatement: typeof ws.strategy?.positioningStatement === "string" ? ws.strategy.positioningStatement : "",
      uvp: typeof ws.strategy?.uvp === "string" ? ws.strategy.uvp : "",
      voiceTraits: Array.isArray(ws.strategy?.voiceTraits) ? ws.strategy.voiceTraits : [],
    },
    // Everything already in a brand's files was put there deliberately, so it
    // is approved. Only content created as exploration — moodboard imagery,
    // mockup drafts — starts anywhere else, and none of that exists yet in a
    // snapshot old enough to need this backfill.
    assets: (Array.isArray(ws.assets) ? ws.assets : []).map((a) => ({
      ...a,
      status: a.status === "exploration" || a.status === "archived" ? a.status : "approved",
    })),
    departmentViews: (Array.isArray(ws.departmentViews) ? ws.departmentViews : []).map((d) => ({
      ...d,
      guidelineText: typeof d.guidelineText === "string" ? d.guidelineText : "",
      items: Array.isArray(d.items) ? d.items : [],
      instructionSections: Array.isArray(d.instructionSections) ? d.instructionSections : [],
      publishToSite: typeof d.publishToSite === "boolean" ? d.publishToSite : true,
    })),
    developer: ws.developer ?? { apiKey: "mk_test_legacy", webhookUrl: "", figmaConnected: false },
    team: Array.isArray(ws.team) ? ws.team : [],
    approvals: Array.isArray(ws.approvals) ? ws.approvals : [],
    versionHistory: Array.isArray(ws.versionHistory) ? ws.versionHistory : [],
    whiteLabel: typeof ws.whiteLabel === "boolean" ? ws.whiteLabel : false,
    complianceChecks: Array.isArray(ws.complianceChecks) ? ws.complianceChecks : [],
    drafts: Array.isArray(ws.drafts) ? ws.drafts : [],
    briefs: Array.isArray(ws.briefs) ? ws.briefs : [],
    moodboards: Array.isArray(ws.moodboards) ? ws.moodboards.map(migrateMoodboard) : [],
    // An existing brand has been worked on, so "discovery" would be wrong for
    // it. A published one is live; anything else is somewhere in the middle,
    // and "design" is the least presumptuous guess.
    stage: STAGES.includes(ws.stage) ? ws.stage : ws.published ? "live" : "design",
    customBlocks: Array.isArray(ws.customBlocks) ? ws.customBlocks : [],
    shareLinks: Array.isArray(ws.shareLinks) ? ws.shareLinks : [],
    hiddenSections: Array.isArray(ws.hiddenSections) ? ws.hiddenSections : [],
    sectionTitles: ws.sectionTitles && typeof ws.sectionTitles === "object" ? ws.sectionTitles : {},
    sectionNotes: ws.sectionNotes && typeof ws.sectionNotes === "object" ? ws.sectionNotes : {},
    strategyTranslation:
      ws.strategyTranslation && typeof ws.strategyTranslation === "object"
        ? {
            source: ws.strategyTranslation.source === "machine" ? "machine" : "manual",
            translatedAt:
              typeof ws.strategyTranslation.translatedAt === "number" ? ws.strategyTranslation.translatedAt : null,
            direction: ws.strategyTranslation.direction ?? null,
            unreviewed: Array.isArray(ws.strategyTranslation.unreviewed) ? ws.strategyTranslation.unreviewed : [],
          }
        : { source: "manual", translatedAt: null, direction: null, unreviewed: [] },
    sectionOrder: Array.isArray(ws.sectionOrder) ? ws.sectionOrder : [],
    sectionStyles: ws.sectionStyles && typeof ws.sectionStyles === "object" ? ws.sectionStyles : {},
    sectionOptions: ws.sectionOptions && typeof ws.sectionOptions === "object" ? ws.sectionOptions : {},
    siteMode: ws.siteMode === "light" || ws.siteMode === "dark" ? ws.siteMode : "auto",
    published: ws.published ?? null,
    publishedAt: typeof ws.publishedAt === "number" ? ws.publishedAt : null,
    guidelineTemplate:
      ws.guidelineTemplate === "vault" ||
      ws.guidelineTemplate === "docs" ||
      ws.guidelineTemplate === "studio" ||
      ws.guidelineTemplate === "deck" ||
      ws.guidelineTemplate === "manual" ||
      ws.guidelineTemplate === "mosaic"
        ? ws.guidelineTemplate
        : "studio",
    studioStyle:
      ws.studioStyle === "signal" || ws.studioStyle === "atlas" || ws.studioStyle === "prism"
        ? ws.studioStyle
        : "prism",
    pages: Array.isArray(ws.pages) ? ws.pages : [],
  }));

  return parsed;
}

export function createLocalAdapter(): BrandRepository {
  /** data: URL -> IndexedDB key, so the same file keeps one stored copy. */
  const blobKeys = new Map<string, string>();
  /** Keys already written, so a save only stores files that are actually new. */
  let persistedKeys = new Set<string>();

  return {
    async load() {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;

        // File payloads live in IndexedDB; the snapshot holds only tokens.
        let blobs = new Map<string, string>();
        try {
          blobs = await readAllBlobs();
        } catch {
          // No IndexedDB (private mode, blocked storage) — uploads simply
          // won't restore; everything else still hydrates normally.
        }
        // Reuse the existing key for a payload already on disk so re-saving
        // doesn't write a second copy of the same file.
        for (const [key, dataUrl] of blobs) {
          blobKeys.set(dataUrl, key);
          persistedKeys.add(key);
        }

        const parsed = restoreBlobs(JSON.parse(raw), blobs) as AppState;
        if (!parsed || !Array.isArray(parsed.workspaces)) return null;
        return migrate(parsed);
      } catch {
        // Corrupt storage — the caller seeds defaults rather than showing a
        // blank screen.
        return null;
      }
    },

    async save(state: AppState): Promise<SaveResult> {
      // Pull every uploaded file out of the snapshot before it is serialized —
      // what lands in localStorage is only metadata plus one short token per
      // file, which keeps it far below the ~5MB origin quota no matter how
      // much the studio uploads.
      const blobs = new Map<string, string>();
      const keyFor = (dataUrl: string) => {
        const existing = blobKeys.get(dataUrl);
        if (existing) return existing;
        const key = uid();
        blobKeys.set(dataUrl, key);
        return key;
      };
      const stripped = stripBlobs(state, blobs, keyFor);

      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stripped));
      } catch (err) {
        // Loud on purpose: silently swallowing this is what used to make every
        // edit after a large upload vanish on reload with no sign anything had
        // gone wrong.
        console.error("Markyos: could not save workspace state.", err);
        return { ok: false, error: "could not save workspace state" };
      }

      const keep = new Set(blobs.keys());
      const added = new Map<string, string>();
      for (const [key, dataUrl] of blobs) {
        if (!persistedKeys.has(key)) added.set(key, dataUrl);
      }
      let removed = false;
      for (const key of persistedKeys) {
        if (!keep.has(key)) {
          removed = true;
          break;
        }
      }
      // Rewriting every payload on each keystroke would mean writing megabytes
      // per edit, so only new files are stored, and stale ones are collected
      // only once something actually stops being referenced.
      if (added.size === 0 && !removed) return { ok: true };

      try {
        await writeBlobs(added, keep);
        persistedKeys = keep;
        return { ok: true };
      } catch (err) {
        console.error("Markyos: could not save uploaded files.", err);
        return { ok: false, error: "could not save uploaded files" };
      }
    },

    markSessionAlive(alive: boolean) {
      writeSessionAlive(alive);
    },
  };
}
