import { AppState, Asset, PublishedSnapshot, ShareLink, Workspace } from "../types";
import { BlockStyle } from "../types";
import { SectionOptions } from "@/features/guideline-site/model/sectionOptions";

/**
 * The entity operations, as pure state transitions.
 *
 * `BrandRepository` is widening from one snapshot-shaped `save` into the
 * operations the architecture names — createWorkspace, updateSection, putAsset,
 * publish, createShareLink (Revision 3.2 §10 item 4). When `ServerAdapter`
 * lands, `save` cannot stay: you do not PUT the universe over HTTP.
 *
 * What lives here is the *meaning* of each operation, separated from where the
 * result is stored. Three reasons that separation is worth the file:
 *
 *   1. **It is testable.** Tests here run in Node with no DOM, so there is no
 *      `localStorage` to shim and no browser to drive. `publish` is the most
 *      security-sensitive transition in the product and until now its only
 *      coverage was a browser sweep.
 *
 *   2. **Both adapters need the same answer.** `LocalAdapter` applies a
 *      transition and writes one snapshot; `ServerAdapter` will apply the same
 *      transition optimistically while the server confirms it. If each owned
 *      its own copy, the optimistic result and the stored one would drift, and
 *      the drift would show up as a flicker nobody could reproduce.
 *
 *   3. **One implementation, not two.** `lib/store.tsx` calls these rather than
 *      keeping its own copy, which is the only way a rule like "exploration
 *      never reaches a client" can be enforced in one place.
 *
 * Every function here is pure: it takes state and returns new state, touches
 * nothing outside its arguments, and reads no clock it was not handed. `now` is
 * a parameter for exactly that reason — a transition that reads `Date.now()`
 * itself cannot be tested for what it stamps.
 */

/** A section's editable parts, as one patch. See `updateSection`. */
export interface SectionPatch {
  title?: { en?: string; ar?: string };
  note?: { en?: string; ar?: string };
  style?: BlockStyle | null;
  options?: SectionOptions | null;
  hidden?: boolean;
}

/**
 * Collections that are the studio's own working material and never the
 * client's.
 *
 * Named rather than derived, and that asymmetry is deliberate. Copying the
 * whole workspace and subtracting is the right default for anything the site
 * *displays*, because a new display field then works without anyone
 * remembering this file. It is the wrong default for anything private, because
 * a new private field would leak by being forgotten.
 *
 * So: if a collection is added to the Creation Layer, it belongs on this list.
 * The moodboard sweep fails if one is not.
 */
const PRIVATE_COLLECTIONS = ["moodboards", "drafts", "briefs"] as const;

/**
 * Build the snapshot `/v/<slug>` will serve.
 *
 * A full copy rather than a list of the fields the site happens to read today:
 * adding a field later cannot then silently leak into the live site by being
 * left out of the snapshot.
 *
 * Two subtractions, and both are rules rather than conveniences:
 *
 * **Exploration never reaches a client.** Moodboard imagery and mockup drafts
 * are somebody else's photographs and a designer's thinking out loud; neither
 * is the studio's to hand over. Filtering here rather than in each template is
 * what makes it hold for every surface at once — the snapshot is the only thing
 * the client's route reads, so an asset absent from it cannot appear on the
 * site, in an export, or through the API however a template is written.
 * Archived files go too: retired from the brand is retired.
 *
 * **The Creation Layer does not ship.** Filtering assets by status covered the
 * files and missed everything around them: a moodboard holds notes, links and
 * swatches that are not assets at all, and the drafts queue holds proposals
 * that were considered and rejected — precisely the record a client should
 * never read.
 */
