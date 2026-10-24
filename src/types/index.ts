import type { Lang } from "@/types/lang";
export type { Lang };

import type { SectionOptions } from "@/components/features/guideline-site/model/sectionOptions";

export type SlotKind = "arabic" | "latin" | "symbol";

/**
 * Persisted slot phase. Momentary states (drag-over, type-rejected, the
 * pre-attach preview) live as local component state — they aren't data.
 */
export type UploadPhase = "empty" | "uploading" | "failed" | "attached";

export type FileFormat = "svg" | "png";

export interface LogoSlot {
  kind: SlotKind;
  phase: UploadPhase;
  fileName?: string;
  fileSizeKB?: number;
  format?: FileFormat;
  /** Always a real, downloadable resource — a public asset path for seed data, or an object URL for uploads. */
  url?: string;
  width?: number;
  height?: number;
  /** 0.25–1, the clearspace multiplier used to draw the guide */
  clearspaceMultiplier: number;
  progress?: number;
  errorMessage?: string;
  /**
   * The light (reversed) artwork for this same lockup — the white version a
   * brand supplies for dark grounds.
   *
   * A variant of the lockup rather than a fourth slot, because that is what it
   * is: the Arabic lockup's white version is still the Arabic lockup, and a
   * brand can have a different one per script. When it is set, anything drawing
   * on a dark ground uses this file verbatim instead of inverting the main one
   * — which is a guess that gets colour marks wrong (see lib/markTone.ts).
   */
  lightUrl?: string;
  lightFileName?: string;
  lightSizeKB?: number;
  lightFormat?: FileFormat;
}

export interface ColorSwatch {
  id: string;
  name: string;
  hex: string;
  isPrimary?: boolean;
  locked?: boolean;
}

export interface Typography {
  latinFamily: string;
  arabicFamily: string;
  /** Set when a real font file has been uploaded to Brand files and applied here — resolved to an @font-face at render time. */
  latinFontAssetId?: string;
  arabicFontAssetId?: string;
}

export type DomainStatus = "none" | "pending" | "verified";

export interface ClientAccess {
  passwordEnabled: boolean;
  password: string;
  customDomain: string;
  domainStatus: DomainStatus;
  /**
   * The label in front of `.markyos.app` on the client's link.
   *
   * Separate from `slug`, which is this workspace's key in the store and in
   * `/v/<slug>`: a slug is derived from the brand name and must stay stable,
   * while a subdomain is a public address the studio picks and can change. An
   * empty string means the client link falls back to `/v/<slug>`.
   */
  subdomain: string;
}

export type PlanKind = "free" | "pass" | "subscription";

export interface Billing {
  plan: PlanKind;
  purchasedAt?: number;
  stripeSessionId?: string;
}

// ---- v2.0 ----

export type PinSection = "overview" | "logo" | "color" | "typography";

export interface SignOffPin {
  id: string;
  section: PinSection;
  authorName: string;
  note: string;
  createdAt: number;
  resolved: boolean;
}

// ---- v3.0 ----

/**
 * The strategy is authored in two languages.
 *
 * Every field below has an `…Ar` twin rather than the whole strategy having a
 * second copy of itself. That is deliberate: a persona is one person described
 * twice, not two people. Parallel lists would let the English copy hold three
 * personas and the Arabic five, and nothing could then say which of them is the
 * same persona — so the pairing lives at the field, the way `title`/`arTitle`
 * already works for guideline blocks.
 *
 * An empty `…Ar` field means "not written yet", and the reader falls back to
 * the other language rather than rendering a blank.
 */
export interface Persona {
  id: string;
  name: string;
  role: string;
  description: string;
  nameAr?: string;
  roleAr?: string;
  descriptionAr?: string;
}

export interface VoiceTrait {
  id: string;
  trait: string;
  doExample: string;
  dontExample: string;
  traitAr?: string;
  doExampleAr?: string;
  dontExampleAr?: string;
}

export interface CoreValue {
  id: string;
  title: string;
  description: string;
  titleAr?: string;
  descriptionAr?: string;
}

/**
 * A column of the competitive-analysis table.
 *
 * Studios compare competitors on whatever axes that category actually turns
 * on — price, Arabic support, channel, switching cost — so the columns are the
 * studio's to define. "notes" is the one built-in column, backed by the
 * long-standing `Competitor.notes` field so existing data needs no migration.
 */
export interface CompetitorColumn {
  id: string;
  label: string;
  labelAr?: string;
}

export interface Competitor {
  id: string;
  name: string;
  /** The built-in "Notes" column. */
  notes: string;
  /** Values for every studio-defined column, keyed by column id. */
  cells: Record<string, string>;
  nameAr?: string;
  notesAr?: string;
  cellsAr?: Record<string, string>;
}

/**
 * The narrative fields below hold rich text as an HTML fragment — headings,
 * lists, quotes, links and tables — not plain text. Plain strings written by
 * an earlier version or by the file importer are still valid and are wrapped
 * into paragraphs at render time, so nothing needed migrating.
 */
