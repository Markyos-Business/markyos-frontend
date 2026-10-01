import { BREAKPOINT_MAX } from "../core/types";
import type { BlockNode, Breakpoint } from "../core/types";

/**
 * Turning resolved block properties into CSS.
 *
 * Published pages get static CSS and no layout JavaScript. That is not a
 * performance preference — it is what makes a guideline page work in an email
 * preview, a PDF print, an archived copy, and a client's locked-down browser.
 * Anything that needs JavaScript to be laid out correctly is a page that will
 * one day be read wrongly and nobody will know.
 *
 * Two rules the output must obey, both checked by tests:
 *
 *   1. **Logical properties only.** `margin-inline-start`, never `margin-left`.
 *      An Arabic page is the same document with the axis flipped, and a single
 *      hard-coded `left` is a mirrored layout with one thing stuck on the
 *      wrong side.
 *
 *   2. **Byte-identical for equivalent input.** Keys are sorted, nothing is
 *      timestamped, and no rule is emitted for an empty declaration set. This
 *      is what lets a snapshot diff mean something.
 */

export type Declarations = Record<string, string | number>;

/** The sizing model, in the three words Framer made standard. */
export type Sizing = { mode: "fit" | "fill" | "fixed"; value?: number };

const PX_PROPS = new Set([
  "block-size",
  "border-radius",
  "column-gap",
  "gap",
  "inline-size",
  "margin-block-end",
  "margin-block-start",
  "margin-inline-end",
  "margin-inline-start",
  "max-inline-size",
  // The shorthands too. A bare number is never valid CSS for either of them,
  // so a missing unit here is a declaration the browser drops silently — the
  // override appears to do nothing and there is no error anywhere.
  "margin",
  "padding",
  "min-block-size",
  "min-inline-size",
  "padding-block-end",
  "padding-block-start",
  "padding-inline-end",
  "padding-inline-start",
  "row-gap",
]);

/**
 * Physical properties, refused at the point of emission.
 *
 * A lint rule over source files catches the ones somebody typed. This catches
 * the ones a value computed into — which is the harder half, because the source
 * looks clean.
 */
const PHYSICAL = /^(left|right|margin-(left|right)|padding-(left|right)|border-(left|right))$|^(top|bottom)$/;

export function declare(props: Declarations): string {
  return Object.keys(props)
    .sort()
    .map((key) => {
      const value = props[key];
      if (PHYSICAL.test(key)) {
        throw new Error(
          `"${key}" is a physical property. Published pages are bilingual: use the ` +
            `logical equivalent (inset-inline-start, margin-inline-end, text-align: start).`,
        );
      }
      // `text-align` itself is fine — it is the only alignment property with a
      // direction-relative form built in. `start` and `end` are the logical
      // values; `left` and `right` are the ones that mirror wrongly.
      if (key === "text-align" && /^(left|right)$/.test(String(value))) {
        throw new Error(
          `"text-align: ${value}" is physical. Use start or end, which follow the ` +
            `reading direction instead of fighting it.`,
        );
      }
      const out = typeof value === "number" && PX_PROPS.has(key) ? `${value}px` : String(value);
      return `${key}:${out}`;
    })
    .join(";");
}

/** A CSS class name derived from a node id. Stable, and safe as a selector. */
export function classFor(id: string): string {
  return `b-${id.replace(/[^A-Za-z0-9_-]/g, "-")}`;
}

/**
 * Maps the universal sizing props onto CSS, with the parent's layout in mind.
 *
 * "Fill" genuinely means three different declarations depending on where the
 * block sits — a flex child grows, a grid child spans, a block child takes the
 * full width — which is exactly the sort of thing a person should not have to
 * think about when they pick "fill" from a dropdown.
 */
export function sizingCss(
  sizing: Sizing | undefined,
  axis: "inline" | "block",
  parentLayout: "stack-row" | "stack-column" | "grid" | "flow",
): Declarations {
  if (!sizing) return {};
  const size = axis === "inline" ? "inline-size" : "block-size";

  if (sizing.mode === "fixed") {
    if (typeof sizing.value !== "number") return {};
    return axis === "inline"
      ? { [size]: sizing.value, "max-inline-size": "100%" }
      : { [size]: sizing.value };
  }

  if (sizing.mode === "fit") return { [size]: "fit-content" };

  // fill
  const alongFlex =
    (parentLayout === "stack-row" && axis === "inline") ||
    (parentLayout === "stack-column" && axis === "block");
  if (alongFlex) return { flex: "1 1 0", "min-inline-size": 0 };
  if (parentLayout === "grid" && axis === "inline") return { "grid-column": "1 / -1" };
  return { [size]: "100%" };
}

/**
 * The query container every breakpoint rule resolves against.
 *
 * Named rather than anonymous so a nested container — a column layout that wants
 * its own query one day — cannot accidentally capture a page-level breakpoint.
 * Declared once in `app/globals.css`, on `[data-guideline-surface]`, which is the
 * root every one of the templates renders and therefore the one element present
 * both in the editor's frame and on the published page.
 */
