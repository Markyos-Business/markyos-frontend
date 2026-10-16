"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ApprovalStatus,
  Account,
  AppState,
  Asset,
  AssetStatus,
  AssetType,
  BlockKind,
  BlockStyle,
  Brief,
  BriefTemplateKind,
  ColorSwatch,
  ComplianceCheck,
  CoreValue,
  Competitor,
  CompetitorColumn,
  DepartmentViewItem,
  DeptInstructionSection,
  Draft,
  DomainStatus,
  GuidelineTemplate,
  GuidePage,
  Lang,
  LogoSlot,
  Moodboard,
  MoodboardEdge,
  MoodboardItem,
  MoodboardView,
  MoodboardZone,
  MoodItemKind,
  PageBlock,
  PinSection,
  PlanKind,
  Persona,
  ShareLink,
  ShareScope,
  SlotKind,
  SsoConfig,
  StrategyTextField,
  StrategyTranslation,
  StudioStyle,
  TeamRole,
  Typography,
  VoiceTrait,
  Workspace,
  WorkspaceStage,
  ZoneKind,
} from "./types";
import type { SectionOptions } from "./sectionOptions";
import { between, nBetween } from "./doc/core/order";
import { zonesFromTemplate } from "./moodboard/zones";
import { withoutPosition } from "./moodboard/layout";
import {
  DEMO_ACCOUNT_ID,
  buildDemoAccount,
  buildInitialWorkspaces,
  defaultBilling,
  defaultClientAccess,
  defaultDeveloper,
  defaultCompetitorColumns,
  defaultTypography,
} from "./mockData";
import { BRIEF_TEMPLATES, QUESTION_BY_KEY } from "./briefQuestions";
import { initialsFor, slugify, uid } from "./utils";
import {
  EMAIL_RE,
  RESET_TTL_MS,
  hashPassword,
  newResetToken,
  normaliseEmail,
  verifyPassword,
} from "./auth";
import { validateSubdomain } from "./subdomain";
import { BrandRepository } from "./repository";
// The entity operations, as pure state transitions. The store calls these
// rather than keeping its own copy — see the file's own note on why there is
// exactly one implementation of what reaches a client.
import { publishWorkspace, removeAssetFrom, unpublishWorkspace } from "./adapters/entityOps";
import { createLocalAdapter } from "./adapters/localAdapter";

/** How many edits back undo reaches. Entries share structure, so the cost of a
 *  deep history is an array per step, not a copy of every brand. */
const UNDO_LIMIT = 60;

// A block that starts totally empty (blank stat, unanswered FAQ, a button
// with no label) reads as broken the instant it's added — not "zero code."
// These give every new block real placeholder content the studio edits in
// place, rather than a void they have to fill before it looks like anything.
function pickableAssets(ws: Workspace): Asset[] {
  return ws.assets.filter((a): a is Asset => (["photo", "icon", "mockup", "export"] as AssetType[]).includes(a.type));
}

function pickableFileAssets(ws: Workspace): Asset[] {
  return ws.assets.filter((a): a is Asset => (["pdf", "font", "mockup", "export"] as AssetType[]).includes(a.type));
}

/** Fills in an image/gallery/files block's assetIds from whatever's already
 *  in the Assets Manager, if the block doesn't already specify its own —
 *  used both for a freshly-added single block and for every such block that
 *  comes in as part of a prebuilt template. */
function withAssetDefaults(ws: Workspace, block: Omit<PageBlock, "id" | "order">): Omit<PageBlock, "id" | "order"> {
  if (block.assetIds && block.assetIds.length > 0) return block;
  if (block.kind === "files") {
    const pickable = pickableFileAssets(ws);
    return pickable.length === 0 ? block : { ...block, assetIds: pickable.slice(0, 6).map((a) => a.id) };
  }
  if (block.kind !== "image" && block.kind !== "gallery") return block;
  const pickable = pickableAssets(ws);
  if (pickable.length === 0) return block;
  const assetIds = block.kind === "image" ? [pickable[0].id] : pickable.slice(0, 8).map((a) => a.id);
  return { ...block, assetIds };
}

function blockDefaults(kind: BlockKind): Partial<PageBlock> {
  switch (kind) {
    case "columns":
      return { columnCount: 2 };
    case "spacer":
      return { size: "md" };
    case "button":
      return { title: "Learn more", arTitle: "اعرف المزيد", linkUrl: "" };
    case "stat":
      return { title: "100+", arTitle: "+100", text: "Projects delivered", arText: "مشروع تم تسليمه" };
    case "faq":
      return {
        title: "Question goes here?",
        arTitle: "السؤال هنا؟",
        text: "Answer goes here — click to edit.",
        arText: "الإجابة هنا — اضغط للتعديل.",
      };
    case "socialLinks":
      return { socialLinks: [{ id: uid(), platform: "Instagram", url: "" }] };
    case "form":
      return {
        title: "Get in touch",
        arTitle: "تواصل معنا",
        text: "We'll get back to you within a day.",
        arText: "سنرد عليك خلال يوم واحد.",
        linkUrl: "",
      };
    case "brandLogo":
      return { title: "Logo", arTitle: "الشعار" };
    case "brandColors":
      return { title: "Colors", arTitle: "الألوان" };
    case "brandType":
      return { title: "Typography", arTitle: "الخطوط" };
    case "brandIcons":
      return { title: "Icons", arTitle: "الأيقونات" };
    case "files":
      return { title: "Brand files", arTitle: "ملفات الهوية" };
    default:
      return {};
  }
}

/** Every block-editing action below works on either Home's customBlocks
 *  (pageId omitted) or one custom GuidePage's own block list (pageId given)
 *  — these two helpers are the only place that distinction lives, so the
 *  actions themselves don't need two copies. */
function getBlockList(ws: Workspace, pageId?: string): PageBlock[] {
  if (!pageId) return ws.customBlocks;
  return ws.pages.find((p) => p.id === pageId)?.blocks ?? [];
}

function withBlockList(ws: Workspace, pageId: string | undefined, blocks: PageBlock[]): Partial<Workspace> {
  if (!pageId) return { customBlocks: blocks };
  return { pages: ws.pages.map((p) => (p.id === pageId ? { ...p, blocks } : p)) };
}

function defaultState(): AppState {
  return {
    session: null,
    // Seeded signed-out: the demo brands exist and belong to the demo account,
    // and getting to them means signing in as it, like any other account.
    accounts: [buildDemoAccount()],
    resets: [],
    workspaces: buildInitialWorkspaces(),
    auditLog: [],
    sso: { enabled: false, provider: "", domain: "" },
  };
}