export interface BrandStrategy {
  purpose: string;
  mission: string;
  vision: string;
  coreValues: CoreValue[];
  targetAudienceSummary: string;
  personas: Persona[];
  competitors: Competitor[];
  /** Columns of the competitive-analysis table, beyond the competitor's name. */
  competitorColumns: CompetitorColumn[];
  positioningStatement: string;
  uvp: string;
  /** "Personality & tone" — kept as voiceTraits, the existing do/don't matrix. */
  voiceTraits: VoiceTrait[];
  /** The Arabic copy of each narrative field. See the note on Persona. */
  purposeAr?: string;
  missionAr?: string;
  visionAr?: string;
  targetAudienceSummaryAr?: string;
  positioningStatementAr?: string;
  uvpAr?: string;
}

/** The narrative fields that exist in both languages. */
export type StrategyTextField =
  | "purpose"
  | "mission"
  | "vision"
  | "targetAudienceSummary"
  | "positioningStatement"
  | "uvp";

/**
 * How the Arabic copy of the strategy came to be.
 *
 * Machine output is marked as machine output. A studio that hands a client a
 * translated strategy without reading it is the failure this guards against,
 * so the flag drives a visible "review this" state rather than being metadata
 * nobody sees — and any hand edit clears it, because a reviewed field is no
 * longer a machine's guess.
 */
export interface StrategyTranslation {
  source: "manual" | "machine";
  /** When the last machine translation ran. */
  translatedAt: number | null;
  /** Which direction it ran in, so the banner can say. */
  direction: "en-ar" | "ar-en" | null;
  /** Fields still carrying unreviewed machine output, by their key. */
  unreviewed: string[];
}

// ---- Pillar 1: Brand Assets Manager ----
// The single source of truth for every file a workspace owns. A Guideline
// section (below) or a Department View references an asset by id — it never
// owns an upload flow of its own. The three fixed logo slots (`Workspace.logo`)
// predate this model and still manage their own upload UI on the Logo page;
// the Assets Manager surfaces them as read-only entries alongside everything
// uploaded here, so there's still one place that shows every file, even
// though the logo slots themselves aren't migrated onto this model yet.

export type AssetType = "photo" | "icon" | "pdf" | "font" | "mockup" | "export" | "pattern" | "graphic" | "illustration";

/**
 * Where a file sits between "we are looking at this" and "this is the brand".
 *
 * Exploration is never the source of truth. Only an approved asset may be
 * referenced by a guideline section, published, exported, or served on a public
 * route — so moodboard imagery and mockup drafts can live in the workspace
 * without any risk of reaching a client, and a studio's inspiration folder
 * never becomes something it accidentally hands over.
 *
 * Archived is retired rather than deleted: the file stops being offered for new
 * work but existing references keep resolving, because deleting an asset a
 * published guideline still points at is how a live brand book grows holes.
 */
export type AssetStatus = "exploration" | "approved" | "archived";

export interface AssetVersion {
  id: string;
  url: string;
  fileName: string;
  sizeKB: number;
  createdAt: number;
}

/**
 * Where a stock image came from and what the studio owes its author. Only set
 * on assets imported from an external library — a CC-BY photo legally has to
 * carry its credit wherever it is published, so the credit travels with the
 * asset rather than being something the studio is trusted to remember.
 */
export interface AssetCredit {
  /** "Openverse", "Unsplash", or the host of a pasted URL. */
  source: string;
  author: string;
  /** The page to link back to — the photo's page, not the image file. */
  sourceUrl: string;
  /** "CC0", "CC BY 4.0", "Unsplash License"… as reported by the source. */
  license: string;
  licenseUrl?: string;
}

export interface Asset {
  id: string;
  type: AssetType;
  fileName: string;
  url: string;
  sizeKB: number;
  tags: string[];
  uploadedAt: number;
  /**
   * Required, not optional, on purpose: a new asset source that forgets to say
   * what it is should fail to compile rather than default its way onto a
   * client's guideline.
   */
  status: AssetStatus;
  /** Past versions, most recent first. The fields above are the current version. */
  versions: AssetVersion[];
  /** Set when the file came from a stock library rather than an upload. */
  credit?: AssetCredit;
  /**
   * Font metadata, set on `type: "font"` assets.
   *
   * A font family is several files — one per weight and style — and they have
   * to be declared under one `@font-face` family name for `font-weight: 600`
   * to reach the semibold file instead of the browser faking it by smearing
   * the regular. `family` is what groups them; applying any one file to a
   * script applies the whole family.
   */
  font?: {
    /** The family as it should be named and displayed, e.g. "Cairo". */
    family: string;
    weight: number;
    style: "normal" | "italic";
    /** Where it came from, so the UI can be honest about it. */
    source: "upload" | "google";
  };
}

// ---- Pillar 3: Brand Strategy Hub — Department Views ----
// A department view is a *selection* over existing Guideline sections and
// Strategy Hub content, never an independent copy. Resolving `items` at
// render time (not storing duplicated text) is what makes an edit to the
// Voice Matrix or a section propagate to every department automatically.

export type DeptItemType = "section" | "purpose" | "mission" | "persona" | "voiceTrait";

export type SectionKey = "overview" | "logo" | "color" | "typography";