export const CONTAINER = "g-page";

export type NodeCss = {
  /** Declarations that hold at every width, in LTR. */
  base: Declarations;
  tablet?: Declarations;
  phone?: Declarations;
  rtl?: Declarations;
};

/**
 * One node's rules.
 *
 * Narrower breakpoints emit *only what differs*, which is what makes the
 * desktop-first cascade real in the output rather than just in the editor: a
 * property nobody overrode is written once, so changing it on desktop changes
 * it everywhere, exactly as the inspector promised.
 */
export function emitNode(id: string, css: NodeCss): string {
  const cls = `.${classFor(id)}`;
  const out: string[] = [];

  const base = declare(css.base);
  if (base) out.push(`${cls}{${base}}`);

  /*
   * `@container`, not `@media`. This is a correctness fix, not a preference.
   *
   * A media query resolves against the *viewport*. The editor frames the page in
   * a 390px-wide element and scales it down to fit, inside a window that is
   * usually 1400px or more — so `@media (max-width:809px)` was simply false
   * there, and a phone override did nothing at all on the canvas. Measured: a
   * section with a phone-scoped `display:none` rendered 790px tall in the phone
   * frame, with `matchMedia("(max-width:809px)").matches === false`. The rule
   * was emitted, the inspector showed its override dot and its reset, the sweep
   * went green, and the studio saw no change — the worst shape a feature can
   * have.
   *
   * A container query resolves against the named ancestor, which is the page
   * itself (`[data-guideline-surface]`, see `app/globals.css`). In the editor
   * that ancestor is the frame, so it is 390px and the rule fires. On the
   * published site it is the page, so it tracks the real viewport. One rule, both
   * places, and the preview stops lying.
   */
  const tablet = css.tablet ? declare(css.tablet) : "";
  if (tablet) out.push(`@container ${CONTAINER} (max-width:${BREAKPOINT_MAX.tablet}px){${cls}{${tablet}}}`);

  const phone = css.phone ? declare(css.phone) : "";
  if (phone) out.push(`@container ${CONTAINER} (max-width:${BREAKPOINT_MAX.phone}px){${cls}{${phone}}}`);

  const rtl = css.rtl ? declare(css.rtl) : "";
  // `[dir="rtl"] .b-x` rather than a second stylesheet: one document, one
  // stylesheet, and a page that switches language without reloading its CSS.
  if (rtl) out.push(`[dir="rtl"] ${cls}{${rtl}}`);

  return out.join("\n");
}

/** Every node's rules, in a stable order so two runs produce one file. */
export function emitSheet(entries: Array<{ id: string; css: NodeCss }>): string {
  return entries
    .slice()
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    .map((e) => emitNode(e.id, e.css))
    .filter(Boolean)
    .join("\n");
}

/**
 * Splits a node's props into the four rule sets, given a function that turns
 * resolved props into declarations for its block type.
 *
 * The narrower sets are computed by difference rather than by reading the
 * override objects directly. A phone override on `gap` may well change three
 * declarations, and only the emitter's own mapping knows which.
 */
export function splitByScope(
  node: Pick<BlockNode, "props" | "overrides">,
  toCss: (props: Record<string, unknown>, bp: Breakpoint, dir: "ltr" | "rtl") => Declarations,
  resolve: (
    node: Pick<BlockNode, "props" | "overrides">,
    ctx: { breakpoint: Breakpoint; dir: "ltr" | "rtl" },
  ) => Record<string, unknown>,
): NodeCss {
  const base = toCss(resolve(node, { breakpoint: "desktop", dir: "ltr" }), "desktop", "ltr");
  const tablet = toCss(resolve(node, { breakpoint: "tablet", dir: "ltr" }), "tablet", "ltr");
  const phone = toCss(resolve(node, { breakpoint: "phone", dir: "ltr" }), "phone", "ltr");
  const rtl = toCss(resolve(node, { breakpoint: "desktop", dir: "rtl" }), "desktop", "rtl");

  return {
    base,
    tablet: diff(base, tablet),
    // Against tablet, not base: the cascade already delivered the tablet rule
    // at phone width, so repeating it would be dead weight in the file and a
    // second place the same value has to be kept right.
    phone: diff(tablet, phone),
    rtl: diff(base, rtl),
  };
}

function diff(from: Declarations, to: Declarations): Declarations | undefined {
  const out: Declarations = {};
  for (const key of Object.keys(to)) if (from[key] !== to[key]) out[key] = to[key];
  // A declaration present in `from` and absent in `to` has to be undone
  // explicitly, or the cascade keeps applying it at the narrower width.
  for (const key of Object.keys(from)) if (!(key in to)) out[key] = "revert";
  return Object.keys(out).length ? out : undefined;
}