export function buildPublishedSnapshot(ws: Workspace): PublishedSnapshot {
  // Strip the previous snapshot before copying, or each publish nests the last
  // one inside the new one and the stored state doubles in size every time.
  const { published: _prev, publishedAt: _prevAt, ...rest } = ws;
  void _prev;
  void _prevAt;

  const snapshot = structuredCloneish(rest) as PublishedSnapshot;

  snapshot.assets = snapshot.assets.filter((a) => a.status === "approved");

  for (const key of PRIVATE_COLLECTIONS) {
    // Typed as a write to a known-array field rather than `any`, so adding a
    // non-array name to the list above is a compile error and not a silent
    // no-op at runtime.
    (snapshot[key] as unknown[]) = [];
  }

  return snapshot;
}

/** Publish: attach a fresh snapshot and stamp when it was taken. */
export function publishWorkspace(ws: Workspace, now: number): Workspace {
  return { ...ws, published: buildPublishedSnapshot(ws), publishedAt: now };
}

/**
 * Unpublish: take the site offline without touching the draft.
 *
 * The client's link stops resolving to anything; nothing the studio has done
 * is lost, which is what makes this safe to press.
 */
export function unpublishWorkspace(ws: Workspace): Workspace {
  return { ...ws, published: null, publishedAt: null };
}

/**
 * Apply a patch to one section of the guideline.
 *
 * A section is not a record — it is six maps keyed by section id (titles,
 * notes, styles, options, order, hidden) — so "update section" means touching
 * whichever of those the patch names. Gathering that into one operation is
 * what lets `ServerAdapter` send one request instead of six.
 *
 * Null clears rather than merges, for `style` and `options`. "Back to the
 * template's own default" has to be expressible, and an empty object is not the
 * same thing as absence: `resolveOptions` treats a missing key as "fall back"
 * and an empty array as a real choice.
 */
export function applySectionPatch(ws: Workspace, sectionId: string, patch: SectionPatch): Workspace {
  const next: Workspace = { ...ws };

  if (patch.title) next.sectionTitles = mergeOverride(ws.sectionTitles, sectionId, patch.title);
  if (patch.note) next.sectionNotes = mergeOverride(ws.sectionNotes, sectionId, patch.note);

  if (patch.style !== undefined) {
    const styles = { ...ws.sectionStyles };
    if (patch.style === null) delete styles[sectionId];
    else styles[sectionId] = patch.style;
    next.sectionStyles = styles;
  }

  if (patch.options !== undefined) {
    const options = { ...ws.sectionOptions };
    if (patch.options === null) delete options[sectionId];
    else options[sectionId] = patch.options;
    next.sectionOptions = options;
  }

  if (patch.hidden !== undefined) {
    const hidden = new Set(ws.hiddenSections);
    if (patch.hidden) hidden.add(sectionId);
    else hidden.delete(sectionId);
    next.hiddenSections = [...hidden];
  }

  return next;
}

/**
 * Add or replace an asset, by id.
 *
 * Upsert rather than separate add and update calls, because the caller that
 * knows an asset's id usually does not know whether the server has seen it —
 * a retried upload is the ordinary case, not the exception, and two operations
 * would make a retry create a duplicate.
 */
export function putAssetIn(ws: Workspace, asset: Asset): Workspace {
  const i = ws.assets.findIndex((a) => a.id === asset.id);
  if (i === -1) return { ...ws, assets: [...ws.assets, asset] };
  const assets = [...ws.assets];
  assets[i] = asset;
  return { ...ws, assets };
}

/**
 * Remove an asset, and every reference to it.
 *
 * The references are the point. A guideline section, a logo slot or a
 * moodboard item holding the id of a file that no longer exists renders as a
 * hole, and the hole appears on the client's site rather than in the editor
 * where somebody would notice. Clearing them here means no caller has to
 * remember which collections can point at an asset.
 */