export interface DepartmentViewItem {
  id: string;
  itemType: DeptItemType;
  /** Set when itemType is "section" — which fixed guideline page this points to. */
  sectionKey?: SectionKey;
  /** Set when itemType is "persona" or "voiceTrait" — id into strategy.personas/voiceTraits. */
  refId?: string;
  relevanceNote?: string;
}

/**
 * One headed block of a department's instruction page.
 *
 * Built either by parsing an uploaded handbook — its own headings become these
 * — or written by hand. Stored as structure rather than as one blob of text so
 * the page can be navigated, reordered and rendered like a document instead of
 * dumped as a wall of prose.
 */
export interface DeptInstructionSection {
  id: string;
  heading: string;
  body: string;
  /** The file this block was read out of, when it wasn't typed by hand. */
  sourceFileName?: string;
}

export interface DepartmentView {
  id: string;
  name: string;
  createdAt: number;
  items: DepartmentViewItem[];
  /** The department's own guideline content — free text and/or an uploaded file, independent of the curated items above. */
  guidelineText: string;
  guidelineFileAssetId?: string;
  /** The generated instruction page: the department's handbook, in order. */
  instructionSections: DeptInstructionSection[];
  /** Whether this department's page is published to the client-facing guideline site. */
  publishToSite: boolean;
}

export interface DeveloperSettings {
  apiKey: string;
  webhookUrl: string;
  figmaConnected: boolean;
  figmaSyncedAt?: number;
}

// ---- v4.0 ----

export type TeamRole = "owner" | "editor" | "viewer" | "client";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
}

export type ApprovalStatus = "pending" | "approved" | "rejected";

export interface ApprovalRequest {
  id: string;
  summary: string;
  proposedBy: string;
  status: ApprovalStatus;
  createdAt: number;
  resolvedAt?: number;
  reviewNote?: string;
}

export interface VersionSnapshot {
  id: string;
  label: string;
  createdAt: number;
  createdBy: string;
  overviewHtml: string;
  colors: ColorSwatch[];
  typography: Typography;
}

// ---- v5.0 ----

/**
 * A read-only link to part of this brand's thinking.
 *
 * Deliberately not the same thing as the published guideline site. That is the
 * finished deliverable a client is handed; this is for the middle of the work —
 * sending a new hire the brand's strategy, or sending Sales only the page that
 * governs Sales, without giving either of them the editor or the whole book.
 *
 * The id *is* the URL token, so a link is revoked by revoking the record it
 * points at rather than by deleting it — a revoked link has to keep existing,
 * or the page can't tell "this was switched off" from "this was never real",
 * and those deserve different answers.
 */
export type ShareScope = "strategy" | "department";

export interface ShareLink {
  id: string;
  scope: ShareScope;
  /** Set when scope is "department" — which one this link opens. */
  departmentId?: string;
  /** What the studio called it, so a list of links is readable. */
  label: string;
  createdAt: number;
  revokedAt: number | null;
}

export interface ComplianceCheck {
  id: string;
  fileName: string;
  createdAt: number;
  matchedSwatchIds: string[];
  flaggedColors: string[];
}

// ---- The Creation Layer: drafts ----
//
// Everything a brief answer, an import, a palette extraction or (later) the AI
// assistant proposes lands here first. Nothing written by a machine or by a
// client reaches a Strategy Hub field or a guideline until a person accepts
// it — that is the rule the rest of the Creation Layer is built on, and this
// is the one place it is enforced rather than a convention each feature is
// trusted to follow.

export type DraftStatus = "pending" | "accepted" | "rejected" | "superseded";

/** What produced a draft. Drives the provenance chip the reviewer sees. */
export type DraftSource = "brief" | "ai" | "ingestion" | "palette";

/**
 * What a draft is proposing to change.
 *
 * `strategyField` is the only one wired up today; the others exist because
 * later phases write into them and a queue that has to be re-shaped when the
 * second producer arrives is a queue that gets bypassed instead.
 */
export type DraftTargetType = "strategyField" | "guidelineSection" | "palette" | "copy";

/**
 * Where a draft came from, in enough detail for a reviewer to judge it.
 *
 * Not metadata nobody sees: a studio accepting a client's answer into the
 * brand's strategy should be able to see which question it answered, and
 * later, which model wrote it from which inputs. An accepted draft keeps this
 * so the decision stays auditable after the fact.
 */
export interface DraftProvenance {
  /** One line naming the origin, e.g. "Discovery brief — Q3, What do you sell?" */
  summary: string;
  /** The inputs it was derived from, by name. */
  inputs: string[];
  /** Set for AI drafts only. */
  model?: string;
  promptVersion?: string;
  /** Who asked for it — an account name, or the client's name on a brief. */
  requestedBy: string;
}

// ---- The Creation Layer: discovery brief ----
//
// The client's first contact with Markyos, on day one of the project rather
// than at handover. They answer at /b/<token> with no account, in Arabic or
// English, and the answers become drafts against the Strategy Hub fields they
// inform — so the brief feeds the strategy instead of being re-typed into it.

export type BriefTemplateKind = "new-brand" | "rebrand" | "sub-brand";

export type BriefQuestionType = "text" | "long" | "choice" | "scale";

export interface BriefChoice {
  value: string;
  labelEn: string;
  labelAr: string;
}

