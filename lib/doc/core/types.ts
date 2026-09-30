/**
 * The page document, as data.
 *
 * Nothing in this folder imports React, Prisma, or anything from the app. That
 * is the point of it: the same functions run in the editor, in a server action,
 * in a Vitest run and — when the sync room arrives — inside a Cloudflare Worker
 * that has no DOM at all. A document model that can only be exercised by
 * clicking around a browser is a document model nobody can prove anything about.
 */

export type Locale = "en" | "ar";
export type Breakpoint = "desktop" | "tablet" | "phone";
export type Dir = "ltr" | "rtl";

/**
 * Text is keyed by locale rather than duplicated per language.
 *
 * Both keys are optional because a half-translated page is the normal state of
 * a page being written, not an error. The editor shows which fields are missing
 * a language; the published page falls back silently, because a client reading
 * the Arabic site should see the English heading rather than a gap.
 */
export type Localized<T = string> = Partial<Record<Locale, T>>;

/**
 * Property overrides, per scope.
 *
 * There is deliberately no `desktop` key and no `ltr` key. Those are not
 * scopes — they are the base values in `props`, and giving them an override
 * slot as well would create two places to write the same thing and a rule
 * about which one wins.
 */
export type Overrides = {
  bp?: Partial<Record<Exclude<Breakpoint, "desktop">, Record<string, unknown>>>;
  dir?: { rtl?: Record<string, unknown> };
};

/** The scopes a `setOverride` may address. */
export type OverrideScope = "tablet" | "phone" | "rtl";

export type BlockNode = {
  id: string;
  parentId: string | null;
  slot: string;
  /** A fractional index among siblings in the same (parentId, slot). */
  order: string;
  /** A key in the block registry. */
  type: string;
  /** Desktop / shared values. */
  props: Record<string, unknown>;
  /** field name -> localized value. */
  content?: Record<string, Localized>;
  overrides?: Overrides;
};

export type DocState = {
  pageId: string;
  version: number;
  nodes: Record<string, BlockNode>;
};

/**
 * The only write format.
 *
 * Every change to a document — a drag in the editor, an accepted AI draft, a
 * template insert, an import, and later a message from another person's
 * browser — is a list of these. One format means one validator, one permission
 * check, one undo implementation and one conflict rule, instead of four of each
 * that drift apart.
 */
export type Op =
  | { kind: "create"; node: BlockNode }
  /** Removes the node and everything under it. */
  | { kind: "delete"; id: string }
  | { kind: "move"; id: string; parentId: string | null; slot: string; order: string }
  /** The desktop / shared value. */
  | { kind: "setProp"; id: string; key: string; value: unknown }
  | { kind: "setOverride"; id: string; scope: OverrideScope; key: string; value: unknown }
  | { kind: "clearOverride"; id: string; scope: OverrideScope; key: string }
  | { kind: "setContent"; id: string; field: string; locale: Locale; value: string };

export type OpKind = Op["kind"];

/**
 * Which view an edit is being made from.
 *
 * `primaryLocale` is the workspace's own setting rather than the viewer's
 * language: an Arabic-first brand edits its structure in Arabic, and treating
 * English as "the real one" for every workspace would make RTL a permanent
 * second-class view of its own brand.
 */
export type ViewContext = {
  breakpoint: Breakpoint;
  dir: Dir;
  locale: Locale;
  primaryLocale: Locale;
};

/** The direction a locale is written in. */
export function dirOf(locale: Locale): Dir {
  return locale === "ar" ? "rtl" : "ltr";
}

/**
 * A view is primary when it is the one place structure may be edited: the
 * desktop width, in the workspace's own primary direction.
 */
export function isPrimaryView(ctx: ViewContext): boolean {
  return ctx.breakpoint === "desktop" && ctx.dir === dirOf(ctx.primaryLocale);
}

/**
 * Breakpoint widths, in one place because three things have to agree on them:
 * the CSS emitter's media queries, the editor's viewport frame, and the sweep
 * that measures whether the two match. They follow the design reference rather
 * than Tailwind's scale — this is the published brand page's cascade, not the
 * app chrome's.
 */
export const BREAKPOINT_MAX: Record<Exclude<Breakpoint, "desktop">, number> = {
  tablet: 1199,
  phone: 809,
};

/** The width the editor frames each view at. */
export const VIEWPORT_WIDTH: Record<Breakpoint, number> = {
  desktop: 1200,
  tablet: 810,
  phone: 390,
};

export const BREAKPOINTS: Breakpoint[] = ["desktop", "tablet", "phone"];