interface AppContextValue {
  state: AppState;
  hydrated: boolean;
  /**
   * Registers a new account and signs it in. Resolves to an error message, or
   * null on success. Rejects an email another account already uses.
   */
  signup: (name: string, email: string, password: string) => Promise<string | null>;
  /**
   * Signs in. Resolves to an error message when the credentials don't match,
   * and null on success — a password that is stored has to actually be
   * checked, or the change-password form is decoration.
   */
  login: (email: string, password: string, remember?: boolean) => Promise<string | null>;
  logout: () => void;
  /** Edits the signed-in person's own details. Returns an error, or null. */
  updateAccount: (patch: Partial<Pick<Account, "name" | "email">>) => string | null;
  /** Changes the password. `current` is always required. */
  setAccountPassword: (next: string, current?: string) => Promise<string | null>;
  /**
   * Starts a reset. Returns the one-time code, or null when no account
   * matches — callers must say the same thing either way.
   */
  requestPasswordReset: (email: string) => string | null;
  /** Completes a reset. Resolves to an error message, or null. */
  resetPassword: (token: string, next: string) => Promise<string | null>;
  /** The signed-in account's own brands. Empty when signed out. */
  myWorkspaces: Workspace[];
  getWorkspace: (slug: string) => Workspace | undefined;
  createWorkspace: (name: string) => Workspace;
  /** The brand's own language — what the client sees first. */
  setPrimaryLocale: (workspaceId: string, primaryLocale: Lang) => void;
  /** The signed-in person's interface language. `null` follows the brand. */
  setAdminLang: (adminLang: Lang | null) => void;
  /** Which language to draw the studio chrome in. See the implementation. */
  uiLang: (ws?: Pick<Workspace, "primaryLocale"> | null) => Lang;
  setOverview: (workspaceId: string, html: string) => void;
  addColor: (workspaceId: string, swatch: Omit<ColorSwatch, "id">) => void;
  updateColor: (workspaceId: string, colorId: string, patch: { name: string; hex: string }) => void;
  removeColor: (workspaceId: string, colorId: string) => void;
  /** Moves the primary marker to this swatch, clearing it from the others. */
  setPrimaryColor: (workspaceId: string, colorId: string) => void;
  setTypography: (workspaceId: string, patch: Partial<Typography>) => void;
  setFontAsset: (workspaceId: string, script: "latin" | "arabic", assetId: string | null) => void;
  updateLogoSlot: (workspaceId: string, kind: SlotKind, patch: Partial<LogoSlot>) => void;
  setLogoUsageNotes: (workspaceId: string, text: string) => void;
  setLogoColorIds: (workspaceId: string, ids: string[]) => void;
  setBrandDetails: (workspaceId: string, patch: Partial<{ industry: string; tagline: string; foundedYear: string }>) => void;
  toggleClientPassword: (workspaceId: string, enabled: boolean) => void;
  setClientPassword: (workspaceId: string, password: string) => void;
  setCustomDomain: (workspaceId: string, domain: string) => void;
  setDomainStatus: (workspaceId: string, status: DomainStatus) => void;
  /** Claims a subdomain. Returns an error message, or null when it was taken. */
  setSubdomain: (workspaceId: string, subdomain: string) => string | null;
  markPurchased: (workspaceId: string, plan: PlanKind, stripeSessionId?: string) => void;
  // v3.0 developer / Figma
  setApiKey: (workspaceId: string, key: string) => void;
  setWebhookUrl: (workspaceId: string, url: string) => void;
  toggleFigmaSync: (workspaceId: string, connected: boolean) => void;
  // v5.0 white-label
  toggleWhiteLabel: (workspaceId: string, on: boolean) => void;
  setGuidelineTemplate: (workspaceId: string, template: GuidelineTemplate) => void;
  setStudioStyle: (workspaceId: string, style: StudioStyle) => void;
  // v2.0 sign-off pins
  /**
   * Move a brand along the lifecycle board.
   *
   * Moved by hand rather than inferred from activity: a studio knows when a
   * brand has gone to review, and guessing it from an edit timestamp would be
   * confidently wrong at the exact moment someone is relying on the board.
   */
  setWorkspaceStage: (workspaceId: string, stage: WorkspaceStage) => void;
  // The Creation Layer — moodboard
  /** A board, built from a template's zones when one is named. */
  createMoodboard: (workspaceId: string, title: string, templateKey?: string) => string;
  renameMoodboard: (workspaceId: string, boardId: string, title: string) => void;
  deleteMoodboard: (workspaceId: string, boardId: string) => void;
  addMoodboardZone: (workspaceId: string, boardId: string, title: string, kind?: ZoneKind) => void;
  patchMoodboardZone: (
    workspaceId: string,
    boardId: string,
    zoneId: string,
    patch: Partial<MoodboardZone>,
  ) => void;
  removeMoodboardZone: (workspaceId: string, boardId: string, zoneId: string) => void;
  updateMoodboardItem: (
    workspaceId: string,
    boardId: string,
    itemId: string,
    patch: Partial<MoodboardItem>,
  ) => void;
  /** Moves a card into a zone, above `beforeId` — or to the end without one. */
  moveMoodboardItem: (
    workspaceId: string,
    boardId: string,
    itemId: string,
    toZoneId: string,
    beforeId?: string | null,
  ) => void;
  /**
   * Puts cards in a zone. An `asset` card references an existing asset and
   * never copies it; a note, a swatch and a link carry their own content,
   * because text with no bytes has no business in brand files.
   */
  addMoodboardItems: (
    workspaceId: string,
    boardId: string,
    zoneId: string,
    items: Array<Partial<MoodboardItem> & { kind: MoodItemKind }>,
  ) => void;
  removeMoodboardItem: (workspaceId: string, boardId: string, itemId: string) => void;
  /**
   * Puts a deleted card back exactly as it was, with its edges.
   *
   * Deleting a card takes its position, its votes and its connections with it,
   * and a board is a place where things are moved around and changed their
   * mind about — so the delete is cheap and the undo has to exist. This is not
   * a general undo stack: it is the one action whose loss is unrecoverable and
   * whose reversal is exact, which is why it takes the whole card and the
   * edges rather than an id.
   */
  restoreMoodboardItem: (
    workspaceId: string,
    boardId: string,
    zoneId: string,
    item: MoodboardItem,
    edges: MoodboardEdge[],
  ) => void;
  /** Toggles this person's vote. One per person, not a counter — see the type. */
  voteMoodboardItem: (workspaceId: string, boardId: string, itemId: string) => void;
  /**
   * Puts a card at a point on the canvas, and files it in whichever zone that
   * point is inside.
   *
   * Position and filing are one action because on a freeform board they are the
   * same gesture: dropping a swatch inside the Palette frame is how it becomes
   * part of the palette. Splitting them would mean a card could be visibly in a
   * frame and filed somewhere else, which is the one thing a spatial interface
   * must never allow.
   */
  placeMoodboardItem: (
    workspaceId: string,
    boardId: string,
    itemId: string,
    at: { x: number; y: number; w?: number; h?: number },
    toZoneId?: string,
  ) => void;
  /** Moves or resizes a zone's frame. */
  placeMoodboardZone: (
    workspaceId: string,
    boardId: string,
    zoneId: string,
    at: { x: number; y: number; w?: number; h?: number },
  ) => void;
  /** Connects two cards, or disconnects them if they already are. */
  connectMoodboardItems: (workspaceId: string, boardId: string, fromId: string, toId: string) => void;
  removeMoodboardEdge: (workspaceId: string, boardId: string, edgeId: string) => void;
  labelMoodboardEdge: (workspaceId: string, boardId: string, edgeId: string, label: string) => void;
  setMoodboardView: (workspaceId: string, boardId: string, view: MoodboardView) => void;
  /**
   * Throws away every stored position, so the whole board falls back to the
   * derived layout in lib/moodboard/layout.ts.
   *
   * Clearing rather than computing: the layout is already a pure function of
   * the board, so the way to "tidy" is to stop overriding it. Writing computed
   * coordinates instead would freeze today's layout into the data and mean the
   * next improvement to it never reached a board anyone had tidied.
   */
  tidyMoodboard: (workspaceId: string, boardId: string) => void;
  // The Creation Layer — discovery brief
  /** Returns the new brief's id. */
  createBrief: (workspaceId: string, template: BriefTemplateKind, label: string, clientName: string, lang: Lang) => string;
  setBriefQuestions: (workspaceId: string, briefId: string, questions: string[]) => void;
  setBriefMeta: (workspaceId: string, briefId: string, patch: Partial<Pick<Brief, "label" | "clientName" | "lang">>) => void;
  /** Marks it sent, which is what makes the public link live. */
  sendBrief: (workspaceId: string, briefId: string) => void;
  revokeBrief: (workspaceId: string, briefId: string) => void;
  deleteBrief: (workspaceId: string, briefId: string) => void;
  /** Look a brief up by its public token — used by /b/[token], with no session. */
  getBriefByToken: (token: string) => { brief: Brief; workspace: Workspace } | undefined;
  /** Save one answer as the client types. Flips the brief to in_progress. */
  answerBrief: (token: string, questionKey: string, value: string) => void;
  /**
   * The client is done.
   *
   * Every answer whose question maps to a Strategy Hub field becomes a *pending
   * draft*, never a write. What a client typed into a form is a useful starting
   * point and not the brand's positioning statement until someone who does this
   * for a living has read it.
   */
  submitBrief: (token: string) => void;
  /**
   * Queue a proposal. Returns its id.
   *
   * Producers — the discovery brief, document import, palette extraction, and
   * later the AI assistant — call this instead of writing to the brand
   * directly. That is the whole contract: a producer cannot change a published
   * guideline or a Strategy Hub field, because the only route in is a draft
   * someone has to accept.
   */
  addDraft: (
    workspaceId: string,
    draft: Omit<Draft, "id" | "createdAt" | "status" | "decidedAt" | "decidedBy">
  ) => string;
  /** Write a pending draft into the brand and mark it accepted. */
  acceptDraft: (workspaceId: string, draftId: string) => void;
  rejectDraft: (workspaceId: string, draftId: string) => void;
  addSignOffPin: (workspaceId: string, section: PinSection, authorName: string, note: string) => void;
  resolveSignOffPin: (workspaceId: string, pinId: string) => void;
  // v3.0 strategy hub
  /** Writes one narrative field. `lang` picks which of the two copies. */
  setStrategyText: (workspaceId: string, field: StrategyTextField, value: string, lang?: Lang) => void;
  addPersona: (workspaceId: string, persona: Omit<Persona, "id">) => void;
  updatePersona: (workspaceId: string, personaId: string, patch: Partial<Omit<Persona, "id">>) => void;
  removePersona: (workspaceId: string, personaId: string) => void;
  addVoiceTrait: (workspaceId: string, trait: Omit<VoiceTrait, "id">) => void;
  updateVoiceTrait: (workspaceId: string, traitId: string, patch: Partial<Omit<VoiceTrait, "id">>) => void;
  removeVoiceTrait: (workspaceId: string, traitId: string) => void;
  addCoreValue: (workspaceId: string, value: Omit<CoreValue, "id">) => void;
  updateCoreValue: (workspaceId: string, valueId: string, patch: Partial<Omit<CoreValue, "id">>) => void;
  removeCoreValue: (workspaceId: string, valueId: string) => void;
  /** Records that the Arabic copy came from a machine, and what still needs review. */
  setStrategyTranslation: (workspaceId: string, patch: Partial<StrategyTranslation>) => void;
  /** Clears one field's "needs review" flag — a human has now read it. */
  markStrategyReviewed: (workspaceId: string, fieldKey: string) => void;
  addCompetitor: (workspaceId: string, competitor: { name: string; notes?: string; cells?: Record<string, string> }) => void;
  updateCompetitor: (workspaceId: string, competitorId: string, patch: Partial<Omit<Competitor, "id">>) => void;
  setCompetitorColumns: (workspaceId: string, columns: CompetitorColumn[]) => void;
  /** Renames the brand. The slug is deliberately left alone — see the action. */
  renameWorkspace: (workspaceId: string, name: string) => void;
  removeCompetitor: (workspaceId: string, competitorId: string) => void;
  // Pillar 1 — brand assets manager
  /**
   * Returns the new asset's id, so a caller can select what it just added.
   *
   * `status` is optional and defaults to "approved", because every caller today
   * is a deliberate upload into the brand's own files. The Moodboard passes
   * "exploration" instead, which is what keeps third-party inspiration out of
   * every published surface without each of those surfaces having to know the
   * Moodboard exists.
   */
  addAsset: (
    workspaceId: string,
    asset: Omit<Asset, "id" | "uploadedAt" | "versions" | "status"> & { status?: AssetStatus }
  ) => string;
  setAssetStatus: (workspaceId: string, assetId: string, status: AssetStatus) => void;
  removeAsset: (workspaceId: string, assetId: string) => void;
  setAssetTags: (workspaceId: string, assetId: string, tags: string[]) => void;
  /**
   * Corrects a file's type.
   *
   * The uploader guesses from the filename, and a guess it gets wrong used to
   * be permanent — a pattern filed as "export" never appeared in the Pattern
   * section, and there was no way to say so.
   */
  setAssetType: (workspaceId: string, assetId: string, type: AssetType) => void;
  renameAsset: (workspaceId: string, assetId: string, fileName: string) => void;
  addAssetVersion: (workspaceId: string, assetId: string, file: { url: string; fileName: string; sizeKB: number }) => void;
  restoreAssetVersion: (workspaceId: string, assetId: string, versionId: string) => void;
  // Pillar 3 — department views (selections, not copies)
  addDepartmentView: (workspaceId: string, name: string) => string;
  renameDepartmentView: (workspaceId: string, viewId: string, name: string) => void;
  removeDepartmentView: (workspaceId: string, viewId: string) => void;
  addDeptItem: (workspaceId: string, viewId: string, item: Omit<DepartmentViewItem, "id">) => void;
  removeDeptItem: (workspaceId: string, viewId: string, itemId: string) => void;
  setDeptGuideline: (workspaceId: string, viewId: string, patch: { guidelineText?: string; guidelineFileAssetId?: string }) => void;
  /** Replaces a department's instruction page wholesale — what a file import produces. */
  setDeptInstructions: (workspaceId: string, viewId: string, sections: DeptInstructionSection[]) => void;
  setDeptPublish: (workspaceId: string, viewId: string, publish: boolean) => void;
  // v4.0 team
  addTeamMember: (workspaceId: string, name: string, email: string, role: TeamRole) => void;
  removeTeamMember: (workspaceId: string, memberId: string) => void;
  setTeamRole: (workspaceId: string, memberId: string, role: TeamRole) => void;
  /**
   * Hands this brand over. The named member becomes the owner and whoever was
   * owner becomes an editor — there is exactly one owner, and a transfer that
   * left two would leave nobody able to say who decides.
   */
  transferOwnership: (workspaceId: string, memberId: string) => void;
  // Read-only share links
  createShareLink: (workspaceId: string, scope: ShareScope, departmentId?: string) => string;
  revokeShareLink: (workspaceId: string, linkId: string) => void;
  restoreShareLink: (workspaceId: string, linkId: string) => void;
  /** Finds a link across every workspace — what the public /s/<token> route resolves with. */
  resolveShareLink: (token: string) => { ws: Workspace; link: ShareLink } | undefined;
  // v4.0 approvals
  proposeApproval: (workspaceId: string, summary: string, proposedBy: string) => void;
  resolveApproval: (workspaceId: string, approvalId: string, status: ApprovalStatus, reviewNote?: string) => void;
  // v4.0 version history
  saveVersionSnapshot: (workspaceId: string, label: string, createdBy: string) => void;
  restoreVersion: (workspaceId: string, versionId: string) => void;
  // v5.0 compliance + SSO + audit
  addComplianceCheck: (workspaceId: string, check: Omit<ComplianceCheck, "id" | "createdAt">) => void;
  setSso: (patch: Partial<SsoConfig>) => void;
  logAudit: (action: string, target: string) => void;
  // Guidelines editor — freeform, reorderable sections. `pageId` omitted
  // targets Home's own customBlocks; passed, it targets that GuidePage's
  // independent block list instead.
  addBlock: (
    workspaceId: string,
    kind: BlockKind,
    pageId?: string,
    opts?: {
      /** Set both to drop the block into one column of a layout container. */
      parentId?: string;
      columnIndex?: number;
      /** Insert directly after this block instead of appending to the end. */
      after?: string;
    }
    /** The new block's id, so a caller can select what it just created. */
  ) => string;
  updateBlock: (workspaceId: string, blockId: string, patch: Partial<PageBlock>, pageId?: string) => void;
  removeBlock: (workspaceId: string, blockId: string, pageId?: string) => void;
  /** Copies a block (with its children, if it's a container) in directly below it. */
  duplicateBlock: (workspaceId: string, blockId: string, pageId?: string) => string | null;
  reorderBlocks: (workspaceId: string, orderedIds: string[], pageId?: string) => void;
  /** Shows or hides one of the fixed guideline-site sections. */
  toggleSectionHidden: (workspaceId: string, sectionId: string) => void;
  /**
   * The order Home's sections render in — derived ids and "block-<id>" in one
   * list, so a custom section can sit between two fixed ones.
   */
  setSectionOrder: (workspaceId: string, orderedIds: string[]) => void;
  /**
   * Merges design overrides into a block. A field set to undefined is cleared.
   *
   * `replace` takes the patch as the whole style instead. The inspector needs
   * it because a style now nests — removing a phone override means writing a
   * *smaller* `bp` object, and a merge of two objects can only ever grow one.
   */
  setBlockStyle: (
    workspaceId: string,
    blockId: string,
    patch: Partial<BlockStyle>,
    pageId?: string,
    opts?: { replace?: boolean },
  ) => void;
  /** The same, for a derived section, which has no block to hold a style. */
  setSectionStyle: (
    workspaceId: string,
    sectionId: string,
    patch: Partial<BlockStyle>,
    opts?: { replace?: boolean },
  ) => void;
  /**
   * What a derived section shows inside itself — which value formats a palette
   * prints, which scripts a specimen sets, and so on. A patch; `undefined` for a
   * key returns that part to its default. See `lib/sectionOptions.ts`.
   */
  setSectionOptions: (workspaceId: string, sectionId: string, patch: Partial<SectionOptions>) => void;
  /** Rewrites a derived section's heading. An empty value clears the override
   *  and the section goes back to its template's own wording. */
  setSectionTitle: (workspaceId: string, sectionId: string, lang: Lang, value: string) => void;
  /** Rewrites the line of copy under a derived section's heading. */
  setSectionNote: (workspaceId: string, sectionId: string, lang: Lang, value: string) => void;
  /** Forces the client-facing site's ground light or dark, or back to inferring it. */
  setSiteMode: (workspaceId: string, mode: Workspace["siteMode"]) => void;
  /** Copies the current draft to the live site clients see. */
  publishGuideline: (workspaceId: string) => void;
  /** Takes the live site down; the draft is untouched. */
  unpublishGuideline: (workspaceId: string) => void;
  addTemplateBlocks: (workspaceId: string, blocks: Omit<PageBlock, "id" | "order">[], pageId?: string) => void;
  autoFillBlocks: (workspaceId: string) => void;
  // Guidelines editor — custom pages beyond Home, each with its own URL
  addPage: (workspaceId: string, name: string) => string;
  renamePage: (workspaceId: string, pageId: string, name: string, arName?: string) => void;
  removePage: (workspaceId: string, pageId: string) => void;
  reorderPages: (workspaceId: string, orderedIds: string[]) => void;
  /**
   * Steps one brand edit back. The builder hands people real destructive power
   * — delete a section, restyle it, drag it somewhere else — so there has to be
   * a way back that isn't "retype it". Covers workspace edits only (not login
   * or the audit log), and is in-memory: a reload starts a fresh history rather
   * than resurrecting yesterday's.
   */
  undo: () => void;
  canUndo: boolean;
  /** Steps forward again through what undo walked back. Cleared by a new edit. */
  redo: () => void;
  canRedo: boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(() => defaultState());
  const [hydrated, setHydrated] = useState(false);
  /**
   * Where this provider stores things. Swapping this one line for a
   * ServerAdapter is the whole point of the interface — no component and no
   * action below knows which implementation it is talking to.
   *
   * A lazy `useState` initialiser rather than a ref assigned during render:
   * the adapter must be constructed exactly once, and writing a ref while
   * rendering is the pattern that breaks under concurrent rendering.
   */
  const [repo] = useState<BrandRepository>(() => createLocalAdapter());