export interface BriefQuestion {
  key: string;
  category: string;
  type: BriefQuestionType;
  /** Written as originals in both languages, not translated from the English. */
  promptEn: string;
  promptAr: string;
  helpEn?: string;
  helpAr?: string;
  /** The Strategy Hub field this answer drafts into, when it maps to one. */
  strategyField?: StrategyTextField;
  choices?: BriefChoice[];
}

export interface BriefAnswer {
  questionKey: string;
  value: string;
  answeredAt: number;
}

/**
 * `sent` means a link exists; `in_progress` means the client has saved at least
 * one answer. The distinction is what lets a studio tell "they haven't opened
 * it" from "they started and stalled", which are different conversations.
 */
export type BriefStatus = "draft" | "sent" | "in_progress" | "submitted";

export interface Brief {
  id: string;
  /**
   * The id IS the URL. Revoking happens by marking the record rather than
   * deleting it, for the same reason share links work that way: a dead link
   * has to be able to say "this was switched off" rather than 404.
   */
  token: string;
  label: string;
  clientName: string;
  template: BriefTemplateKind;
  status: BriefStatus;
  /** Ordered question keys — the studio's selection from the library. */
  questions: string[];
  /** Which language the client sees first. They can switch. */
  lang: Lang;
  answers: BriefAnswer[];
  createdAt: number;
  sentAt: number | null;
  submittedAt: number | null;
  revokedAt: number | null;
  /**
   * Set by the server when the client sends the brief from their own
   * device. The studio's app turns the answers into proposals the next time
   * it loads the brand, then clears it.
   */
  proposalsPending?: boolean;
}

/**
 * Where a brand is in its life, across the studio's whole roster.
 *
 * This is deliberately not a CRM. Leads, deals, proposals and invoicing belong
 * to whatever the studio already pays for — competing with HubSpot is a fight
 * nobody wins on RTL quality, and a per-seat agency tool contradicts the
 * client-pays ownership model. What Markyos owns is the brand's lifecycle, and
 * this is the smallest honest expression of it: one stage per workspace, moved
 * by hand, visible on one board.
 */
export type WorkspaceStage = "discovery" | "strategy" | "design" | "review" | "delivered" | "live";

// ---- The Creation Layer: moodboard ----
//
// A view over the workspace's exploration-status assets, not a store of its
// own. That is what keeps third-party inspiration out of every published
// surface for free: the images carry EXPLORATION, and the publish snapshot
// already filters on exactly that — so no template, export or share view has
// to know the moodboard exists.
//
// A masonry grid rather than a freeform canvas, deliberately. A real-time
// multiplayer whiteboard is Miro and FigJam territory, and a canvas editor was
// already ruled out for guideline layouts.

/**
 * What a zone is for.
 *
 * The kind is what makes a decision possible later: "propose this palette"
 * only means anything because the cards underneath were put there *as* colour
 * rather than as imagery. A flat board of pictures can be admired; it cannot
 * be turned into a brand.
 *
 * `unsorted` is the tray. Milanote's best idea is that "I haven't decided
 * where this goes" is a real answer and deserves a real place, rather than
 * forcing a filing decision at the moment of collecting.
 */
export type ZoneKind =
  | "imagery"
  | "palette"
  | "type"
  | "texture"
  | "words"
  | "references"
  | "unsorted"
  | "custom";

/** What a card *is*. Not everything on a board is a file. */
export type MoodItemKind = "asset" | "note" | "swatch" | "link" | "font";

export interface MoodboardItem {
  id: string;
  kind: MoodItemKind;
  /**
   * References an Asset — never a copy of one. Absent on a note, a swatch or
   * a link, because text with no bytes has no business in brand files.
   */
  assetId?: string;
  /** Free text (a note), a hex (a swatch), a URL and title (a link). */
  note?: string;
  arNote?: string;
  hex?: string;
  name?: string;
  url?: string;
  /** A fractional index within its zone — see lib/doc/core/order.ts. */
  order: string;
  /** How many columns the card spans in the list view's masonry. */
  size: "s" | "m" | "l";
  /**
   * Where the card sits on the freeform canvas, in board coordinates.
   *
   * Optional, and that is the migration: a board made before the canvas existed
   * has no coordinates, and inventing them at hydration time would mean a
   * migration that has to be right first time for data nobody can inspect.
   * Instead `lib/moodboard/layout.ts` derives a position for anything missing
   * one, deterministically, so an old board opens laid out and only stores
   * coordinates once somebody actually moves something.
   */
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  /**
   * Who picked this one, by name.
   *
   * A list rather than a counter, which is the same decision the server schema
   * makes. A counter cannot answer "did I already pick this?", and two people
   * voting at once on a counter is a lost update — on the one number the
   * shortlist is sorted by.
   */
  votes: string[];
  createdBy: string;
  createdAt: number;
}

