import { isPrimaryView } from "./types";
import type { Op, OverrideScope, ViewContext } from "./types";

/**
 * Where an edit is allowed to land.
 *
 * One bilingual document, never two copies. That single rule is what stops
 * brand decay: the moment Arabic and English are separate documents, they start
 * drifting, and a year later the client is reading two different brands. So
 * structure — what blocks exist, where they sit, what order they are in — is
 * edited in exactly one view, and every other view may only override properties
 * or hide things.
 *
 * Figma Sites reached the same rule from the responsive side, and it is the
 * same rule: a secondary breakpoint cannot restructure, only restyle. Markyos
 * applies it to direction as well as width, because for a bilingual brand book
 * the two problems are the same problem.
 *
 * This runs in the editor to grey out controls, and again on the server, where
 * it is the check that actually holds. The UI copy exists so that "you can't do
 * that here" comes with somewhere you can.
 */

export type RuleVerdict =
  | { ok: true }
  | { ok: false; reason: "STRUCTURAL_IN_SECONDARY" | "SHARED_VALUE_IN_SECONDARY" | "WRONG_SCOPE" };

/** The override scope a secondary view writes into. */
export function scopeForView(ctx: ViewContext): OverrideScope | null {
  if (ctx.breakpoint === "phone") return "phone";
  if (ctx.breakpoint === "tablet") return "tablet";
  if (ctx.dir !== (ctx.primaryLocale === "ar" ? "rtl" : "ltr")) return "rtl";
  return null;
}

export function canApply(op: Op, ctx: ViewContext): RuleVerdict {
  if (isPrimaryView(ctx)) {
    // Even here, an override may only be written for a scope that exists. A
    // desktop view writing a "phone" override is legitimate (the inspector
    // offers it); writing one for a scope name that is not a scope is not.
    if (op.kind === "setOverride" || op.kind === "clearOverride") {
      return isScope(op.scope) ? { ok: true } : { ok: false, reason: "WRONG_SCOPE" };
    }
    return { ok: true };
  }

  switch (op.kind) {
    case "create":
    case "delete":
    case "move":
      return { ok: false, reason: "STRUCTURAL_IN_SECONDARY" };

    case "setProp":
      // The shared value belongs to every view. Editing it from a narrow one
      // would change the desktop design from a place that cannot show it, so
      // the editor turns this into a setOverride before it ever gets here.
      return { ok: false, reason: "SHARED_VALUE_IN_SECONDARY" };

    case "setOverride":
    case "clearOverride": {
      const allowed = scopeForView(ctx);
      return op.scope === allowed ? { ok: true } : { ok: false, reason: "WRONG_SCOPE" };
    }

    case "setContent":
      // Content is not structure. Someone reviewing the Arabic at phone width
      // should be able to fix a typo where they found it.
      return { ok: true };
  }
}

function isScope(value: string): value is OverrideScope {
  return value === "tablet" || value === "phone" || value === "rtl";
}

/** Rewrites an edit so it lands where the current view is allowed to write. */
export function retargetForView(op: Op, ctx: ViewContext): Op {
  if (op.kind !== "setProp" || isPrimaryView(ctx)) return op;
  const scope = scopeForView(ctx);
  if (!scope) return op;
  return { kind: "setOverride", id: op.id, scope, key: op.key, value: op.value };
}

/** Why the current view is restricted, for the banner above the canvas. */
export function secondaryViewNotice(
  ctx: ViewContext,
  isAr: boolean,
): { title: string; body: string } | null {
  if (isPrimaryView(ctx)) return null;
  const primary = ctx.primaryLocale === "ar" ? (isAr ? "العربية" : "Arabic") : isAr ? "الإنجليزية" : "English";
  const here =
    ctx.breakpoint === "phone"
      ? isAr ? "الهاتف" : "Phone"
      : ctx.breakpoint === "tablet"
        ? isAr ? "اللوحي" : "Tablet"
        : ctx.locale === "ar" ? (isAr ? "العربية" : "Arabic") : isAr ? "الإنجليزية" : "English";
  return {
    title: isAr ? `عرض ${here}` : `${here} view`,
    body: isAr
      ? `البنية تُحرَّر في عرض سطح المكتب بـ${primary}. هنا يمكنك ضبط الأنماط، وإخفاء العناصر، وتحرير النص.`
      : `Structure is edited in Desktop · ${primary}. Here you can adjust styles, hide blocks, and edit text.`,
  };
}