  useEffect(() => {
    // One-time hydration on mount — deliberately deferred out of the render
    // path to avoid an SSR/CSR mismatch. `hydrated` (React state, not a ref)
    // is what gates the persist effect below, so that effect only ever
    // observes this same, already-corrected `state`.
    let cancelled = false;
    (async () => {
      const loaded = await repo.load();
      if (cancelled) return;
      // A null load means nothing stored yet, or storage that could not be
      // read. Either way the defaults already in state are what to show.
      if (loaded) setState(loaded);
      setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
    // `repo` comes from a lazy useState initialiser, so it is created once and
    // never changes identity. It is listed because the linter cannot see that,
    // not because this should ever re-run.
  }, [repo]);

  useEffect(() => {
    if (!hydrated) return;
    void repo.save(state);
  }, [state, hydrated, repo]);

  const touchWorkspace = useCallback(
    (ws: Workspace, patch: Partial<Workspace>): Workspace => ({
      ...ws,
      ...patch,
      updatedAt: Date.now(),
    }),
    []
  );

  /**
   * The previous workspace lists, most recent last.
   *
   * Each entry is the array itself, not a deep copy: every mutation rebuilds
   * only the workspace it touched, so the other entries are shared by
   * reference and a step of history costs one array rather than a clone of
   * every brand. `depth` mirrors both stacks' lengths as state, because a ref
   * changing can't re-render the buttons that read them.
   */
  const undoStack = useRef<Workspace[][]>([]);
  /**
   * The states undone away from, most recent last.
   *
   * Undo without redo is a trap rather than a safety net: it makes trying
   * something out cost an edit you can't get back if you change your mind
   * twice. Same shape and same sharing as the undo stack — a step is one array.
   */
  const redoStack = useRef<Workspace[][]>([]);
  const [depth, setDepth] = useState({ undo: 0, redo: 0 });
  /**
   * The committed state, readable from a callback that must not re-create
   * itself on every change. Kept in sync here rather than listed as a
   * dependency so `mutateWorkspace` stays referentially stable — it is in the
   * dependency array of nearly every action in this file.
   */
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const mutateWorkspace = useCallback(
    (workspaceId: string, fn: (ws: Workspace) => Workspace) => {
      // Pushed before the change, from the last committed state — an updater
      // passed to setState has to stay pure, and React may run it more than
      // once, which would push the same step twice.
      undoStack.current = [...undoStack.current.slice(-(UNDO_LIMIT - 1)), stateRef.current.workspaces];
      // A fresh edit is a new branch of history: what was undone is no longer
      // reachable forward, which is how every editor behaves and the only rule
      // that keeps redo from restoring a state this edit never came from.
      redoStack.current = [];
      setDepth({ undo: undoStack.current.length, redo: 0 });
      setState((prev) => ({
        ...prev,
        workspaces: prev.workspaces.map((w) => (w.id === workspaceId ? fn(w) : w)),
      }));
    },
    []
  );

  const undo = useCallback(() => {
    const previous = undoStack.current.pop();
    if (!previous) {
      setDepth((d) => (d.undo === 0 ? d : { ...d, undo: 0 }));
      return;
    }
    redoStack.current = [...redoStack.current.slice(-(UNDO_LIMIT - 1)), stateRef.current.workspaces];
    setDepth({ undo: undoStack.current.length, redo: redoStack.current.length });
    setState((prev) => ({ ...prev, workspaces: previous }));
  }, []);

  const redo = useCallback(() => {
    const next = redoStack.current.pop();
    if (!next) {
      setDepth((d) => (d.redo === 0 ? d : { ...d, redo: 0 }));
      return;
    }
    undoStack.current = [...undoStack.current.slice(-(UNDO_LIMIT - 1)), stateRef.current.workspaces];
    setDepth({ undo: undoStack.current.length, redo: redoStack.current.length });
    setState((prev) => ({ ...prev, workspaces: next }));
  }, []);

  const logAudit = useCallback((action: string, target: string) => {
    setState((prev) => ({
      ...prev,
      auditLog: [
        {
          id: uid(),
          ts: Date.now(),
          actor: prev.session?.name || prev.session?.email || "System",
          action,
          target,
        },
        ...prev.auditLog,
      ].slice(0, 200),
    }));
  }, []);

  /*
   * ------------------------------------------------------------------ auth
   *
   * Every one of these is async, which they did not used to be. Deriving a key
   * with PBKDF2 is asynchronous by construction in WebCrypto, and there is no
   * synchronous way back — so the cost of not storing passwords in the clear is
   * that the four calls which touch one have to be awaited. The forms already
   * had to handle a returned error string, so they take a promise of the same
   * string instead.
   *
   * They read the current state through `stateRef` rather than inside a
   * `setState` updater, because the check has to happen *before* the awaited
   * hash and the write *after* it. Doing the work inside an updater would mean
   * an async updater, which React will call more than once.
   */

  const findByEmail = useCallback((email: string) => {
    const wanted = normaliseEmail(email);
    return stateRef.current.accounts.find((a) => normaliseEmail(a.email) === wanted);
  }, []);

  const signup = useCallback(
    async (name: string, email: string, password: string): Promise<string | null> => {
      const clean = normaliseEmail(email);
      if (!EMAIL_RE.test(clean)) return "Enter a valid email address.";
      if (password.length < 8) return "Use at least 8 characters.";
      if (findByEmail(clean)) {
        return "An account already uses that email. Log in instead, or reset the password.";
      }
      const displayName = name.trim() || clean.split("@")[0];
      const hashed = await hashPassword(password);
      repo.markSessionAlive(true);
      const account: Account = {
        id: uid(),
        name: displayName,
        email: clean,
        password: hashed,
        passwordUpdatedAt: Date.now(),
        createdAt: Date.now(),
        lastLoginAt: Date.now(),
        // No stated preference: the app follows whichever brand they open,
        // which is the right first impression for someone who has not been
        // asked yet.
        adminLang: null,
      };
      setState((prev) => ({
        ...prev,
        accounts: [...prev.accounts, account],
        // A new account starts with no brands. It does not inherit whatever
        // was already in this browser — that was the old bug, and it handed a
        // stranger someone else's work.
        session: {
          accountId: account.id,
          name: account.name,
          email: account.email,
          startedAt: Date.now(),
          remember: true,
        },
      }));
      return null;
    },
    [findByEmail, repo]
  );

  const login = useCallback(
    async (email: string, password: string, remember = true): Promise<string | null> => {
      const account = findByEmail(email);
      // Same sentence whether the email is unknown or the password is wrong.
      // Telling them apart turns the form into a way to ask which addresses
      // have accounts here, and it does not help the person who simply
      // mistyped one of the two.
      const WRONG = "That email and password don't match an account.";
      if (!account) return WRONG;

      const { ok, needsUpgrade } = await verifyPassword(password, account.password);
      if (!ok) return WRONG;

      // The one moment the plain password is in hand and verified — so it is
      // the only chance to re-hash a record left in the clear by an older
      // build without making the person type it again.
      const upgraded = needsUpgrade ? await hashPassword(password) : null;
      repo.markSessionAlive(true);

      setState((prev) => ({
        ...prev,
        accounts: prev.accounts.map((a) =>
          a.id === account.id
            ? { ...a, lastLoginAt: Date.now(), ...(upgraded ? { password: upgraded } : {}) }
            : a
        ),
        session: {
          accountId: account.id,
          name: account.name,
          email: account.email,
          startedAt: Date.now(),
          remember,
        },
      }));
      return null;
    },
    [findByEmail, repo]
  );

  const logout = useCallback(() => {
    // The account records deliberately survive: signing out is not the same as
    // forgetting who you are, and the derived key has to still be there to
    // check against on the way back in.
    repo.markSessionAlive(false);
    setState((prev) => ({ ...prev, session: null }));
  }, [repo]);

  const updateAccount = useCallback(
    (patch: Partial<Pick<Account, "name" | "email">>): string | null => {
      const current = stateRef.current;
      const id = current.session?.accountId;
      if (!id) return "You need to be signed in.";

      if (patch.email !== undefined) {
        const clean = normaliseEmail(patch.email);
        if (!EMAIL_RE.test(clean)) return "Enter a valid email address.";
        // The email is the thing you sign in with, so letting two accounts
        // share one would lock the second person out of their own brands.
        const clash = current.accounts.find(
          (a) => a.id !== id && normaliseEmail(a.email) === clean
        );
        if (clash) return "Another account in this browser already uses that email.";
        patch = { ...patch, email: clean };
      }

      setState((prev) => {
        const accounts = prev.accounts.map((a) => (a.id === id ? { ...a, ...patch } : a));
        const account = accounts.find((a) => a.id === id);
        return {
          ...prev,
          accounts,
          // The session carries the display copy, so it has to move with it or
          // the top bar keeps showing the old name until the next sign-in.
          session:
            prev.session && account
              ? { ...prev.session, name: account.name, email: account.email }
              : prev.session,
        };
      });
      return null;
    },
    []
  );

  const setAccountPassword = useCallback(
    async (next: string, current?: string): Promise<string | null> => {
      const id = stateRef.current.session?.accountId;
      const account = stateRef.current.accounts.find((a) => a.id === id);
      if (!account) return "You need to be signed in.";
      if (next.length < 8) return "Use at least 8 characters.";

      const { ok } = await verifyPassword(current ?? "", account.password);
      if (!ok) return "Your current password doesn't match.";

      const hashed = await hashPassword(next);
      setState((prev) => ({
        ...prev,
        accounts: prev.accounts.map((a) =>
          a.id === account.id ? { ...a, password: hashed, passwordUpdatedAt: Date.now() } : a
        ),
      }));
      return null;
    },
    []
  );

  /**
   * Starts a reset and hands back the token.
   *
   * In production this is the point where an email goes out and the caller
   * learns nothing. There is no mail server here, so the token is returned and
   * the page shows it — which is the honest version of the same flow, and the
   * screen says as much rather than staging a "check your inbox" that will
   * never arrive.
   *
   * Returns null when no account matches, and the caller still says the same
   * thing either way: a reset form that confirms which addresses are
   * registered is a way to enumerate them.
   */
  const requestPasswordReset = useCallback((email: string): string | null => {
    const account = findByEmail(email);
    if (!account) return null;
    const token = newResetToken();
    setState((prev) => ({
      ...prev,
      resets: [
        // One live reset per account: asking again should replace the last
        // token, not leave both working.
        ...prev.resets.filter(
          (r) => r.accountId !== account.id && Date.now() - r.requestedAt < RESET_TTL_MS
        ),
        { accountId: account.id, token, requestedAt: Date.now() },
      ],
    }));
    return token;
  }, [findByEmail]);

  const resetPassword = useCallback(
    async (token: string, next: string): Promise<string | null> => {
      const clean = token.trim().toUpperCase();
      const reset = stateRef.current.resets.find((r) => r.token === clean);
      if (!reset) return "That reset code isn't recognised.";
      if (Date.now() - reset.requestedAt > RESET_TTL_MS) {
        return "That reset code has expired. Request a new one.";
      }
      if (next.length < 8) return "Use at least 8 characters.";
      const account = stateRef.current.accounts.find((a) => a.id === reset.accountId);
      if (!account) return "That reset code isn't recognised.";

      const hashed = await hashPassword(next);
      setState((prev) => ({
        ...prev,
        accounts: prev.accounts.map((a) =>
          a.id === account.id ? { ...a, password: hashed, passwordUpdatedAt: Date.now() } : a
        ),
        // Burn the token. A reset code that still works after it has been used
        // is a second password.
        resets: prev.resets.filter((r) => r.token !== clean),
        // Deliberately not signed in here. Whoever just changed the password
        // proves it by using it.
        session: null,
      }));
      return null;
    },
    []
  );

  /**
   * Unfiltered on purpose.
   *
   * The client viewer at /v/<slug> and a share link at /s/<token> both resolve
   * a workspace through here while nobody is signed in — that is the entire
   * point of those routes. Ownership is enforced where it belongs, on the
   * studio-admin shell at /w/<slug>, and the gallery reads `myWorkspaces`.
   */
  const getWorkspace = useCallback(
    (slug: string) => state.workspaces.find((w) => w.slug === slug),
    [state.workspaces]
  );

  /** The signed-in account's own brands — what the gallery and billing list. */
  const myWorkspaces = useMemo(() => {
    const id = state.session?.accountId;
    if (!id) return [];
    return state.workspaces.filter((w) => w.ownerAccountId === id);
  }, [state.workspaces, state.session?.accountId]);

  const createWorkspace = useCallback((name: string): Workspace => {
    const base = slugify(name);
    let slug = base;
    let n = 2;
    setState((prev) => {
      while (prev.workspaces.some((w) => w.slug === slug)) {
        slug = `${base}-${n++}`;
      }
      return prev;
    });
    const now = Date.now();
    const ws: Workspace = {
      id: uid(),
      // Whoever is signed in owns what they make. Falling back to the demo
      // account keeps a brand from becoming orphaned if this is somehow
      // reached with no session — it would otherwise appear in no gallery at
      // all and be unreachable except by typing its URL.
      ownerAccountId: stateRef.current.session?.accountId ?? DEMO_ACCOUNT_ID,
      slug,
      name,
      initials: initialsFor(name),
      primaryLocale: "en",
      sharedStatus: "draft",
      createdAt: now,
      updatedAt: now,
      overviewHtml: "",
      overviewSavedAt: now,
      industry: "",
      tagline: "",
      foundedYear: "",
      colors: [],
      typography: defaultTypography(),
      clientAccess: defaultClientAccess(),
      billing: defaultBilling(),
      logo: {
        arabic: { kind: "arabic", phase: "empty", clearspaceMultiplier: 0.5 },
        latin: { kind: "latin", phase: "empty", clearspaceMultiplier: 0.5 },
        symbol: { kind: "symbol", phase: "empty", clearspaceMultiplier: 0.5 },
      },
      logoUsageNotes: "",
      logoColorIds: [],
      signOffPins: [],
      strategy: {
        purpose: "",
        mission: "",
        vision: "",
        coreValues: [],
        targetAudienceSummary: "",
        personas: [],
        competitors: [],
        positioningStatement: "",
        uvp: "",
        voiceTraits: [],
        competitorColumns: defaultCompetitorColumns(),
      },
      assets: [],
      departmentViews: [],
      developer: defaultDeveloper(),
      team: [],
      approvals: [],
      versionHistory: [],
      whiteLabel: false,
      complianceChecks: [],
      drafts: [],
      briefs: [],
      moodboards: [],
      // A brand nobody has done anything to yet is in discovery by definition.
      stage: "discovery",
      customBlocks: [],
      shareLinks: [],
      hiddenSections: [],
      sectionTitles: {},
      sectionNotes: {},
      strategyTranslation: { source: "manual", translatedAt: null, direction: null, unreviewed: [] },
      sectionOrder: [],
      sectionStyles: {},
      sectionOptions: {},
      siteMode: "auto",
      published: null,
      publishedAt: null,
      guidelineTemplate: "studio",
      studioStyle: "prism",
      pages: [],
    };
    setState((prev) => ({ ...prev, workspaces: [ws, ...prev.workspaces] }));
    return ws;
  }, []);

  /** The brand's own language. Owner-level: it changes what the client sees. */
  const setPrimaryLocale = useCallback(
    (workspaceId: string, primaryLocale: Lang) => {
      mutateWorkspace(workspaceId, (ws) => touchWorkspace(ws, { primaryLocale }));
    },
    [mutateWorkspace, touchWorkspace]
  );

  /**
   * The signed-in person's own interface language.
   *
   * Not on a workspace, so it does not go through `mutateWorkspace` and does
   * not touch `updatedAt` on anything — changing the language you read the app
   * in is not an edit to a brand, and before the split it was recorded as one.
   */
  const setAdminLang = useCallback(
    (adminLang: Lang | null) => {
      setState((s) => {
        const id = s.session?.accountId;
        if (!id) return s;
        return { ...s, accounts: s.accounts.map((a) => (a.id === id ? { ...a, adminLang } : a)) };
      });
    },
    [setState]
  );

  /**
   * Which language to draw the studio interface in, for the person using it.
   *
   * A plain function rather than a hook on purpose: several call sites need it
   * inside JSX and inside `.map()`, where a hook cannot go.
   *
   * Falls back to the brand's own locale when the person has stated no
   * preference, which is what the single `lang` field used to do — so an
   * existing browser renders exactly as it did until someone chooses.
   *
   * Read off `state` rather than `stateRef`, and listed as a dependency, so
   * that choosing a language produces a new function identity and the context
   * consumers actually repaint. Through the ref it would always return the
   * right answer and never cause anyone to ask for it again.
   */
  const adminLangPref =
    state.accounts.find((a) => a.id === state.session?.accountId)?.adminLang ?? null;

  const uiLang = useCallback(
    (ws?: Pick<Workspace, "primaryLocale"> | null): Lang =>
      adminLangPref ?? ws?.primaryLocale ?? "en",
    [adminLangPref]
  );

  const setOverview = useCallback(
    (workspaceId: string, html: string) => {
      mutateWorkspace(workspaceId, (ws) =>
        touchWorkspace(ws, { overviewHtml: html, overviewSavedAt: Date.now() })
      );
    },
    [mutateWorkspace, touchWorkspace]
  );

  const setBrandDetails = useCallback(
    (workspaceId: string, patch: Partial<{ industry: string; tagline: string; foundedYear: string }>) => {
      mutateWorkspace(workspaceId, (ws) => touchWorkspace(ws, patch));
    },
    [mutateWorkspace, touchWorkspace]
  );

  const addColor = useCallback(
    (workspaceId: string, swatch: Omit<ColorSwatch, "id">) => {
      mutateWorkspace(workspaceId, (ws) =>
        touchWorkspace(ws, { colors: [...ws.colors, { ...swatch, id: uid() }] })
      );
    },
    [mutateWorkspace, touchWorkspace]
  );

  const updateColor = useCallback(
    (workspaceId: string, colorId: string, patch: { name: string; hex: string }) => {
      mutateWorkspace(workspaceId, (ws) =>
        touchWorkspace(ws, {
          colors: ws.colors.map((c) => (c.id === colorId ? { ...c, ...patch } : c)),
        })
      );
    },
    [mutateWorkspace, touchWorkspace]
  );

  /**
   * Removes a swatch, promoting a replacement if it was the primary one.
   *
   * The primary drives the accent everywhere the guideline site is rendered,
   * so deleting it without a successor would silently drop the brand back to
   * the generic fallback palette. Promoting the next swatch keeps the site
   * showing a colour the brand actually owns; the caller is told which.
   */
  const removeColor = useCallback(
    (workspaceId: string, colorId: string) => {
      mutateWorkspace(workspaceId, (ws) => {
        const removed = ws.colors.find((c) => c.id === colorId);
        const rest = ws.colors.filter((c) => c.id !== colorId);
        const needsPromotion = !!removed?.isPrimary && rest.length > 0;
        return touchWorkspace(ws, {
          colors: needsPromotion ? rest.map((c, i) => ({ ...c, isPrimary: i === 0 })) : rest,
        });
      });
    },
    [mutateWorkspace, touchWorkspace]
  );

  /** Moves the primary marker. Exactly one swatch carries it at a time, which
   *  is what `getBrandTheme` relies on to pick the accent. */
  const setPrimaryColor = useCallback(
    (workspaceId: string, colorId: string) => {
      mutateWorkspace(workspaceId, (ws) =>
        touchWorkspace(ws, { colors: ws.colors.map((c) => ({ ...c, isPrimary: c.id === colorId })) })
      );
    },
    [mutateWorkspace, touchWorkspace]
  );

  const setTypography = useCallback(
    (workspaceId: string, patch: Partial<Typography>) => {
      mutateWorkspace(workspaceId, (ws) =>
        touchWorkspace(ws, { typography: { ...ws.typography, ...patch } })
      );
    },
    [mutateWorkspace, touchWorkspace]
  );

  const setFontAsset = useCallback(
    (workspaceId: string, script: "latin" | "arabic", assetId: string | null) => {
      mutateWorkspace(workspaceId, (ws) =>
        touchWorkspace(ws, {
          typography: {
            ...ws.typography,
            [script === "latin" ? "latinFontAssetId" : "arabicFontAssetId"]: assetId ?? undefined,
          },
        })
      );
    },
    [mutateWorkspace, touchWorkspace]
  );

  const updateLogoSlot = useCallback(
    (workspaceId: string, kind: SlotKind, patch: Partial<LogoSlot>) => {
      mutateWorkspace(workspaceId, (ws) =>
        touchWorkspace(ws, { logo: { ...ws.logo, [kind]: { ...ws.logo[kind], ...patch } } })
      );
    },
    [mutateWorkspace, touchWorkspace]
  );

  const setLogoUsageNotes = useCallback(
    (workspaceId: string, text: string) => {
      mutateWorkspace(workspaceId, (ws) => touchWorkspace(ws, { logoUsageNotes: text }));
    },
    [mutateWorkspace, touchWorkspace]
  );

  const setLogoColorIds = useCallback(
    (workspaceId: string, ids: string[]) => {
      mutateWorkspace(workspaceId, (ws) => touchWorkspace(ws, { logoColorIds: ids }));
    },
    [mutateWorkspace, touchWorkspace]
  );

  const toggleClientPassword = useCallback(
    (workspaceId: string, enabled: boolean) => {
      mutateWorkspace(workspaceId, (ws) =>
        touchWorkspace(ws, { clientAccess: { ...ws.clientAccess, passwordEnabled: enabled } })
      );
      logAudit(enabled ? "Enabled password protection" : "Disabled password protection", workspaceId);
    },
    [mutateWorkspace, touchWorkspace, logAudit]
  );

  const setClientPassword = useCallback(
    (workspaceId: string, password: string) => {
      mutateWorkspace(workspaceId, (ws) =>
        touchWorkspace(ws, { clientAccess: { ...ws.clientAccess, password } })
      );
    },
    [mutateWorkspace, touchWorkspace]
  );

  /**
   * Claims a subdomain, or says why it can't be.
   *
   * The uniqueness check is against every brand in this account. That is the
   * whole population this build can see — there is no server to ask — so the
   * UI says "in your account" rather than implying it has checked the world.
   */
  const setSubdomain = useCallback(
    (workspaceId: string, subdomain: string): string | null => {
      const value = subdomain.trim().toLowerCase();
      if (value) {
        const check = validateSubdomain(value);
        if (check) return check;
        const taken = state.workspaces.some(
          (w) => w.id !== workspaceId && w.clientAccess.subdomain.toLowerCase() === value
        );
        if (taken) return "That subdomain is already used by another brand in your account.";
      }
      mutateWorkspace(workspaceId, (ws) => touchWorkspace(ws, { clientAccess: { ...ws.clientAccess, subdomain: value } }));
      return null;
    },
    [state.workspaces, mutateWorkspace, touchWorkspace]
  );

  const setCustomDomain = useCallback(
    (workspaceId: string, domain: string) => {
      mutateWorkspace(workspaceId, (ws) =>
        touchWorkspace(ws, {
          clientAccess: { ...ws.clientAccess, customDomain: domain, domainStatus: domain ? "pending" : "none" },
        })
      );
    },
    [mutateWorkspace, touchWorkspace]
  );

  const setDomainStatus = useCallback(
    (workspaceId: string, status: DomainStatus) => {
      mutateWorkspace(workspaceId, (ws) =>
        touchWorkspace(ws, { clientAccess: { ...ws.clientAccess, domainStatus: status } })
      );
      if (status === "verified") logAudit("Verified custom domain", workspaceId);
    },
    [mutateWorkspace, touchWorkspace, logAudit]
  );

  const markPurchased = useCallback(
    (workspaceId: string, plan: PlanKind, stripeSessionId?: string) => {
      mutateWorkspace(workspaceId, (ws) =>
        touchWorkspace(ws, { billing: { plan, purchasedAt: Date.now(), stripeSessionId }, sharedStatus: "shared" })
      );
      logAudit(`Purchased ${plan === "pass" ? "Project Pass" : "Studio plan"}`, workspaceId);
    },
    [mutateWorkspace, touchWorkspace, logAudit]
  );

  const setApiKey = useCallback(
    (workspaceId: string, key: string) => {
      mutateWorkspace(workspaceId, (ws) => touchWorkspace(ws, { developer: { ...ws.developer, apiKey: key } }));
    },
    [mutateWorkspace, touchWorkspace]
  );

  const setWebhookUrl = useCallback(
    (workspaceId: string, url: string) => {
      mutateWorkspace(workspaceId, (ws) => touchWorkspace(ws, { developer: { ...ws.developer, webhookUrl: url } }));
    },
    [mutateWorkspace, touchWorkspace]
  );

  const toggleFigmaSync = useCallback(
    (workspaceId: string, connected: boolean) => {
      mutateWorkspace(workspaceId, (ws) =>
        touchWorkspace(ws, {
          developer: { ...ws.developer, figmaConnected: connected, figmaSyncedAt: connected ? Date.now() : undefined },
        })
      );
    },
    [mutateWorkspace, touchWorkspace]
  );

  const toggleWhiteLabel = useCallback(
    (workspaceId: string, on: boolean) => {
      mutateWorkspace(workspaceId, (ws) => touchWorkspace(ws, { whiteLabel: on }));
      logAudit(on ? "Enabled white-label" : "Disabled white-label", workspaceId);
    },
    [mutateWorkspace, touchWorkspace, logAudit]
  );

  const setGuidelineTemplate = useCallback(
    (workspaceId: string, template: GuidelineTemplate) => {
      mutateWorkspace(workspaceId, (ws) => touchWorkspace(ws, { guidelineTemplate: template }));
    },
    [mutateWorkspace, touchWorkspace]
  );

  const setStudioStyle = useCallback(
    (workspaceId: string, style: StudioStyle) => {
      mutateWorkspace(workspaceId, (ws) => touchWorkspace(ws, { studioStyle: style }));
    },
    [mutateWorkspace, touchWorkspace]
  );

  const setWorkspaceStage = useCallback(
    (workspaceId: string, stage: WorkspaceStage) => {
      mutateWorkspace(workspaceId, (ws) => (ws.stage === stage ? ws : touchWorkspace(ws, { stage })));
      logAudit(`Moved to ${stage}`, workspaceId);
    },
    [mutateWorkspace, touchWorkspace, logAudit]
  );

  const createMoodboard = useCallback(
    (workspaceId: string, title: string, templateKey?: string): string => {
      const id = uid();
      mutateWorkspace(workspaceId, (ws) =>
        touchWorkspace(ws, {
          moodboards: [
            {
              id,
              title,
              createdAt: Date.now(),
              templateKey,
              zones: zonesFromTemplate(templateKey),
              edges: [],
              // The canvas is the board. The column view is a mode you switch
              // into, not the thing a new board starts as.
              view: "canvas" as const,
            },
            ...ws.moodboards,
          ],
        })
      );
      return id;
    },
    [mutateWorkspace, touchWorkspace]
  );

  const patchMoodboard = useCallback(
    (workspaceId: string, boardId: string, fn: (b: Moodboard) => Moodboard) => {
      mutateWorkspace(workspaceId, (ws) =>
        touchWorkspace(ws, { moodboards: ws.moodboards.map((b) => (b.id === boardId ? fn(b) : b)) })
      );
    },
    [mutateWorkspace, touchWorkspace]
  );

  const renameMoodboard = useCallback(
    (workspaceId: string, boardId: string, title: string) => {
      patchMoodboard(workspaceId, boardId, (b) => ({ ...b, title }));
    },
    [patchMoodboard]
  );

  const deleteMoodboard = useCallback(
    (workspaceId: string, boardId: string) => {
      // The board goes; the assets stay. They are the studio's files, and a
      // board is only ever a view over them.
      mutateWorkspace(workspaceId, (ws) =>
        touchWorkspace(ws, { moodboards: ws.moodboards.filter((b) => b.id !== boardId) })
      );
    },
    [mutateWorkspace, touchWorkspace]
  );

  /**
   * Adds cards to a zone, at the end.
   *
   * The order keys are generated between the last existing card and nothing,
   * so adding never renumbers a card somebody else may be dragging. That is
   * overkill for one browser and exactly right for the room this becomes.
   */
  const addMoodboardItems = useCallback(
    (
      workspaceId: string,
      boardId: string,
      zoneId: string,
      items: Array<Partial<MoodboardItem> & { kind: MoodItemKind }>,
    ) => {
      const who = stateRef.current.session?.name ?? "You";
      patchMoodboard(workspaceId, boardId, (b) => ({
        ...b,
        zones: b.zones.map((z) => {
          if (z.id !== zoneId) return z;
          const sorted = [...z.items].sort((a, c) => (a.order < c.order ? -1 : 1));
          const last = sorted.length ? sorted[sorted.length - 1].order : null;
          // An asset already on this zone is not added twice; a note or a
          // swatch has no identity to compare, so duplicates there are the
          // person's business.
          const present = new Set(z.items.map((i) => i.assetId).filter(Boolean));
          const fresh = items.filter((i) => !i.assetId || !present.has(i.assetId));
          const keys = nBetween(last, null, fresh.length);
          return {
            ...z,
            items: [
              ...z.items,
              ...fresh.map((item, i) => ({
                size: "m" as const,
                votes: [],
                createdBy: who,
                createdAt: Date.now(),
                ...item,
                id: uid(),
                order: keys[i],
              })),
            ],
          };
        }),
      }));
    },
    [patchMoodboard]
  );

  const updateMoodboardItem = useCallback(
    (workspaceId: string, boardId: string, itemId: string, patch: Partial<MoodboardItem>) => {
      patchMoodboard(workspaceId, boardId, (b) => ({
        ...b,
        zones: b.zones.map((z) => ({
          ...z,
          items: z.items.map((i) => (i.id === itemId ? { ...i, ...patch } : i)),
        })),
      }));
    },
    [patchMoodboard]
  );

  const removeMoodboardItem = useCallback(
    (workspaceId: string, boardId: string, itemId: string) => {
      patchMoodboard(workspaceId, boardId, (b) => ({
        ...b,
        zones: b.zones.map((z) => ({ ...z, items: z.items.filter((i) => i.id !== itemId) })),
        // An edge to a card that no longer exists would draw a line to nowhere
        // — or, worse, be silently skipped and leave the board quietly
        // accumulating connections nobody can see or delete.
        edges: (b.edges ?? []).filter((e) => e.from !== itemId && e.to !== itemId),
      }));
    },
    [patchMoodboard]
  );

  /**
   * The inverse of the above, for the Undo on the delete toast.
   *
   * Idempotent on both halves: restoring a card that is somehow already there
   * replaces it rather than doubling it, and an edge whose other end has since
   * been deleted is dropped rather than restored as a line to nowhere. Undo is
   * pressed when something has gone wrong, so it must not be the thing that
   * goes wrong next.
   */
  const restoreMoodboardItem = useCallback(
    (workspaceId: string, boardId: string, zoneId: string, item: MoodboardItem, edges: MoodboardEdge[]) => {
      patchMoodboard(workspaceId, boardId, (b) => {
        const ids = new Set<string>();
        for (const z of b.zones) for (const i of z.items) if (i.id !== item.id) ids.add(i.id);
        ids.add(item.id);
        const existing = new Set((b.edges ?? []).map((e) => e.id));
        return {
          ...b,
          zones: b.zones.map((z) =>
            z.id === zoneId
              ? { ...z, items: [...z.items.filter((i) => i.id !== item.id), item] }
              : { ...z, items: z.items.filter((i) => i.id !== item.id) },
          ),
          edges: [
            ...(b.edges ?? []),
            ...edges.filter((e) => !existing.has(e.id) && ids.has(e.from) && ids.has(e.to)),
          ],
        };
      });
    },
    [patchMoodboard]
  );

  /**
   * Puts a card at a point, and files it wherever that point is.
   *
   * The zone is passed in rather than computed here because the hit test needs
   * the *placed* geometry, which is derived in lib/moodboard/layout.ts from a
   * board the canvas already has in hand. Recomputing it here would be the same
   * layout run twice with two chances to disagree.
   */
  const placeMoodboardItem = useCallback(
    (
      workspaceId: string,
      boardId: string,
      itemId: string,
      at: { x: number; y: number; w?: number; h?: number },
      toZoneId?: string,
    ) => {
      patchMoodboard(workspaceId, boardId, (b) => {
        let moving: MoodboardItem | undefined;
        let fromZoneId: string | undefined;
        for (const z of b.zones) {
          const found = z.items.find((i) => i.id === itemId);
          if (found) {
            moving = found;
            fromZoneId = z.id;
          }
        }
        if (!moving || !fromZoneId) return b;

        const placed: MoodboardItem = {
          ...moving,
          x: at.x,
          y: at.y,
          ...(at.w !== undefined ? { w: at.w } : null),
          ...(at.h !== undefined ? { h: at.h } : null),
        };
        const target = toZoneId ?? fromZoneId;
        if (target === fromZoneId) {
          return {
            ...b,
            zones: b.zones.map((z) =>
              z.id !== fromZoneId ? z : { ...z, items: z.items.map((i) => (i.id === itemId ? placed : i)) },
            ),
          };
        }

        // Crossing into another zone. The order key is regenerated at the end of
        // the new zone so the list view has somewhere sensible to show it — the
        // canvas ignores order entirely, but the two views are the same board.
        const stripped = b.zones.map((z) =>
          z.id === fromZoneId ? { ...z, items: z.items.filter((i) => i.id !== itemId) } : z,
        );
        return {
          ...b,
          zones: stripped.map((z) => {
            if (z.id !== target) return z;
            const sorted = [...z.items].sort((a, c) => (a.order < c.order ? -1 : 1));
            const last = sorted.length ? sorted[sorted.length - 1].order : null;
            return { ...z, items: [...z.items, { ...placed, order: between(last, null) }] };
          }),
        };
      });
    },
    [patchMoodboard]
  );

  const placeMoodboardZone = useCallback(
    (
      workspaceId: string,
      boardId: string,
      zoneId: string,
      at: { x: number; y: number; w?: number; h?: number },
    ) => {
      patchMoodboard(workspaceId, boardId, (b) => ({
        ...b,
        zones: b.zones.map((z) =>
          z.id !== zoneId
            ? z
            : {
                ...z,
                x: at.x,
                y: at.y,
                ...(at.w !== undefined ? { w: at.w } : null),
                ...(at.h !== undefined ? { h: at.h } : null),
              },
        ),
      }));
    },
    [patchMoodboard]
  );

  /**
   * Connects two cards, or disconnects them if they already are.
   *
   * Undirected in practice: an existing edge is matched in either direction, so
   * dragging B→A when A→B exists removes it rather than drawing a second line
   * on top of the first. The stored direction only decides which end gets the
   * arrowhead.
   */
  const connectMoodboardItems = useCallback(
    (workspaceId: string, boardId: string, fromId: string, toId: string) => {
      if (fromId === toId) return;
      patchMoodboard(workspaceId, boardId, (b) => {
        const edges = b.edges ?? [];
        const existing = edges.find(
          (e) => (e.from === fromId && e.to === toId) || (e.from === toId && e.to === fromId),
        );
        if (existing) return { ...b, edges: edges.filter((e) => e.id !== existing.id) };
        return { ...b, edges: [...edges, { id: uid(), from: fromId, to: toId }] };
      });
    },
    [patchMoodboard]
  );

  const removeMoodboardEdge = useCallback(
    (workspaceId: string, boardId: string, edgeId: string) => {
      patchMoodboard(workspaceId, boardId, (b) => ({
        ...b,
        edges: (b.edges ?? []).filter((e) => e.id !== edgeId),
      }));
    },
    [patchMoodboard]
  );

  const labelMoodboardEdge = useCallback(
    (workspaceId: string, boardId: string, edgeId: string, label: string) => {
      patchMoodboard(workspaceId, boardId, (b) => ({
        ...b,
        edges: (b.edges ?? []).map((e) => (e.id === edgeId ? { ...e, label } : e)),
      }));
    },
    [patchMoodboard]
  );

  const setMoodboardView = useCallback(
    (workspaceId: string, boardId: string, view: MoodboardView) => {
      patchMoodboard(workspaceId, boardId, (b) => ({ ...b, view }));
    },
    [patchMoodboard]
  );

  const tidyMoodboard = useCallback(
    (workspaceId: string, boardId: string) => {
      // Clearing the overrides, not writing new coordinates. See the note on
      // the signature: the derived layout is the tidy one by construction.
      patchMoodboard(workspaceId, boardId, (b) => ({
        ...b,
        zones: b.zones.map((z) => ({
          ...withoutPosition(z),
          items: z.items.map(withoutPosition),
        })),
      }));
    },
    [patchMoodboard]
  );

  /**
   * Moves a card into a zone, between two neighbours.
   *
   * The new key is computed from the cards it lands between rather than from
   * an index, so a drop is one card's write. `beforeId` names the card it
   * should end up above; nothing means the end of the zone.
   */
  const moveMoodboardItem = useCallback(
    (workspaceId: string, boardId: string, itemId: string, toZoneId: string, beforeId?: string | null) => {
      patchMoodboard(workspaceId, boardId, (b) => {
        let moving: MoodboardItem | undefined;
        const stripped = b.zones.map((z) => {
          const found = z.items.find((i) => i.id === itemId);
          if (found) moving = found;
          return found ? { ...z, items: z.items.filter((i) => i.id !== itemId) } : z;
        });
        if (!moving) return b;
        const card = moving;

        return {
          ...b,
          zones: stripped.map((z) => {
            if (z.id !== toZoneId) return z;
            const sorted = [...z.items].sort((a, c) => (a.order < c.order ? -1 : 1));
            const at = beforeId ? sorted.findIndex((i) => i.id === beforeId) : sorted.length;
            const index = at < 0 ? sorted.length : at;
            const before = index > 0 ? sorted[index - 1].order : null;
            const after = index < sorted.length ? sorted[index].order : null;
            return { ...z, items: [...z.items, { ...card, order: between(before, after) }] };
          }),
        };
      });
    },
    [patchMoodboard]
  );

  /**
   * One vote per person, by name.
   *
   * A toggle rather than a counter, which is what makes "did I already pick
   * this?" answerable — and what stops two people voting at once from losing
   * one of the votes to a read-modify-write race when this reaches a server.
   */
  const voteMoodboardItem = useCallback(
    (workspaceId: string, boardId: string, itemId: string) => {
      const who = stateRef.current.session?.name ?? "You";
      patchMoodboard(workspaceId, boardId, (b) => ({
        ...b,
        zones: b.zones.map((z) => ({
          ...z,
          items: z.items.map((i) =>
            i.id === itemId
              ? { ...i, votes: i.votes.includes(who) ? i.votes.filter((v) => v !== who) : [...i.votes, who] }
              : i,
          ),
        })),
      }));
    },
    [patchMoodboard]
  );

  const addMoodboardZone = useCallback(
    (workspaceId: string, boardId: string, title: string, kind: ZoneKind = "custom") => {
      patchMoodboard(workspaceId, boardId, (b) => {
        const sorted = [...b.zones].sort((a, c) => (a.order < c.order ? -1 : 1));
        // New zones land above Unsorted, which stays the last thing on a board
        // — it is the tray, and a tray in the middle of a board is a zone.
        const trayIndex = sorted.findIndex((z) => z.kind === "unsorted");
        const at = trayIndex < 0 ? sorted.length : trayIndex;
        const before = at > 0 ? sorted[at - 1].order : null;
        const after = at < sorted.length ? sorted[at].order : null;
        return {
          ...b,
          zones: [
            ...b.zones,
            { id: uid(), kind, title, arTitle: "", order: between(before, after), items: [] },
          ],
        };
      });
    },
    [patchMoodboard]
  );

  const patchMoodboardZone = useCallback(
    (workspaceId: string, boardId: string, zoneId: string, patch: Partial<MoodboardZone>) => {
      patchMoodboard(workspaceId, boardId, (b) => ({
        ...b,
        zones: b.zones.map((z) => (z.id === zoneId ? { ...z, ...patch } : z)),
      }));
    },
    [patchMoodboard]
  );

  /**
   * Deletes a zone and sends its cards to the tray.
   *
   * The tray has always been documented as "where a card goes when its zone is
   * removed" and this was throwing them away — an image somebody chose,
   * silently gone because the band it happened to be filed under was renamed
   * out of existence. The cards lose their stored positions on the way, because
   * a position inside a frame that no longer exists is not a position.
   */
  const removeMoodboardZone = useCallback(
    (workspaceId: string, boardId: string, zoneId: string) => {
      patchMoodboard(workspaceId, boardId, (b) => {
        const going = b.zones.find((z) => z.id === zoneId);
        if (!going) return b;
        const tray = b.zones.find((z) => z.kind === "unsorted" && z.id !== zoneId);
        const rest = b.zones.filter((z) => z.id !== zoneId);
        if (!tray || going.items.length === 0) return { ...b, zones: rest };

        const sorted = [...tray.items].sort((a, c) => (a.order < c.order ? -1 : 1));
        const last = sorted.length ? sorted[sorted.length - 1].order : null;
        const keys = nBetween(last, null, going.items.length);
        return {
          ...b,
          zones: rest.map((z) =>
            z.id !== tray.id
              ? z
              : {
                  ...z,
                  items: [
                    ...z.items,
                    ...going.items.map((item, i) => ({ ...withoutPosition(item), order: keys[i] })),
                  ],
                },
          ),
        };
      });
    },
    [patchMoodboard]
  );

  const createBrief = useCallback(
    (workspaceId: string, template: BriefTemplateKind, label: string, clientName: string, lang: Lang): string => {
      const id = uid();
      mutateWorkspace(workspaceId, (ws) =>
        touchWorkspace(ws, {
          briefs: [
            {
              id,
              // Longer than a workspace id: this one is guessable from outside
              // and is the only thing standing between a stranger and a
              // client's answers.
              token: `${uid()}${uid()}`,
              label,
              clientName,
              template,
              status: "draft",
              questions: BRIEF_TEMPLATES[template].questions,
              lang,
              answers: [],
              createdAt: Date.now(),
              sentAt: null,
              submittedAt: null,
              revokedAt: null,
            },
            ...ws.briefs,
          ],
        })
      );
      logAudit(`Created a discovery brief for ${clientName || "a client"}`, workspaceId);
      return id;
    },
    [mutateWorkspace, touchWorkspace, logAudit]
  );

  const patchBrief = useCallback(
    (workspaceId: string, briefId: string, patch: Partial<Brief>) => {
      mutateWorkspace(workspaceId, (ws) =>
        touchWorkspace(ws, {
          briefs: ws.briefs.map((b) => (b.id === briefId ? { ...b, ...patch } : b)),
        })
      );
    },
    [mutateWorkspace, touchWorkspace]
  );

  const setBriefQuestions = useCallback(
    (workspaceId: string, briefId: string, questions: string[]) => {
      patchBrief(workspaceId, briefId, { questions });
    },
    [patchBrief]
  );

  const setBriefMeta = useCallback(
    (workspaceId: string, briefId: string, patch: Partial<Pick<Brief, "label" | "clientName" | "lang">>) => {
      patchBrief(workspaceId, briefId, patch);
    },
    [patchBrief]
  );

  const sendBrief = useCallback(
    (workspaceId: string, briefId: string) => {
      patchBrief(workspaceId, briefId, { status: "sent", sentAt: Date.now(), revokedAt: null });
      logAudit("Sent a discovery brief", workspaceId);
    },
    [patchBrief, logAudit]
  );

  const revokeBrief = useCallback(
    (workspaceId: string, briefId: string) => {
      // Marked, not deleted — a dead link has to be able to say "this was
      // switched off" rather than behave as if it never existed.
      patchBrief(workspaceId, briefId, { revokedAt: Date.now() });
      logAudit("Revoked a discovery brief link", workspaceId);
    },
    [patchBrief, logAudit]
  );

  const deleteBrief = useCallback(
    (workspaceId: string, briefId: string) => {
      mutateWorkspace(workspaceId, (ws) => touchWorkspace(ws, { briefs: ws.briefs.filter((b) => b.id !== briefId) }));
    },
    [mutateWorkspace, touchWorkspace]
  );

  /*
   * Reads `state`, not `stateRef`.
   *
   * The public /b/<token> page calls this during render, and `stateRef` is
   * assigned in an effect — so on the render where `hydrated` first flips true
   * the ref still holds the pre-hydration default state. That made a real brief
   * report as "doesn't exist", with nothing afterwards to trigger a re-render.
   * Depending on `state.workspaces` means the lookup re-runs when hydration
   * lands, which is what every other by-token lookup here already does.
   */
  const getBriefByToken = useCallback(
    (token: string) => {
      for (const workspace of state.workspaces) {
        const brief = workspace.briefs.find((b) => b.token === token);
        if (brief) return { brief, workspace };
      }
      return undefined;
    },
    [state.workspaces]
  );

  const answerBrief = useCallback(
    (token: string, questionKey: string, value: string) => {
      const found = getBriefByToken(token);
      if (!found) return;
      const { workspace, brief } = found;
      if (brief.revokedAt || brief.status === "submitted") return;

      mutateWorkspace(workspace.id, (ws) =>
        touchWorkspace(ws, {
          briefs: ws.briefs.map((b) => {
            if (b.id !== brief.id) return b;
            const answers = b.answers.some((a) => a.questionKey === questionKey)
              ? b.answers.map((a) => (a.questionKey === questionKey ? { ...a, value, answeredAt: Date.now() } : a))
              : [...b.answers, { questionKey, value, answeredAt: Date.now() }];
            // "Sent" and "started" are different conversations to have with a
            // client, so the first saved answer moves it on.
            return { ...b, answers, status: b.status === "submitted" ? b.status : "in_progress" };
          }),
        })
      );
    },
    [getBriefByToken, mutateWorkspace, touchWorkspace]
  );

  const submitBrief = useCallback(
    (token: string) => {
      const found = getBriefByToken(token);
      if (!found) return;
      const { workspace, brief } = found;
      if (brief.revokedAt || brief.status === "submitted") return;

      const now = Date.now();
      const requestedBy = brief.clientName || "the client";

      // Answers become proposals, not writes. This is the whole reason the
      // brief can be handed to someone outside the studio.
      const newDrafts: Draft[] = [];
      for (const answer of brief.answers) {
        const question = QUESTION_BY_KEY.get(answer.questionKey);
        if (!question?.strategyField) continue;
        if (!answer.value.trim()) continue;
        newDrafts.push({
          id: uid(),
          targetType: "strategyField",
          targetRef: question.strategyField,
          content: answer.value.trim(),
          source: "brief",
          provenance: {
            summary: `Discovery brief — “${brief.lang === "ar" ? question.promptAr : question.promptEn}”`,
            inputs: [question.key],
            requestedBy,
          },
          status: "pending",
          createdAt: now,
          decidedAt: null,
          decidedBy: null,
        });
      }

      mutateWorkspace(workspace.id, (ws) =>
        touchWorkspace(ws, {
          briefs: ws.briefs.map((b) =>
            b.id === brief.id ? { ...b, status: "submitted" as const, submittedAt: now } : b
          ),
          drafts: [...newDrafts, ...ws.drafts],
        })
      );
      logAudit(`${requestedBy} submitted the discovery brief`, workspace.id);
    },
    [getBriefByToken, mutateWorkspace, touchWorkspace, logAudit]
  );

  const addDraft = useCallback(
    (
      workspaceId: string,
      draft: Omit<Draft, "id" | "createdAt" | "status" | "decidedAt" | "decidedBy">
    ): string => {
      const id = uid();
      mutateWorkspace(workspaceId, (ws) =>
        touchWorkspace(ws, {
          drafts: [
            { ...draft, id, status: "pending", createdAt: Date.now(), decidedAt: null, decidedBy: null },
            ...ws.drafts,
          ],
        })
      );
      return id;
    },
    [mutateWorkspace, touchWorkspace]
  );

  /**
   * Write a draft into the brand.
   *
   * This is the only place a brief answer, an import or an AI suggestion
   * becomes part of the brand, which is what makes "drafts only" enforceable
   * rather than a promise each producer keeps on its own.
   *
   * Accepting also supersedes the other pending drafts aimed at the same
   * field. Two answers proposing different purposes cannot both be right, and
   * leaving the loser in the queue invites someone to accept it half an hour
   * later and silently overwrite the decision that was just made.
   */
  const acceptDraft = useCallback(
    (workspaceId: string, draftId: string) => {
      const decidedBy = stateRef.current.session?.name ?? null;
      mutateWorkspace(workspaceId, (ws) => {
        const draft = ws.drafts.find((d) => d.id === draftId);
        if (!draft || draft.status !== "pending") return ws;

        const now = Date.now();
        const drafts = ws.drafts.map((d) => {
          if (d.id === draftId) return { ...d, status: "accepted" as const, decidedAt: now, decidedBy };
          if (d.status === "pending" && d.targetType === draft.targetType && d.targetRef === draft.targetRef) {
            return { ...d, status: "superseded" as const, decidedAt: now, decidedBy };
          }
          return d;
        });

        if (draft.targetType === "strategyField") {
          return touchWorkspace(ws, {
            drafts,
            strategy: { ...ws.strategy, [draft.targetRef]: draft.content },
          });
        }

        if (draft.targetType === "palette") {
          // A palette draft carries the swatches it is proposing. Colours the
          // brand already has are skipped rather than duplicated — a hex that
          // appears twice under two names is worse than not adding it.
          let proposed: { name: string; hex: string }[] = [];
          try {
            proposed = JSON.parse(draft.content) as { name: string; hex: string }[];
          } catch {
            return touchWorkspace(ws, { drafts });
          }
          const have = new Set(ws.colors.map((c) => c.hex.toLowerCase()));
          const added = proposed
            .filter((c) => c.hex && !have.has(c.hex.toLowerCase()))
            .map((c) => ({ id: uid(), name: c.name, hex: c.hex }));
          return touchWorkspace(ws, { drafts, colors: [...ws.colors, ...added] });
        }

        // Other target types are queued and reviewable but not yet applied;
        // recording the decision without pretending to have written anywhere
        // is better than silently dropping it.
        return touchWorkspace(ws, { drafts });
      });
      logAudit("Accepted a draft into the brand", workspaceId);
    },
    [mutateWorkspace, touchWorkspace, logAudit]
  );

  const rejectDraft = useCallback(
    (workspaceId: string, draftId: string) => {
      const decidedBy = stateRef.current.session?.name ?? null;
      mutateWorkspace(workspaceId, (ws) =>
        touchWorkspace(ws, {
          // Rejected drafts are kept, not deleted. "We considered this and said
          // no" is a different answer from "nobody ever suggested it", and a
          // client who asks why their wording was not used deserves the first.
          drafts: ws.drafts.map((d) =>
            d.id === draftId && d.status === "pending"
              ? { ...d, status: "rejected" as const, decidedAt: Date.now(), decidedBy }
              : d
          ),
        })
      );
    },
    [mutateWorkspace, touchWorkspace]
  );

  const addSignOffPin = useCallback(
    (workspaceId: string, section: PinSection, authorName: string, note: string) => {
      mutateWorkspace(workspaceId, (ws) =>
        touchWorkspace(ws, {
          signOffPins: [
            { id: uid(), section, authorName, note, createdAt: Date.now(), resolved: false },
            ...ws.signOffPins,
          ],
        })
      );
      logAudit(`${authorName} left a sign-off note on ${section}`, workspaceId);
    },
    [mutateWorkspace, touchWorkspace, logAudit]
  );

  const resolveSignOffPin = useCallback(
    (workspaceId: string, pinId: string) => {
      mutateWorkspace(workspaceId, (ws) =>
        touchWorkspace(ws, {
          signOffPins: ws.signOffPins.map((p) => (p.id === pinId ? { ...p, resolved: true } : p)),
        })
      );
    },
    [mutateWorkspace, touchWorkspace]
  );

  const setStrategyText = useCallback(
    (workspaceId: string, field: StrategyTextField, value: string, lang: Lang = "en") => {
      const key = lang === "ar" ? `${field}Ar` : field;
      mutateWorkspace(workspaceId, (ws) => {
        if ((ws.strategy as unknown as Record<string, string>)[key] === value) return ws;
        return touchWorkspace(ws, {
          strategy: { ...ws.strategy, [key]: value },
          // Typing into a field is the review. Whatever the machine put here
          // has now been read by a person, so the flag comes off — leaving it
          // on would train people to ignore it.
          strategyTranslation: {
            ...ws.strategyTranslation,
            unreviewed: ws.strategyTranslation.unreviewed.filter((f) => f !== key),
          },
        });
      });
    },
    [mutateWorkspace, touchWorkspace]
  );

  const setStrategyTranslation = useCallback(
    (workspaceId: string, patch: Partial<StrategyTranslation>) => {
      mutateWorkspace(workspaceId, (ws) =>
        touchWorkspace(ws, { strategyTranslation: { ...ws.strategyTranslation, ...patch } })
      );
    },
    [mutateWorkspace, touchWorkspace]
  );

  const markStrategyReviewed = useCallback(
    (workspaceId: string, fieldKey: string) => {
      mutateWorkspace(workspaceId, (ws) =>
        touchWorkspace(ws, {
          strategyTranslation: {
            ...ws.strategyTranslation,
            unreviewed: ws.strategyTranslation.unreviewed.filter((f) => f !== fieldKey),
          },
        })
      );
    },
    [mutateWorkspace, touchWorkspace]
  );

  const addPersona = useCallback(
    (workspaceId: string, persona: Omit<Persona, "id">) => {
      mutateWorkspace(workspaceId, (ws) =>
        touchWorkspace(ws, {
          strategy: { ...ws.strategy, personas: [...ws.strategy.personas, { ...persona, id: uid() }] },
        })
      );
    },
    [mutateWorkspace, touchWorkspace]
  );

  /**
   * In-place edits for the strategy's list items.
   *
   * These lists were add-and-delete only, which meant fixing a typo in a
   * persona required deleting it and retyping the whole card — and made a
   * second language impossible, since there was no way to write the Arabic of
   * something that already existed.
   */
  const updatePersona = useCallback(
    (workspaceId: string, personaId: string, patch: Partial<Omit<Persona, "id">>) => {
      mutateWorkspace(workspaceId, (ws) =>
        touchWorkspace(ws, {
          strategy: {
            ...ws.strategy,
            personas: ws.strategy.personas.map((p) => (p.id === personaId ? { ...p, ...patch } : p)),
          },
        })
      );
    },
    [mutateWorkspace, touchWorkspace]
  );

  const updateVoiceTrait = useCallback(
    (workspaceId: string, traitId: string, patch: Partial<Omit<VoiceTrait, "id">>) => {
      mutateWorkspace(workspaceId, (ws) =>
        touchWorkspace(ws, {
          strategy: {
            ...ws.strategy,
            voiceTraits: ws.strategy.voiceTraits.map((t) => (t.id === traitId ? { ...t, ...patch } : t)),
          },
        })
      );
    },
    [mutateWorkspace, touchWorkspace]
  );

  const updateCoreValue = useCallback(
    (workspaceId: string, valueId: string, patch: Partial<Omit<CoreValue, "id">>) => {
      mutateWorkspace(workspaceId, (ws) =>
        touchWorkspace(ws, {
          strategy: {
            ...ws.strategy,
            coreValues: ws.strategy.coreValues.map((v) => (v.id === valueId ? { ...v, ...patch } : v)),
          },
        })
      );
    },
    [mutateWorkspace, touchWorkspace]
  );

  const removePersona = useCallback(
    (workspaceId: string, personaId: string) => {
      mutateWorkspace(workspaceId, (ws) =>
        touchWorkspace(ws, {
          strategy: { ...ws.strategy, personas: ws.strategy.personas.filter((p) => p.id !== personaId) },
        })
      );
    },
    [mutateWorkspace, touchWorkspace]
  );

  const addVoiceTrait = useCallback(
    (workspaceId: string, trait: Omit<VoiceTrait, "id">) => {
      mutateWorkspace(workspaceId, (ws) =>
        touchWorkspace(ws, {
          strategy: { ...ws.strategy, voiceTraits: [...ws.strategy.voiceTraits, { ...trait, id: uid() }] },
        })
      );
    },
    [mutateWorkspace, touchWorkspace]
  );

  const removeVoiceTrait = useCallback(
    (workspaceId: string, traitId: string) => {
      mutateWorkspace(workspaceId, (ws) =>
        touchWorkspace(ws, {
          strategy: { ...ws.strategy, voiceTraits: ws.strategy.voiceTraits.filter((t) => t.id !== traitId) },
        })
      );
    },
    [mutateWorkspace, touchWorkspace]
  );

  const addCoreValue = useCallback(
    (workspaceId: string, value: Omit<CoreValue, "id">) => {
      mutateWorkspace(workspaceId, (ws) =>
        touchWorkspace(ws, {
          strategy: { ...ws.strategy, coreValues: [...ws.strategy.coreValues, { ...value, id: uid() }] },
        })
      );
    },
    [mutateWorkspace, touchWorkspace]
  );

  const removeCoreValue = useCallback(
    (workspaceId: string, valueId: string) => {
      mutateWorkspace(workspaceId, (ws) =>
        touchWorkspace(ws, {
          strategy: { ...ws.strategy, coreValues: ws.strategy.coreValues.filter((v) => v.id !== valueId) },
        })
      );
    },
    [mutateWorkspace, touchWorkspace]
  );

  const addCompetitor = useCallback(
    (workspaceId: string, competitor: { name: string; notes?: string; cells?: Record<string, string> }) => {
      mutateWorkspace(workspaceId, (ws) =>
        touchWorkspace(ws, {
          strategy: {
            ...ws.strategy,
            competitors: [
              ...ws.strategy.competitors,
              { id: uid(), name: competitor.name, notes: competitor.notes ?? "", cells: competitor.cells ?? {} },
            ],
          },
        })
      );
    },
    [mutateWorkspace, touchWorkspace]
  );

  const updateCompetitor = useCallback(
    (workspaceId: string, competitorId: string, patch: Partial<Omit<Competitor, "id">>) => {
      mutateWorkspace(workspaceId, (ws) =>
        touchWorkspace(ws, {
          strategy: {
            ...ws.strategy,
            competitors: ws.strategy.competitors.map((c) =>
              c.id === competitorId
                ? {
                    ...c,
                    ...patch,
                    // Cells are merged rather than replaced: a patch carries
                    // the one cell that changed, and spreading it whole would
                    // wipe every other column in that row.
                    cells: { ...c.cells, ...(patch.cells ?? {}) },
                    cellsAr: { ...(c.cellsAr ?? {}), ...(patch.cellsAr ?? {}) },
                  }
                : c
            ),
          },
        })
      );
    },
    [mutateWorkspace, touchWorkspace]
  );

  const setCompetitorColumns = useCallback(
    (workspaceId: string, columns: CompetitorColumn[]) => {
      mutateWorkspace(workspaceId, (ws) => touchWorkspace(ws, { strategy: { ...ws.strategy, competitorColumns: columns } }));
    },
    [mutateWorkspace, touchWorkspace]
  );

  /**
   * Renames the brand everywhere it is shown, and deliberately leaves the slug
   * alone. The slug is the client-facing URL — it may already be in a signed
   * proposal or a CNAME — so a typo fix in the display name must not silently
   * break a link someone has already shared.
   */
  const renameWorkspace = useCallback(
    (workspaceId: string, name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      mutateWorkspace(workspaceId, (ws) => touchWorkspace(ws, { name: trimmed, initials: initialsFor(trimmed) }));
    },
    [mutateWorkspace, touchWorkspace]
  );

  const removeCompetitor = useCallback(
    (workspaceId: string, competitorId: string) => {
      mutateWorkspace(workspaceId, (ws) =>
        touchWorkspace(ws, {
          strategy: { ...ws.strategy, competitors: ws.strategy.competitors.filter((c) => c.id !== competitorId) },
        })
      );
    },
    [mutateWorkspace, touchWorkspace]
  );

  const addAsset = useCallback(
    (
      workspaceId: string,
      asset: Omit<Asset, "id" | "uploadedAt" | "versions" | "status"> & { status?: AssetStatus }
    ): string => {
      // The id is minted here rather than inside the updater so the caller can
      // immediately reference the asset it just added — an image dropped
      // straight onto a block has to select itself, and waiting for the next
      // render to go looking for it by filename would be guesswork.
      const id = uid();
      mutateWorkspace(workspaceId, (ws) =>
        touchWorkspace(ws, {
          assets: [
            { ...asset, status: asset.status ?? "approved", id, uploadedAt: Date.now(), versions: [] },
            ...ws.assets,
          ],
        })
      );
      logAudit(`Uploaded ${asset.fileName} to the asset manager`, workspaceId);
      return id;
    },
    [mutateWorkspace, touchWorkspace, logAudit]
  );

  /**
   * Delete an asset, and stop pointing at it.
   *
   * This used to filter the assets array and nothing else, which left a
   * deleted file's id behind in up to three places: the two typography font
   * references, a department's attached guideline file, and any moodboard card
   * that *was* that asset.
   *
   * That was not a visible fault, and it is worth being precise about why —
   * every reader is already defensive. `brandFontStacks` reports
   * `latinIsUploaded` as `!!id && assets.some(...)`, so a dead id reads as "no
   * font applied" and the stack falls back; both department readers use `find`
   * and render the attachment conditionally. Nothing broke.
   *
   * What it left was garbage: a stored pointer to a file that does not exist.
   * Harmless while every read site checks, and a foreign-key violation the
   * moment the server enforces integrity — which is the half of this the
   * migration cares about.
   *
   * Shares `removeAssetFrom` with the adapter rather than keeping its own
   * version, for the same reason publish does.
   */
  const removeAsset = useCallback(
    (workspaceId: string, assetId: string) => {
      mutateWorkspace(workspaceId, (ws) => touchWorkspace(removeAssetFrom(ws, assetId), {}));
    },
    [mutateWorkspace, touchWorkspace]
  );

  const setAssetTags = useCallback(
    (workspaceId: string, assetId: string, tags: string[]) => {
      mutateWorkspace(workspaceId, (ws) =>
        touchWorkspace(ws, { assets: ws.assets.map((a) => (a.id === assetId ? { ...a, tags } : a)) })
      );
    },
    [mutateWorkspace, touchWorkspace]
  );

  const setAssetStatus = useCallback(
    (workspaceId: string, assetId: string, status: AssetStatus) => {
      mutateWorkspace(workspaceId, (ws) =>
        touchWorkspace(ws, { assets: ws.assets.map((a) => (a.id === assetId ? { ...a, status } : a)) })
      );
      logAudit(`Set an asset to ${status}`, workspaceId);
    },
    [mutateWorkspace, touchWorkspace, logAudit]
  );

  const setAssetType = useCallback(
    (workspaceId: string, assetId: string, type: AssetType) => {
      mutateWorkspace(workspaceId, (ws) =>
        touchWorkspace(ws, {
          assets: ws.assets.map((a) =>
            a.id === assetId
              ? {
                  ...a,
                  type,
                  // A file that stops being a font stops carrying font
                  // metadata; leaving it behind would put a stale family name
                  // in the Typography picker for something that isn't type.
                  font: type === "font" ? a.font : undefined,
                }
              : a
          ),
        })
      );
    },
    [mutateWorkspace, touchWorkspace]
  );

  const renameAsset = useCallback(
    (workspaceId: string, assetId: string, fileName: string) => {
      const next = fileName.trim();
      if (!next) return;
      mutateWorkspace(workspaceId, (ws) =>
        touchWorkspace(ws, { assets: ws.assets.map((a) => (a.id === assetId ? { ...a, fileName: next } : a)) })
      );
    },
    [mutateWorkspace, touchWorkspace]
  );

  const addAssetVersion = useCallback(
    (workspaceId: string, assetId: string, file: { url: string; fileName: string; sizeKB: number }) => {
      mutateWorkspace(workspaceId, (ws) =>
        touchWorkspace(ws, {
          assets: ws.assets.map((a) => {
            if (a.id !== assetId) return a;
            const previousVersion = { id: uid(), url: a.url, fileName: a.fileName, sizeKB: a.sizeKB, createdAt: a.uploadedAt };
            return { ...a, ...file, uploadedAt: Date.now(), versions: [previousVersion, ...a.versions] };
          }),
        })
      );
    },
    [mutateWorkspace, touchWorkspace]
  );

  const restoreAssetVersion = useCallback(
    (workspaceId: string, assetId: string, versionId: string) => {
      mutateWorkspace(workspaceId, (ws) =>
        touchWorkspace(ws, {
          assets: ws.assets.map((a) => {
            if (a.id !== assetId) return a;
            const version = a.versions.find((v) => v.id === versionId);
            if (!version) return a;
            const currentAsCurrentVersion = { id: uid(), url: a.url, fileName: a.fileName, sizeKB: a.sizeKB, createdAt: a.uploadedAt };
            return {
              ...a,
              url: version.url,
              fileName: version.fileName,
              sizeKB: version.sizeKB,
              uploadedAt: Date.now(),
              versions: [currentAsCurrentVersion, ...a.versions.filter((v) => v.id !== versionId)],
            };
          }),
        })
      );
      logAudit("Restored a previous asset version", workspaceId);
    },
    [mutateWorkspace, touchWorkspace, logAudit]
  );

  const addDepartmentView = useCallback(
    (workspaceId: string, name: string): string => {
      const id = uid();
      mutateWorkspace(workspaceId, (ws) =>
        touchWorkspace(ws, {
          departmentViews: [
            ...ws.departmentViews,
            { id, name, createdAt: Date.now(), items: [], guidelineText: "", instructionSections: [], publishToSite: true },
          ],
        })
      );
      return id;
    },
    [mutateWorkspace, touchWorkspace]
  );

  const renameDepartmentView = useCallback(
    (workspaceId: string, viewId: string, name: string) => {
      mutateWorkspace(workspaceId, (ws) =>
        touchWorkspace(ws, {
          departmentViews: ws.departmentViews.map((d) => (d.id === viewId ? { ...d, name } : d)),
        })
      );
    },
    [mutateWorkspace, touchWorkspace]
  );

  const removeDepartmentView = useCallback(
    (workspaceId: string, viewId: string) => {
      mutateWorkspace(workspaceId, (ws) =>
        touchWorkspace(ws, { departmentViews: ws.departmentViews.filter((d) => d.id !== viewId) })
      );
    },
    [mutateWorkspace, touchWorkspace]
  );

  const setDeptGuideline = useCallback(
    (workspaceId: string, viewId: string, patch: { guidelineText?: string; guidelineFileAssetId?: string }) => {
      mutateWorkspace(workspaceId, (ws) =>
        touchWorkspace(ws, {
          departmentViews: ws.departmentViews.map((d) => (d.id === viewId ? { ...d, ...patch } : d)),
        })
      );
    },
    [mutateWorkspace, touchWorkspace]
  );

  const setDeptInstructions = useCallback(
    (workspaceId: string, viewId: string, sections: DeptInstructionSection[]) => {
      mutateWorkspace(workspaceId, (ws) =>
        touchWorkspace(ws, {
          departmentViews: ws.departmentViews.map((d) => (d.id === viewId ? { ...d, instructionSections: sections } : d)),
        })
      );
    },
    [mutateWorkspace, touchWorkspace]
  );

  const setDeptPublish = useCallback(
    (workspaceId: string, viewId: string, publish: boolean) => {
      mutateWorkspace(workspaceId, (ws) =>
        touchWorkspace(ws, {
          departmentViews: ws.departmentViews.map((d) => (d.id === viewId ? { ...d, publishToSite: publish } : d)),
        })
      );
    },
    [mutateWorkspace, touchWorkspace]
  );

  const addDeptItem = useCallback(
    (workspaceId: string, viewId: string, item: Omit<DepartmentViewItem, "id">) => {
      mutateWorkspace(workspaceId, (ws) =>
        touchWorkspace(ws, {
          departmentViews: ws.departmentViews.map((d) =>
            d.id === viewId ? { ...d, items: [...d.items, { ...item, id: uid() }] } : d
          ),
        })
      );
    },
    [mutateWorkspace, touchWorkspace]
  );

  const removeDeptItem = useCallback(
    (workspaceId: string, viewId: string, itemId: string) => {
      mutateWorkspace(workspaceId, (ws) =>
        touchWorkspace(ws, {
          departmentViews: ws.departmentViews.map((d) =>
            d.id === viewId ? { ...d, items: d.items.filter((i) => i.id !== itemId) } : d
          ),
        })
      );
    },
    [mutateWorkspace, touchWorkspace]
  );

  const addTeamMember = useCallback(
    (workspaceId: string, name: string, email: string, role: TeamRole) => {
      mutateWorkspace(workspaceId, (ws) =>
        touchWorkspace(ws, { team: [...ws.team, { id: uid(), name, email, role }] })
      );
      logAudit(`Added ${name} as ${role}`, workspaceId);
    },
    [mutateWorkspace, touchWorkspace, logAudit]
  );

  const removeTeamMember = useCallback(
    (workspaceId: string, memberId: string) => {
      mutateWorkspace(workspaceId, (ws) =>
        touchWorkspace(ws, { team: ws.team.filter((m) => m.id !== memberId) })
      );
    },
    [mutateWorkspace, touchWorkspace]
  );

  const setTeamRole = useCallback(
    (workspaceId: string, memberId: string, role: TeamRole) => {
      mutateWorkspace(workspaceId, (ws) =>
        touchWorkspace(ws, { team: ws.team.map((m) => (m.id === memberId ? { ...m, role } : m)) })
      );
      logAudit(`Changed a team member's role to ${role}`, workspaceId);
    },
    [mutateWorkspace, touchWorkspace, logAudit]
  );

  const transferOwnership = useCallback(
    (workspaceId: string, memberId: string) => {
      let handedTo = "";
      mutateWorkspace(workspaceId, (ws) => {
        const target = ws.team.find((m) => m.id === memberId);
        if (!target) return ws;
        handedTo = target.name || target.email;
        return touchWorkspace(ws, {
          // One pass over the list, so there is never a moment with two owners
          // or none — the demotion and the promotion are the same write.
          team: ws.team.map((m) =>
            m.id === memberId ? { ...m, role: "owner" as TeamRole } : m.role === "owner" ? { ...m, role: "editor" as TeamRole } : m
          ),
        });
      });
      if (handedTo) logAudit(`Transferred ownership to ${handedTo}`, workspaceId);
    },
    [mutateWorkspace, touchWorkspace, logAudit]
  );

  const createShareLink = useCallback(
    (workspaceId: string, scope: ShareScope, departmentId?: string): string => {
      // A URL token, not a database id: long enough that it can't be guessed
      // by trying, which is the only thing standing between this link and
      // whoever else finds it.
      const id = `${uid()}${uid()}`;
      mutateWorkspace(workspaceId, (ws) => {
        const dept = departmentId ? ws.departmentViews.find((d) => d.id === departmentId) : undefined;
        const link: ShareLink = {
          id,
          scope,
          departmentId,
          label: scope === "department" ? dept?.name || "Department" : "Full strategy",
          createdAt: Date.now(),
          revokedAt: null,
        };
        return touchWorkspace(ws, { shareLinks: [link, ...ws.shareLinks] });
      });
      logAudit(scope === "department" ? "Created a department share link" : "Created a strategy share link", workspaceId);
      return id;
    },
    [mutateWorkspace, touchWorkspace, logAudit]
  );

  const revokeShareLink = useCallback(
    (workspaceId: string, linkId: string) => {
      mutateWorkspace(workspaceId, (ws) =>
        touchWorkspace(ws, {
          shareLinks: ws.shareLinks.map((l) => (l.id === linkId ? { ...l, revokedAt: Date.now() } : l)),
        })
      );
      logAudit("Revoked a share link", workspaceId);
    },
    [mutateWorkspace, touchWorkspace, logAudit]
  );

  const restoreShareLink = useCallback(
    (workspaceId: string, linkId: string) => {
      mutateWorkspace(workspaceId, (ws) =>
        touchWorkspace(ws, {
          shareLinks: ws.shareLinks.map((l) => (l.id === linkId ? { ...l, revokedAt: null } : l)),
        })
      );
    },
    [mutateWorkspace, touchWorkspace]
  );

  const resolveShareLink = useCallback(
    (token: string) => {
      for (const ws of state.workspaces) {
        const link = ws.shareLinks.find((l) => l.id === token);
        if (link) return { ws, link };
      }
      return undefined;
    },
    [state.workspaces]
  );

  const proposeApproval = useCallback(
    (workspaceId: string, summary: string, proposedBy: string) => {
      mutateWorkspace(workspaceId, (ws) =>
        touchWorkspace(ws, {
          approvals: [
            { id: uid(), summary, proposedBy, status: "pending", createdAt: Date.now() },
            ...ws.approvals,
          ],
        })
      );
    },
    [mutateWorkspace, touchWorkspace]
  );

  const resolveApproval = useCallback(
    (workspaceId: string, approvalId: string, status: ApprovalStatus, reviewNote?: string) => {
      mutateWorkspace(workspaceId, (ws) =>
        touchWorkspace(ws, {
          approvals: ws.approvals.map((a) =>
            a.id === approvalId ? { ...a, status, resolvedAt: Date.now(), reviewNote } : a
          ),
        })
      );
      logAudit(`${status === "approved" ? "Approved" : "Rejected"} a change proposal`, workspaceId);
    },
    [mutateWorkspace, touchWorkspace, logAudit]
  );

  const saveVersionSnapshot = useCallback(
    (workspaceId: string, label: string, createdBy: string) => {
      mutateWorkspace(workspaceId, (ws) =>
        touchWorkspace(ws, {
          versionHistory: [
            {
              id: uid(),
              label,
              createdAt: Date.now(),
              createdBy,
              overviewHtml: ws.overviewHtml,
              colors: ws.colors,
              typography: ws.typography,
            },
            ...ws.versionHistory,
          ],
        })
      );
    },
    [mutateWorkspace, touchWorkspace]
  );

  const restoreVersion = useCallback(
    (workspaceId: string, versionId: string) => {
      mutateWorkspace(workspaceId, (ws) => {
        const version = ws.versionHistory.find((v) => v.id === versionId);
        if (!version) return ws;
        return touchWorkspace(ws, {
          overviewHtml: version.overviewHtml,
          overviewSavedAt: Date.now(),
          colors: version.colors,
          typography: version.typography,
        });
      });
      logAudit("Restored a previous version", workspaceId);
    },
    [mutateWorkspace, touchWorkspace, logAudit]
  );

  const addComplianceCheck = useCallback(
    (workspaceId: string, check: Omit<ComplianceCheck, "id" | "createdAt">) => {
      mutateWorkspace(workspaceId, (ws) =>
        touchWorkspace(ws, {
          complianceChecks: [{ ...check, id: uid(), createdAt: Date.now() }, ...ws.complianceChecks],
        })
      );
      logAudit(`Ran a compliance check on ${check.fileName}`, workspaceId);
    },
    [mutateWorkspace, touchWorkspace, logAudit]
  );

  const setSso = useCallback((patch: Partial<SsoConfig>) => {
    setState((prev) => ({ ...prev, sso: { ...prev.sso, ...patch } }));
  }, []);

  const addBlock = useCallback(
    (
      workspaceId: string,
      kind: BlockKind,
      pageId?: string,
      opts?: { parentId?: string; columnIndex?: number; after?: string }
    ): string => {
      const id = uid();
      mutateWorkspace(workspaceId, (ws) => {
        // A new image/gallery/files block starts pre-populated from whatever
        // the workspace already has in the Assets Manager — "zero code"
        // means not making someone hunt for their own files right after
        // adding a block, on top of not making them upload anything at all.
        const list = [...getBlockList(ws, pageId)].sort((a, b) => a.order - b.order);
        const withDefaults = withAssetDefaults(ws, { kind, ...blockDefaults(kind) });
        const placement =
          opts?.parentId !== undefined
            ? { parentId: opts.parentId, columnIndex: opts.columnIndex ?? 0 }
            : {};
        const block = { ...withDefaults, ...placement, id, order: 0 };
        // Inserting *after* a given block rather than always appending is what
        // lets someone drop a section between two existing ones. The `order`
        // field is renumbered across the whole list afterwards, so positions
        // stay contiguous however many inserts have happened.
        const at = opts?.after ? list.findIndex((b) => b.id === opts.after) : -1;
        const next = at < 0 ? [...list, block] : [...list.slice(0, at + 1), block, ...list.slice(at + 1)];
        return touchWorkspace(ws, withBlockList(ws, pageId, next.map((b, i) => ({ ...b, order: i }))));
      });
      return id;
    },
    [mutateWorkspace, touchWorkspace]
  );

  const duplicateBlock = useCallback(
    (workspaceId: string, blockId: string, pageId?: string): string | null => {
      const ws = stateRef.current.workspaces.find((w) => w.id === workspaceId);
      const source = ws ? getBlockList(ws, pageId).find((b) => b.id === blockId) : undefined;
      if (!source) return null;
      const copyId = uid();
      mutateWorkspace(workspaceId, (current) => {
        const list = [...getBlockList(current, pageId)].sort((a, b) => a.order - b.order);
        const original = list.find((b) => b.id === blockId);
        if (!original) return current;
        // A layout container is copied with its children, or the copy would
        // render as an empty set of columns next to a full one.
        const children = list.filter((b) => b.parentId === blockId);
        const copies: PageBlock[] = [
          { ...original, id: copyId },
          ...children.map((c) => ({ ...c, id: uid(), parentId: copyId })),
        ];
        const at = list.findIndex((b) => b.id === blockId);
        const next = [...list.slice(0, at + 1), ...copies, ...list.slice(at + 1)];
        return touchWorkspace(current, withBlockList(current, pageId, next.map((b, i) => ({ ...b, order: i }))));
      });
      return copyId;
    },
    [mutateWorkspace, touchWorkspace]
  );

  const addTemplateBlocks = useCallback(
    (workspaceId: string, blocks: Omit<PageBlock, "id" | "order">[], pageId?: string) => {
      mutateWorkspace(workspaceId, (ws) => {
        const list = getBlockList(ws, pageId);
        const base = list.length;
        const added = blocks.map((b, i) => ({ ...withAssetDefaults(ws, b), id: uid(), order: base + i }));
        return touchWorkspace(ws, withBlockList(ws, pageId, [...list, ...added]));
      });
    },
    [mutateWorkspace, touchWorkspace]
  );

  const autoFillBlocks = useCallback(
    (workspaceId: string) => {
      mutateWorkspace(workspaceId, (ws) => {
        // Deterministic ids for the auto-generated blocks make this
        // idempotent — running it again re-syncs to whatever's currently in
        // the Assets Manager instead of piling up duplicates. Only mockups
        // and exports are targeted here because photos/icons already get
        // their own fixed Photography/Icons sections on the guideline site.
        const mockups = ws.assets.filter((a) => a.type === "mockup").map((a) => a.id);
        const exports = ws.assets.filter((a) => a.type === "export").map((a) => a.id);
        const rest = ws.customBlocks.filter((b) => b.id !== "auto-mockups" && b.id !== "auto-exports");
        const generated: PageBlock[] = [];
        let order = rest.length;
        if (mockups.length > 0) {
          generated.push({
            id: "auto-mockups",
            kind: "gallery",
            order: order++,
            title: "Applied mockups",
            arTitle: "نماذج تطبيقية",
            assetIds: mockups.slice(0, 8),
          });
        }
        if (exports.length > 0) {
          generated.push({
            id: "auto-exports",
            kind: "gallery",
            order: order++,
            title: "Downloads & exports",
            arTitle: "ملفات جاهزة للتحميل",
            assetIds: exports.slice(0, 8),
          });
        }
        if (generated.length === 0) return ws;
        return touchWorkspace(ws, { customBlocks: [...rest, ...generated] });
      });
      logAudit("Auto-filled the guideline site from brand assets", workspaceId);
    },
    [mutateWorkspace, touchWorkspace, logAudit]
  );

  const updateBlock = useCallback(
    (workspaceId: string, blockId: string, patch: Partial<PageBlock>, pageId?: string) => {
      mutateWorkspace(workspaceId, (ws) => {
        const list = getBlockList(ws, pageId).map((b) => (b.id === blockId ? { ...b, ...patch } : b));
        return touchWorkspace(ws, withBlockList(ws, pageId, list));
      });
    },
    [mutateWorkspace, touchWorkspace]
  );

  const removeBlock = useCallback(
    (workspaceId: string, blockId: string, pageId?: string) => {
      mutateWorkspace(workspaceId, (ws) => {
        // Deleting a layout container takes its children with it, so removing
        // a column set can't leave orphaned blocks that nothing renders.
        const list = getBlockList(ws, pageId).filter((b) => b.id !== blockId && b.parentId !== blockId);
        return touchWorkspace(ws, withBlockList(ws, pageId, list));
      });
    },
    [mutateWorkspace, touchWorkspace]
  );

  const reorderBlocks = useCallback(
    (workspaceId: string, orderedIds: string[], pageId?: string) => {
      mutateWorkspace(workspaceId, (ws) => {
        const byId = new Map(getBlockList(ws, pageId).map((b) => [b.id, b]));
        const reordered = orderedIds
          .map((id, i) => {
            const block = byId.get(id);
            return block ? { ...block, order: i } : undefined;
          })
          .filter((b): b is PageBlock => !!b);
        return touchWorkspace(ws, withBlockList(ws, pageId, reordered));
      });
    },
    [mutateWorkspace, touchWorkspace]
  );

  const publishGuideline = useCallback(
    (workspaceId: string) => {
      /*
       * The transition itself lives in `lib/adapters/entityOps.ts`.
       *
       * It used to be written out here, and it is the most consequential rule
       * in the product — what a client does and does not receive — with no
       * coverage but a browser sweep. It is now a pure function with 11 tests
       * that run in two seconds, and this calls it rather than keeping a second
       * copy: two implementations of "exploration never reaches a client" is one
       * too many, and the one that drifts would be the one nobody reads.
       *
       * The reasoning for each subtraction moved with the code. Read it there.
       */
      mutateWorkspace(workspaceId, (ws) => publishWorkspace(ws, Date.now()));
      logAudit("Published the guideline site", workspaceId);
    },
    [mutateWorkspace, logAudit]
  );

  const unpublishGuideline = useCallback(
    (workspaceId: string) => {
      mutateWorkspace(workspaceId, (ws) => unpublishWorkspace(ws));
      logAudit("Took the guideline site offline", workspaceId);
    },
    [mutateWorkspace, logAudit]
  );

  const toggleSectionHidden = useCallback(
    (workspaceId: string, sectionId: string) => {
      mutateWorkspace(workspaceId, (ws) =>
        touchWorkspace(ws, {
          hiddenSections: ws.hiddenSections.includes(sectionId)
            ? ws.hiddenSections.filter((s) => s !== sectionId)
            : [...ws.hiddenSections, sectionId],
        })
      );
    },
    [mutateWorkspace, touchWorkspace]
  );

  /** Shared by the heading and the note: both are per-language overrides
   *  keyed on a section id, and both restore their default when emptied.
   *
   *  Deliberately *not* routed through `applySectionPatch`, though that
   *  function now does the same merge. The difference is the no-op guard
   *  below: writing the same value back must not count as an edit, because
   *  this is called per keystroke and every spurious edit bumps `updatedAt`
   *  and takes a slot in the undo history. A pure transition cannot own that
   *  rule — it has no idea the caller is a text field — so the guard stays
   *  here and the merge stays shared. Comparing a produced state against the
   *  old one to re-derive "did anything change" is the version of this that
   *  looks tidier and allocates a workspace per keypress.
   *
   *  `applySectionPatch` was brought up to this function's standard rather
   *  than the other way round: it trims, and it stores `undefined` rather than
   *  `""` for a cleared language. Its own comment records why. */
  const setSectionOverride = useCallback(
    (
      workspaceId: string,
      field: "sectionTitles" | "sectionNotes",
      sectionId: string,
      lang: Lang,
      value: string
    ) => {
      mutateWorkspace(workspaceId, (ws) => {
        const next = value.trim();
        // Writing the same value back would still count as an edit — bumping
        // updatedAt and taking a slot in the undo history for a change nobody
        // made.
        if ((ws[field][sectionId]?.[lang] ?? "") === next) return ws;
        const map = { ...ws[field] };
        const merged = { ...(map[sectionId] ?? {}), [lang]: next || undefined };
        // An entry with nothing left in it is deleted rather than kept as an
        // empty object, so "has this been overridden?" stays a simple presence
        // check and clearing the field truly restores the default.
        if (!merged.en && !merged.ar) delete map[sectionId];
        else map[sectionId] = merged;
        return touchWorkspace(ws, { [field]: map } as Partial<Workspace>);
      });
    },
    [mutateWorkspace, touchWorkspace]
  );

  const setSectionOrder = useCallback(
    (workspaceId: string, orderedIds: string[]) => {
      mutateWorkspace(workspaceId, (ws) => touchWorkspace(ws, { sectionOrder: orderedIds }));
    },
    [mutateWorkspace, touchWorkspace]
  );

  /** Merges a style patch, dropping keys set back to undefined so "no override"
   *  stays absent rather than becoming an explicit undefined the UI reads back
   *  as a set value. An entry with nothing left is deleted entirely. */
  function mergeStyle(
    current: BlockStyle | undefined,
    patch: Partial<BlockStyle>,
    replace?: boolean,
  ): BlockStyle | undefined {
    const merged = (replace ? { ...patch } : { ...(current ?? {}), ...patch }) as Record<string, unknown>;
    for (const key of Object.keys(merged)) {
      if (merged[key] === undefined) delete merged[key];
      // An empty `bp` or `rtl` container is not a style. Left in, everything
      // that asks "has this been touched?" — the Reset button, isEmptyStyle,
      // the layers tree — answers yes for a section carrying nothing.
      else if (
        (key === "bp" || key === "rtl") &&
        typeof merged[key] === "object" &&
        Object.keys(merged[key] as object).length === 0
      ) {
        delete merged[key];
      }
    }
    return Object.keys(merged).length === 0 ? undefined : (merged as BlockStyle);
  }

  const setBlockStyle = useCallback(
    (
      workspaceId: string,
      blockId: string,
      patch: Partial<BlockStyle>,
      pageId?: string,
      opts?: { replace?: boolean },
    ) => {
      mutateWorkspace(workspaceId, (ws) => {
        const list = getBlockList(ws, pageId).map((b) =>
          b.id === blockId ? { ...b, style: mergeStyle(b.style, patch, opts?.replace) } : b
        );
        return touchWorkspace(ws, withBlockList(ws, pageId, list));
      });
    },
    [mutateWorkspace, touchWorkspace]
  );

  const setSectionStyle = useCallback(
    (workspaceId: string, sectionId: string, patch: Partial<BlockStyle>, opts?: { replace?: boolean }) => {
      mutateWorkspace(workspaceId, (ws) => {
        const map = { ...ws.sectionStyles };
        const next = mergeStyle(map[sectionId], patch, opts?.replace);
        if (next) map[sectionId] = next;
        else delete map[sectionId];
        return touchWorkspace(ws, { sectionStyles: map });
      });
    },
    [mutateWorkspace, touchWorkspace]
  );

  /**
   * What a derived section shows inside itself — see `lib/sectionOptions.ts`.
   *
   * A patch, merged. `undefined` for a key removes it, which is how a control
   * returns a part to its default rather than storing the default as a choice: a
   * section that is following the default keeps following it if the default ever
   * changes. A record with nothing left in it is deleted outright, so an
   * untouched section stores nothing at all.
   */
  const setSectionOptions = useCallback(
    (workspaceId: string, sectionId: string, patch: Partial<SectionOptions>) => {
      mutateWorkspace(workspaceId, (ws) => {
        const map = { ...ws.sectionOptions };
        const merged: Record<string, unknown> = { ...(map[sectionId] ?? {}) };
        for (const [key, value] of Object.entries(patch)) {
          if (value === undefined) delete merged[key];
          else merged[key] = value;
        }
        if (Object.keys(merged).length === 0) delete map[sectionId];
        else map[sectionId] = merged as SectionOptions;
        return touchWorkspace(ws, { sectionOptions: map });
      });
    },
    [mutateWorkspace, touchWorkspace]
  );

  const setSectionTitle = useCallback(
    (workspaceId: string, sectionId: string, lang: Lang, value: string) =>
      setSectionOverride(workspaceId, "sectionTitles", sectionId, lang, value),
    [setSectionOverride]
  );

  const setSectionNote = useCallback(
    (workspaceId: string, sectionId: string, lang: Lang, value: string) =>
      setSectionOverride(workspaceId, "sectionNotes", sectionId, lang, value),
    [setSectionOverride]
  );

  const setSiteMode = useCallback(
    (workspaceId: string, mode: Workspace["siteMode"]) => {
      mutateWorkspace(workspaceId, (ws) => touchWorkspace(ws, { siteMode: mode }));
    },
    [mutateWorkspace, touchWorkspace]
  );

  const addPage = useCallback(
    (workspaceId: string, name: string): string => {
      const id = uid();
      mutateWorkspace(workspaceId, (ws) => {
        const base = slugify(name) || "page";
        let slug = base;
        let n = 2;
        while (ws.pages.some((p) => p.slug === slug)) slug = `${base}-${n++}`;
        const page: GuidePage = { id, name, arName: name, slug, order: ws.pages.length, blocks: [] };
        return touchWorkspace(ws, { pages: [...ws.pages, page] });
      });
      logAudit(`Added the "${name}" page`, workspaceId);
      return id;
    },
    [mutateWorkspace, touchWorkspace, logAudit]
  );

  const renamePage = useCallback(
    (workspaceId: string, pageId: string, name: string, arName?: string) => {
      mutateWorkspace(workspaceId, (ws) =>
        touchWorkspace(ws, {
          pages: ws.pages.map((p) => (p.id === pageId ? { ...p, name, arName: arName ?? p.arName } : p)),
        })
      );
    },
    [mutateWorkspace, touchWorkspace]
  );

  const removePage = useCallback(
    (workspaceId: string, pageId: string) => {
      mutateWorkspace(workspaceId, (ws) => touchWorkspace(ws, { pages: ws.pages.filter((p) => p.id !== pageId) }));
    },
    [mutateWorkspace, touchWorkspace]
  );

  const reorderPages = useCallback(
    (workspaceId: string, orderedIds: string[]) => {
      mutateWorkspace(workspaceId, (ws) => {
        const byId = new Map(ws.pages.map((p) => [p.id, p]));
        const reordered = orderedIds
          .map((id, i) => {
            const p = byId.get(id);
            return p ? { ...p, order: i } : undefined;
          })
          .filter((p): p is GuidePage => !!p);
        return touchWorkspace(ws, { pages: reordered });
      });
    },
    [mutateWorkspace, touchWorkspace]
  );

  const value = useMemo<AppContextValue>(
    () => ({
      state,
      hydrated,
      signup,
      login,
      logout,
      updateAccount,
      setAccountPassword,
      requestPasswordReset,
      resetPassword,
      myWorkspaces,
      getWorkspace,
      createWorkspace,
      setPrimaryLocale,
      setAdminLang,
      uiLang,
      setOverview,
      setBrandDetails,
      addColor,
      updateColor,
      removeColor,
      setPrimaryColor,
      setTypography,
      setFontAsset,
      updateLogoSlot,
      setLogoUsageNotes,
      setLogoColorIds,
      toggleClientPassword,
      setClientPassword,
      setCustomDomain,
      setDomainStatus,
      setSubdomain,
      markPurchased,
      setApiKey,
      setWebhookUrl,
      toggleFigmaSync,
      toggleWhiteLabel,
      setGuidelineTemplate,
      setStudioStyle,
      setWorkspaceStage,
      createMoodboard,
      renameMoodboard,
      deleteMoodboard,
      addMoodboardZone,
      patchMoodboardZone,
      removeMoodboardZone,
      addMoodboardItems,
      updateMoodboardItem,
      moveMoodboardItem,
      removeMoodboardItem,
      restoreMoodboardItem,
      voteMoodboardItem,
      placeMoodboardItem,
      placeMoodboardZone,
      connectMoodboardItems,
      removeMoodboardEdge,
      labelMoodboardEdge,
      setMoodboardView,
      tidyMoodboard,
      createBrief,
      setBriefQuestions,
      setBriefMeta,
      sendBrief,
      revokeBrief,
      deleteBrief,
      getBriefByToken,
      answerBrief,
      submitBrief,
      addDraft,
      acceptDraft,
      rejectDraft,
      addSignOffPin,
      resolveSignOffPin,
      setStrategyText,
      setStrategyTranslation,
      markStrategyReviewed,
      addPersona,
      updatePersona,
      removePersona,
      addVoiceTrait,
      updateVoiceTrait,
      removeVoiceTrait,
      addCoreValue,
      updateCoreValue,
      removeCoreValue,
      addCompetitor,
      updateCompetitor,
      setCompetitorColumns,
      renameWorkspace,
      removeCompetitor,
      addAsset,
      removeAsset,
      setAssetTags,
      setAssetStatus,
      setAssetType,
      renameAsset,
      addAssetVersion,
      restoreAssetVersion,
      addDepartmentView,
      renameDepartmentView,
      removeDepartmentView,
      addDeptItem,
      removeDeptItem,
      setDeptGuideline,
      setDeptInstructions,
      setDeptPublish,
      addTeamMember,
      removeTeamMember,
      setTeamRole,
      transferOwnership,
      createShareLink,
      revokeShareLink,
      restoreShareLink,
      resolveShareLink,
      proposeApproval,
      resolveApproval,
      saveVersionSnapshot,
      restoreVersion,
      addComplianceCheck,
      setSso,
      logAudit,
      addBlock,
      updateBlock,
      removeBlock,
      duplicateBlock,
      reorderBlocks,
      toggleSectionHidden,
      setSectionOrder,
      setBlockStyle,
      setSectionStyle,
      setSectionOptions,
      setSectionTitle,
      setSectionNote,
      setSiteMode,
      publishGuideline,
      unpublishGuideline,
      addTemplateBlocks,
      autoFillBlocks,
      addPage,
      renamePage,
      removePage,
      reorderPages,
      undo,
      canUndo: depth.undo > 0,
      redo,
      canRedo: depth.redo > 0,
    }),
    [
      state,
      hydrated,
      signup,
      login,
      logout,
      updateAccount,
      setAccountPassword,
      requestPasswordReset,
      resetPassword,
      myWorkspaces,
      getWorkspace,
      createWorkspace,
      setPrimaryLocale,
      setAdminLang,
      uiLang,
      setOverview,
      setBrandDetails,
      addColor,
      updateColor,
      removeColor,
      setPrimaryColor,
      setTypography,
      setFontAsset,
      updateLogoSlot,
      setLogoUsageNotes,
      setLogoColorIds,
      toggleClientPassword,
      setClientPassword,
      setCustomDomain,
      setDomainStatus,
      setSubdomain,
      markPurchased,
      setApiKey,
      setWebhookUrl,
      toggleFigmaSync,
      toggleWhiteLabel,
      setGuidelineTemplate,
      setStudioStyle,
      setWorkspaceStage,
      createMoodboard,
      renameMoodboard,
      deleteMoodboard,
      addMoodboardZone,
      patchMoodboardZone,
      removeMoodboardZone,
      addMoodboardItems,
      updateMoodboardItem,
      moveMoodboardItem,
      removeMoodboardItem,
      restoreMoodboardItem,
      voteMoodboardItem,
      placeMoodboardItem,
      placeMoodboardZone,
      connectMoodboardItems,
      removeMoodboardEdge,
      labelMoodboardEdge,
      setMoodboardView,
      tidyMoodboard,
      createBrief,
      setBriefQuestions,
      setBriefMeta,
      sendBrief,
      revokeBrief,
      deleteBrief,
      getBriefByToken,
      answerBrief,
      submitBrief,
      addDraft,
      acceptDraft,
      rejectDraft,
      addSignOffPin,
      resolveSignOffPin,
      setStrategyText,
      setStrategyTranslation,
      markStrategyReviewed,
      addPersona,
      updatePersona,
      removePersona,
      addVoiceTrait,
      updateVoiceTrait,
      removeVoiceTrait,
      addCoreValue,
      updateCoreValue,
      removeCoreValue,
      addCompetitor,
      updateCompetitor,
      setCompetitorColumns,
      renameWorkspace,
      removeCompetitor,
      addAsset,
      removeAsset,
      setAssetTags,
      setAssetStatus,
      setAssetType,
      renameAsset,
      addAssetVersion,
      restoreAssetVersion,
      addDepartmentView,
      renameDepartmentView,
      removeDepartmentView,
      addDeptItem,
      removeDeptItem,
      setDeptGuideline,
      setDeptInstructions,
      setDeptPublish,
      addTeamMember,
      removeTeamMember,
      setTeamRole,
      transferOwnership,
      createShareLink,
      revokeShareLink,
      restoreShareLink,
      resolveShareLink,
      proposeApproval,
      resolveApproval,
      saveVersionSnapshot,
      restoreVersion,
      addComplianceCheck,
      setSso,
      logAudit,
      addBlock,
      updateBlock,
      removeBlock,
      duplicateBlock,
      reorderBlocks,
      toggleSectionHidden,
      setSectionOrder,
      setBlockStyle,
      setSectionStyle,
      setSectionOptions,
      setSectionTitle,
      setSectionNote,
      setSiteMode,
      publishGuideline,
      unpublishGuideline,
      addTemplateBlocks,
      autoFillBlocks,
      addPage,
      renamePage,
      removePage,
      reorderPages,
      undo,
      redo,
      depth,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