export interface MoodboardZone {
  id: string;
  kind: ZoneKind;
  title: string;
  arTitle: string;
  /** The bilingual "how to fill this in" card, from the template. */
  instructions?: string;
  arInstructions?: string;
  /** Collapsed by this person. A per-viewer convenience, kept on the board
   *  rather than in localStorage because a board is shared and a half-read
   *  instruction card is not worth a second storage mechanism. */
  instructionsDismissed?: boolean;
  order: string;
  items: MoodboardItem[];
  /**
   * The frame this zone draws on the canvas. Same optionality, same reason, as
   * {@link MoodboardItem.x}.
   *
   * A zone is a *region* on the board, not a band of a list: dropping a card
   * inside these bounds is what files it here. That is the whole reason the
   * canvas can stay freeform and the board can still know that the swatches in
   * the Palette frame are a palette — which is what "propose this palette" is
   * built on.
   */
  x?: number;
  y?: number;
  w?: number;
  h?: number;
}

/**
 * A line between two cards.
 *
 * This is the difference between a wall of references and a board somebody can
 * reason on: "this typeface goes with that photograph", "these three all came
 * from the same idea". Milanote, Miro and Canva's whiteboard all have it, and
 * without it a moodboard can only say what is on it, never how any of it
 * relates.
 *
 * Stored on the board rather than on either card, because an edge belongs to
 * neither end — and because deleting one card has to take its edges with it,
 * which is one filter here and two reciprocal updates the other way.
 */
export interface MoodboardEdge {
  id: string;
  /** Item ids. Direction is only ever drawn as an arrowhead; nothing reads it. */
  from: string;
  to: string;
  /** A word or two on the line — "pairs with", "too cold". */
  label?: string;
}

/** How a board is being worked. */
export type MoodboardView = "canvas" | "columns";

export interface Moodboard {
  id: string;
  title: string;
  createdAt: number;
  /** The template it was made from, so zone copy is looked up rather than copied. */
  templateKey?: string;
  zones: MoodboardZone[];
  /** Connections between cards. Absent on a board made before these existed. */
  edges?: MoodboardEdge[];
  /**
   * The canvas is the board; the column view is the same board as a list.
   *
   * Both are kept because they answer different questions and because one of
   * them is reachable by keyboard. A freeform canvas is a pointer instrument —
   * dragging a card to a position is not an action a keyboard can express — so
   * the list view is not a legacy fallback, it is the accessible way to do
   * everything except arrange.
   */
  view?: MoodboardView;
}

export interface Draft {
  id: string;
  targetType: DraftTargetType;
  /** For `strategyField`, the field key — including an `…Ar` twin. */
  targetRef: string;
  /** The proposed value. JSON for anything that isn't a plain string. */
  content: string;
  source: DraftSource;
  provenance: DraftProvenance;
  status: DraftStatus;
  createdAt: number;
  decidedAt: number | null;
  /** The account that accepted or rejected it. */
  decidedBy: string | null;
}

// ---- Website builder ----
// Freeform, reorderable sections a studio adds to the client-facing
// guideline site beyond the fixed Overview/Logo/Color/Typography pages —
// the "zero-code, drag to reorder" layer. Text/quote content is stored in
// both languages (unlike overviewHtml/strategy, which are single-language
// and switched via Workspace.primaryLocale) since this is what the
// client-facing language toggle actually switches between.

export type BlockKind =
  // A layout container rather than content: it lays its child blocks out in
  // columns. Nesting is what makes a real page composition possible instead of
  // one single-file stack of sections.
  | "columns"
  | "text"
  | "image"
  | "gallery"
  | "quote"
  | "embed"
  | "divider"
  | "spacer"
  | "video"
  | "button"
  | "stat"
  | "faq"
  | "socialLinks"
  | "form"
  // "Brand" blocks — not static content. Each renders a live view straight
  // off the workspace's own design-system data (colors, logo, typography,
  // icon assets) or its uploaded documents, the same way the fixed
  // Logo/Color/Typography/Icons sections already do. Editing that data
  // anywhere in the app updates every block that shows it — there is
  // nothing to copy or keep in sync by hand.
  | "brandLogo"
  | "brandColors"
  | "brandType"
  | "brandIcons"
  | "files";

export interface SocialLink {
  id: string;
  platform: string;
  url: string;
}

// ---- Guideline site templates ----
// Three selectable presentational shells for the client-facing guideline
// site, inspired by real brand-guideline microsites. All three render the
// exact same live workspace data (colors, logo, typography, assets,
// strategy, custom blocks) — only the navigation, hero, and section framing
// differ. "vault": dark, single-scroll, numbered sections, floating CTA.
// "docs": fixed sidebar nav, numbered color-band section headers.
// "studio": centered floating pill nav, full-bleed hero per section.
// "deck" is the odd one out — not a website at all but a 1920×1080 slide
// deck, composed in absolute pixels and scaled as whole frames, for studios
// that present a guideline rather than link to it.
// "manual": the printed brand manual, on screen — a fixed left rail carrying
// the chapter number, running head and page title, content in the right
// column, and a dark full-bleed chapter opener before each part. The shape a
// client recognises from every PDF brand book they have ever been sent.
// "mosaic": a brand hub rather than a document — a bento grid of tiles opening
// on the whole identity at a glance (mark, palette, type, counts), with each
// section below laid into the same grid at full or half width. The one template
// here that is a page rather than a read-through.
export type GuidelineTemplate = "vault" | "docs" | "studio" | "deck" | "manual" | "mosaic";