export function removeAssetFrom(ws: Workspace, assetId: string): Workspace {
  const next: Workspace = {
    ...ws,
    assets: ws.assets.filter((a) => a.id !== assetId),
  };

  // Typography's two font references.
  if (ws.typography.latinFontAssetId === assetId) {
    next.typography = { ...next.typography, latinFontAssetId: undefined };
  }
  if (ws.typography.arabicFontAssetId === assetId) {
    next.typography = { ...next.typography, arabicFontAssetId: undefined };
  }

  // A department's attached guideline file.
  next.departmentViews = ws.departmentViews.map((d) =>
    d.guidelineFileAssetId === assetId ? { ...d, guidelineFileAssetId: undefined } : d,
  );

  // Moodboard cards that *are* the asset go; a note that merely mentions it
  // stays. Items hang off zones rather than off the board, because a zone is
  // the region that files a card — see `lib/moodboard/zones.ts`.
  next.moodboards = ws.moodboards.map((board) => ({
    ...board,
    zones: board.zones.map((zone) => ({
      ...zone,
      items: zone.items.filter((item) => !(item.kind === "asset" && item.assetId === assetId)),
    })),
  }));

  return next;
}

/** Add a share link. */
export function addShareLinkTo(ws: Workspace, link: ShareLink): Workspace {
  return { ...ws, shareLinks: [...ws.shareLinks, link] };
}

/**
 * Revoke a share link.
 *
 * Stamped, not deleted. "This link was revoked on the 14th" is the answer to a
 * client asking why their bookmark stopped working, and a deleted row cannot
 * give it. Revoking twice keeps the first time, because that is when access
 * actually ended.
 */
export function revokeShareLinkIn(ws: Workspace, linkId: string, now: number): Workspace {
  return {
    ...ws,
    shareLinks: ws.shareLinks.map((l) =>
      l.id === linkId && l.revokedAt === null ? { ...l, revokedAt: now } : l,
    ),
  };
}

/** Add a workspace to the state. Rejects a duplicate slug, which is the public URL. */
export function addWorkspaceTo(state: AppState, ws: Workspace): AppState {
  if (state.workspaces.some((w) => w.slug === ws.slug)) return state;
  return { ...state, workspaces: [...state.workspaces, ws] };
}

/** Replace one workspace by id, leaving the rest alone. */
export function replaceWorkspaceIn(state: AppState, ws: Workspace): AppState {
  return {
    ...state,
    workspaces: state.workspaces.map((w) => (w.id === ws.id ? ws : w)),
  };
}

/**
 * Merge a per-language override, the way the store has always done it.
 *
 * Three details, each of which the first version of this function got wrong
 * and the store had right — worth naming, because "consolidate onto the shared
 * function" is only an improvement if the shared one is the careful one:
 *
 *   * **Trimmed.** A heading of three spaces is not a heading.
 *
 *   * **Emptied means `undefined`, not `""`.** Both read as falsy, but an empty
 *     string survives `JSON.stringify` and `undefined` is dropped, so storing
 *     `""` leaves the key in the snapshot forever.
 *
 *   * **An entry with nothing left in it is deleted**, not kept as `{}`. That
 *     is what keeps "has this been overridden?" a presence check, and what
 *     makes clearing a rename genuinely restore the template's own heading.
 */
function mergeOverride(
  map: Record<string, { en?: string; ar?: string }>,
  sectionId: string,
  patch: { en?: string; ar?: string },
): Record<string, { en?: string; ar?: string }> {
  const next = { ...map };
  const merged = { ...(next[sectionId] ?? {}) };

  for (const lang of ["en", "ar"] as const) {
    if (!(lang in patch)) continue;
    const value = (patch[lang] ?? "").trim();
    merged[lang] = value || undefined;
  }

  if (!merged.en && !merged.ar) delete next[sectionId];
  else next[sectionId] = merged;
  return next;
}

/**
 * A deep copy that does not depend on `structuredClone`.
 *
 * The snapshot has to be a copy and not a reference, or a later edit to the
 * draft would change what the client is already being served. `structuredClone`
 * is in every target browser and in Node 22, but it throws on anything
 * non-cloneable, and a workspace is plain JSON by construction — so the JSON
 * round-trip is both sufficient and the thing the prototype already relied on.
 * Named rather than inlined so the reason survives.
 */
function structuredCloneish<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
