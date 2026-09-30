import type { BlockNode, Breakpoint, Locale, Localized, ViewContext } from "./types";

/**
 * What a node's properties actually are, in a given view.
 *
 * The cascade is desktop-first, the way Framer and Figma Sites both work: the
 * base values in `props` hold for every width, and a narrower breakpoint only
 * says what differs. The alternative — storing a complete set of values per
 * breakpoint — means a change to the desktop design silently fails to reach the
 * phone, which is how a brand book ends up with a phone layout from two
 * redesigns ago.
 */

/** Locale defaults a block type declares for RTL — applied last, and weakest. */
export type LocaleDefaults = { rtl?: Record<string, unknown> };

/**
 * Merge order, narrowest and most specific last:
 *
 *   props → tablet → phone → rtl overrides → registry RTL defaults
 *
 * with the registry defaults applying only to keys the author has not set for
 * RTL themselves. That last clause is the whole reason automatic Arabic
 * typography does not become a thing people have to fight: they get the right
 * tracking without asking, and they can still overrule it.
 */
export function resolveProps(
  node: Pick<BlockNode, "props" | "overrides">,
  ctx: Pick<ViewContext, "breakpoint" | "dir">,
  localeDefaults?: LocaleDefaults,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...node.props };
  const bp = node.overrides?.bp;

  if (bp && (ctx.breakpoint === "tablet" || ctx.breakpoint === "phone")) {
    Object.assign(out, bp.tablet ?? {});
  }
  if (bp && ctx.breakpoint === "phone") {
    Object.assign(out, bp.phone ?? {});
  }

  const rtl = node.overrides?.dir?.rtl;
  if (ctx.dir === "rtl") {
    if (localeDefaults?.rtl) {
      for (const [key, value] of Object.entries(localeDefaults.rtl)) {
        // Only where the author has not spoken. An explicit RTL override is a
        // decision; a registry default is a starting point.
        if (!rtl || !(key in rtl)) out[key] = value;
      }
    }
    Object.assign(out, rtl ?? {});
  }

  return out;
}

/** Which scopes actually carry a value for `key`, for the inspector's dot. */
export function overriddenScopes(
  node: Pick<BlockNode, "overrides">,
  key: string,
): Array<"tablet" | "phone" | "rtl"> {
  const out: Array<"tablet" | "phone" | "rtl"> = [];
  if (node.overrides?.bp?.tablet && key in node.overrides.bp.tablet) out.push("tablet");
  if (node.overrides?.bp?.phone && key in node.overrides.bp.phone) out.push("phone");
  if (node.overrides?.dir?.rtl && key in node.overrides.dir.rtl) out.push("rtl");
  return out;
}

export type ResolvedText = {
  value: string;
  /** True when this locale is empty and the text shown came from the other one. */
  missing: boolean;
  /** Which locale the text actually came from. */
  from: Locale | null;
};

/**
 * One locale-keyed field, with the fallback made visible.
 *
 * `missing` is why this returns an object instead of a string. The published
 * page falls back silently — a client should never be shown scaffolding — but
 * the editor has to be able to say "this heading has no Arabic yet", and it can
 * only do that if the fallback is reported rather than hidden.
 */
export function resolveContent(
  node: Pick<BlockNode, "content">,
  field: string,
  locale: Locale,
): ResolvedText {
  const entry: Localized | undefined = node.content?.[field];
  const own = entry?.[locale]?.trim();
  if (own) return { value: entry![locale]!, missing: false, from: locale };

  const other: Locale = locale === "en" ? "ar" : "en";
  const fallback = entry?.[other]?.trim();
  if (fallback) return { value: entry![other]!, missing: true, from: other };

  return { value: "", missing: true, from: null };
}

/** Fields of this node that have no text in `locale`, for the missing counter. */
export function missingFields(node: Pick<BlockNode, "content">, locale: Locale): string[] {
  if (!node.content) return [];
  return Object.entries(node.content)
    .filter(([, v]) => !v?.[locale]?.trim())
    .map(([field]) => field);
}

/** Whether the node is hidden in this view — `hidden` is an ordinary prop. */
export function isHidden(
  node: Pick<BlockNode, "props" | "overrides">,
  ctx: Pick<ViewContext, "breakpoint" | "dir">,
): boolean {
  return resolveProps(node, ctx)["hidden"] === true;
}

/** Every breakpoint a node carries at least one override for. */
export function overriddenBreakpoints(node: Pick<BlockNode, "overrides">): Breakpoint[] {
  const out: Breakpoint[] = [];
  if (Object.keys(node.overrides?.bp?.tablet ?? {}).length) out.push("tablet");
  if (Object.keys(node.overrides?.bp?.phone ?? {}).length) out.push("phone");
  return out;
}