// The "studio" style offers three distinct, fully professional sub-styles
// rather than one fixed look — each modeled closely on a different real
// brand-guideline microsite's actual navigation pattern, hero treatment, and
// color system (not just a palette swap of the same layout):
// "signal": dark, single continuous scroll, numbered chapters, a hamburger
//   dropdown nav, and a persistent floating download CTA.
// "atlas": a fixed, auto-expanding accordion sidebar with a full-bleed
//   numbered color-band hero per section.
// "prism": a centered floating pill nav with a full-bleed gradient hero per
//   section and bracket-style eyebrow labels — the original "studio" look.
export type StudioStyle = "signal" | "atlas" | "prism";

/**
 * Per-element design overrides, applied on top of whatever the template
 * already renders.
 *
 * Deliberately a small set of *semantic* choices rather than free CSS. The
 * guideline site is bilingual and responsive: absolute positions and hard
 * pixel widths would mirror wrongly in Arabic and collapse on a phone, so
 * "move this left" is stored as an alignment and resolved per direction at
 * render time. Every field is optional, and an unset field means "whatever
 * the template does" — so a block that was never styled keeps following the
 * template if the studio switches to another one.
 */
export interface BlockStyle {
  /**
   * Which layout this section is drawn in — see `lib/sectionVariants.ts`.
   *
   * Not a style declaration but a choice of renderer, which is why no CSS
   * emitter reads it and why `isEmptyStyle` ignores it. A palette can be swatch
   * cards, full-width bands or dense chips; those are different components, not
   * different values of a property, and no amount of padding and alignment turns
   * one into another.
   *
   * Unset means the section's default layout, and a key naming a layout that no
   * longer exists resolves back to that default rather than rendering nothing.
   */
  variant?: string;
  /** Start/end are direction-relative, so they mirror correctly in Arabic. */
  align?: "start" | "center" | "end";
  /**
   * Scales the element. 0.75–1.75, 1 being the template's own size.
   *
   * Applied as `zoom`, which reflows — unlike a transform, the element still
   * takes the space it occupies, so the section below it moves down instead of
   * being overlapped. It scales everything inside, not only the type, which is
   * why the control is labelled "Scale" and not "Text size".
   */
  scale?: number;
  textColor?: string;
  background?: string;
  padding?: "none" | "sm" | "md" | "lg";
  radius?: "none" | "md" | "lg";
  /** Reading measure. "narrow" is a text column; "full" fills the section. */
  width?: "narrow" | "wide" | "full";
  /** Kept out of the published site without deleting it or its content. */
  hidden?: boolean;
  /**
   * Narrower widths, and the other direction — what differs, nothing more.
   *
   * Desktop-first, the way Framer and Figma Sites both cascade. A key set here
   * says "at this width, instead"; a key nobody set keeps following the base
   * value, so changing the desktop design still reaches the phone. Storing a
   * complete set of values per breakpoint is the alternative, and it is how a
   * brand book ends up with a phone layout from two redesigns ago.
   *
   * `rtl` is the same idea applied to direction, and it is a last resort: the
   * whole style vocabulary is direction-relative already (`start`, not `left`),
   * so a section should almost never need one.
   */
  bp?: {
    tablet?: ResponsiveStyle;
    phone?: ResponsiveStyle;
  };
  rtl?: ResponsiveStyle;
}

/**
 * The subset of BlockStyle a narrower width or the other direction may change.
 *
 * Not every key: `hidden` is here because hiding a section on phones is a real
 * layout decision, but the design vocabulary stops short of letting a phone
 * override turn into a second design nobody maintains.
 */
export type ResponsiveStyle = Pick<
  BlockStyle,
  "align" | "scale" | "padding" | "width" | "hidden"
>;

export interface PageBlock {
  id: string;
  kind: BlockKind;
  order: number;
  /** Design overrides for this block — see BlockStyle. */
  style?: BlockStyle;
  title?: string;
  arTitle?: string;
  text?: string;
  arText?: string;
  attribution?: string;
  /** image: at most one id used. gallery: any number. Refers to Workspace.assets. */
  assetIds?: string[];
  /** embed only — raw HTML rendered as-is, same trust model as overviewHtml. Also
   *  the honest way to bring in a real third-party widget: paste the embed
   *  snippet Calendly/Typeform/Mailchimp/etc. already give you, rather than
   *  this app faking a real API integration with any of them. */
  embedHtml?: string;
  /** button: the link target. form: where "Send" opens a mailto: to. */
  linkUrl?: string;
  /** video: a YouTube or Vimeo URL, resolved to an embed iframe at render time. */
  videoUrl?: string;
  /** spacer only. */
  size?: "sm" | "md" | "lg";
  /** socialLinks only. */
  socialLinks?: SocialLink[];
  /** columns only — how many columns its children are laid out in. */
  columnCount?: number;
  /**
   * Set on a block nested inside a "columns" block. The block list stays flat
   * and the tree is derived from this, so every existing action that finds a
   * block by id (update, remove, reorder) keeps working on nested children
   * with no special cases.
   */
  parentId?: string;
  /** Which column of `parentId` this block sits in. */
  columnIndex?: number;
}

// ---- Guidelines editor: custom pages ----
// Beyond Home (Overview + the fixed Logo/Color/Typography/Photography/Icons
// sections + its own customBlocks), a studio can add fully independent
// pages — each with its own url slug and its own block list — for content
// that doesn't belong on Home (Voice, Examples, Press, Contact...). This is
// what makes the guideline site an actual multi-page site with real,
// addressable URLs rather than one long scroll with anchors.
export interface GuidePage {
  id: string;
  name: string;
  arName: string;
  slug: string;
  order: number;
  blocks: PageBlock[];
}

export interface Workspace {
  id: string;
  /**
   * Which account's brand this is.
   *
   * Only the studio-admin side under /w/ checks it. The client link at
   * /v/<slug> and a share link at /s/<token> deliberately do not: the whole
   * point of those is that someone with no account at all can open them.
   */
  ownerAccountId: string;
  slug: string;
  name: string;
  initials: string;
  /**
   * The brand's own language — which one the client sees first, and which one
   * counts as written rather than missing.
   *
   * This was `lang`, and it was doing two unrelated jobs. It is a property of
   * the *brand*: the published site at /v/<slug> opens in it, the canvas
   * previews in it, `lib/doc/core/rules.ts` resolves the bilingual fallback
   * against it, and the page review calls a missing value in this language an
   * error while the same gap in the other language is only a warning.
   *
   * It was also, by the same field, the language of the studio's own interface
   * — so a studio in Riyadh building an English brand had to work in English
   * chrome, and switching the chrome quietly changed which half of every
   * bilingual field was treated as authoritative. The interface language
   * belongs to the person, not the brand, and lives on `Account.adminLang`.
   *
   * Chosen when the brand is created; the Owner can change it.
   */
  primaryLocale: Lang;
  sharedStatus: "shared" | "draft";
  createdAt: number;
  updatedAt: number;
  overviewHtml: string;
  overviewSavedAt: number;
  /** Brand main details, shown on Overview. */
  industry: string;
  tagline: string;
  foundedYear: string;
  colors: ColorSwatch[];
  logo: Record<SlotKind, LogoSlot>;
  /** How/when to use the logo, and which colors are its main colors — shown on Visual identity > Logo system. */
  logoUsageNotes: string;
  logoColorIds: string[];
  typography: Typography;
  clientAccess: ClientAccess;
  billing: Billing;
  signOffPins: SignOffPin[];
  strategy: BrandStrategy;
  /** Provenance of the strategy's Arabic copy — see StrategyTranslation. */
  strategyTranslation: StrategyTranslation;
  assets: Asset[];
  departmentViews: DepartmentView[];
  developer: DeveloperSettings;
  team: TeamMember[];
  approvals: ApprovalRequest[];
  versionHistory: VersionSnapshot[];
  whiteLabel: boolean;
  complianceChecks: ComplianceCheck[];
  /**
   * Pending and decided proposals into this brand. Kept on the workspace
   * rather than beside the thing they target, so one queue can show everything
   * awaiting review — a reviewer should not have to visit eight tabs to find
   * out what is waiting.
   */
  drafts: Draft[];
  /** Discovery briefs sent to this brand's client. */
  briefs: Brief[];
  /** Exploration boards. The images themselves live in `assets`. */
  moodboards: Moodboard[];
  /** Where this brand sits on the studio's lifecycle board. */
  stage: WorkspaceStage;
  customBlocks: PageBlock[];
  /** Read-only links to the strategy, or to one department's page. */
  shareLinks: ShareLink[];
  /**
   * Ids of the fixed guideline-site sections the studio has switched off
   * ("overview", "logo", "color", ...). The fixed sections are derived from
   * workspace data rather than authored, so this is the only way to drop one
   * from the published site without deleting the underlying brand data.
   */
  hiddenSections: string[];
  /**
   * Studio-written headings for the derived sections, keyed by section id
   * ("logo", "color", "typography", "app-icon"…) and stored per language.
   * Each template ships its own wording; only an actual override is kept here,
   * so a section left alone keeps following the template it's rendered in, and
   * clearing the heading restores that default rather than blanking it.
   */
  sectionTitles: Record<string, { en?: string; ar?: string }>;
  /**
   * A studio-written line of copy under each derived section's heading, keyed
   * and stored the same way as `sectionTitles`. The sections themselves are
   * built from brand data and so carry no authored prose of their own; this is
   * where the studio explains *how* to use what the section shows.
   */
  sectionNotes: Record<string, { en?: string; ar?: string }>;
  /**
   * The order every section of the Home page is rendered in — the derived ones
   * by their own id ("logo", "color", …) and each authored block as
   * "block-<id>". One list for both kinds is what lets a studio drop a custom
   * section between Logo and Colour instead of only appending to the bottom.
   *
   * It is a *preference*, not the source of truth for which sections exist: an
   * id that no longer resolves is skipped, and a section that appears later
   * (the first colour added, a newly inserted block) falls into its natural
   * place rather than requiring this list to be rewritten. An empty list means
   * the template's own order, so a workspace that has never been rearranged
   * keeps following whichever template it's rendered in.
   */
  sectionOrder: string[];
  /**
   * Design overrides for the derived sections, keyed the same way as
   * `sectionTitles`. An authored block carries its own `style`; these sections
   * are built from brand data and have no block to hold one.
   */
  sectionStyles: Record<string, BlockStyle>;
  /**
   * What each derived section shows inside itself — see `lib/sectionOptions.ts`.
   *
   * Keyed the same way as `sectionStyles` and deliberately *not* part of it. A
   * `BlockStyle` is a set of visual declarations that CSS emitters read and
   * `isEmptyStyle` counts; these are content decisions — which value formats a
   * palette prints, which scripts a specimen sets, whether the logo section
   * carries its construction drawings — that no emitter should ever see. Keeping
   * them apart is what stops "show the character set" from one day turning into a
   * CSS property because it happened to live in a type called Style.
   */
  sectionOptions: Record<string, SectionOptions>;
  /**
   * The client-facing site's ground. "auto" keeps the original behaviour —
   * inferred from a swatch named canvas/background — which is right when a
   * brand has defined one and arbitrary when it hasn't, so a studio can now
   * say outright which it wants.
   */
  siteMode: "auto" | "light" | "dark";
  guidelineTemplate: GuidelineTemplate;
  /** Only meaningful when guidelineTemplate is "studio" — which of the 3 sub-styles to render. */
  studioStyle: StudioStyle;
  pages: GuidePage[];
  /** The last published copy, or null if this guideline has never gone live. */
  published: PublishedSnapshot | null;
  publishedAt: number | null;
}

/**
 * What clients actually see. A publish takes an immutable copy of the
 * workspace and serves *that* at /v/<slug>, so a studio can keep editing a
 * live brand book without anything reaching its client until it says so.
 * Omitting the publish fields keeps the snapshot from nesting into itself.
 */
export type PublishedSnapshot = Omit<Workspace, "published" | "publishedAt">;

export interface Session {
  /** Which account this session belongs to — the join back to `accounts`. */
  accountId: string;
  email: string;
  name: string;
  startedAt: number;
  /**
   * False means "this browser only, until it closes".
   *
   * The session is dropped on the next cold start rather than being persisted
   * indefinitely, which is what someone signing in on a borrowed machine is
   * asking for when they leave the box unticked.
   */
  remember: boolean;
}

/** A password reset in flight. Only ever one per account. */
export interface ResetRequest {
  accountId: string;
  token: string;
  requestedAt: number;
}

/**
 * The person using Markyos, as opposed to the brands they work on.
 *
 * Kept beside `session` rather than inside it because a session is "someone is
 * signed in right now" and this is "who this account is" — the profile has to
 * survive a logout, or changing your name would mean setting it again every
 * time you came back.
 *
 * `password` holds a derived key, not a password — see `lib/auth.ts` for the
 * format and for what this build can and cannot promise about it. It is never
 * empty: registration requires one and checks it on every sign-in. The older
 * behaviour, where an account with no password let any password through, is
 * gone; it made the change-password form a button that lied.
 */
export interface Account {
  id: string;
  name: string;
  email: string;
  /** A derived key in the format `lib/auth.ts` documents — never a password. */
  password: string;
  passwordUpdatedAt: number | null;
  createdAt: number;
  lastLoginAt: number | null;
  /**
   * Which language this person wants the studio interface in.
   *
   * Theirs, not the brand's — see `Workspace.primaryLocale` for the half of
   * the old `lang` field that stayed with the brand. Two people working on the
   * same brand can read the app in different languages, which is the ordinary
   * case for a studio with a bilingual team.
   *
   * `null` means "follow whichever brand is open", which is exactly what the
   * single field used to do. That default is load-bearing: it keeps every
   * existing browser rendering as it did until somebody states a preference,
   * so splitting the field changes no behaviour on its own.
   */
  adminLang: Lang | null;
  /**
   * Account-wide role, from the server. Brand access never comes from this
   * (see `TeamRole`); it only opens the platform admin area. Absent on a
   * browser-only account, which is always a member.
   */
  role?: AccountRole;
  /**
   * Who the account is for: a studio, a freelancer or a company. Chosen at
   * signup, changed afterwards only by a platform admin; decides wording,
   * limits and prices (constants/accountTypes.ts). Absent on a platform admin
   * and on a browser-only account from before types existed.
   */
  accountType?: AccountType | null;
  isAdmin?: boolean;
  avatarUrl?: string | null;
  twoFactorEnabled?: boolean;
}

export type AccountRole = "admin" | "member";

export type AccountType = "studio" | "freelancer" | "company";

export interface AuditEntry {
  id: string;
  ts: number;
  actor: string;
  action: string;
  target: string;
}

export interface SsoConfig {
  enabled: boolean;
  provider: string;
  domain: string;
}

export interface AppState {
  session: Session | null;
  /**
   * Every account registered in this browser.
   *
   * This was a single `account`, which meant registering silently overwrote
   * whoever was already here and handed the new person their brands. Two
   * colleagues sharing a machine is an ordinary thing, and it destroyed data.
   */
  accounts: Account[];
  /** Resets in flight, keyed by token. Cleared as they are used or expire. */
  resets: ResetRequest[];
  workspaces: Workspace[];
  auditLog: AuditEntry[];
  sso: SsoConfig;
}
