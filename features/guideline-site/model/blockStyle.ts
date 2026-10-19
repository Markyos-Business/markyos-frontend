import type { CSSProperties } from "react";
import { BlockStyle, ResponsiveStyle } from "@/core/data/types";
import { bestInkOn, contrastRatio } from "@/shared/lib/contrast";
import type { Breakpoint, Dir } from "@/shared/lib/doc/core/types";
import { classFor, emitNode } from "@/shared/lib/doc/css/emit";
import type { Declarations } from "@/shared/lib/doc/css/emit";

/**
 * Turns a studio's design overrides into real CSS.
 *
 * Everything here is expressed in logical, direction-relative terms — `start`
 * rather than `left`, `margin-inline` rather than `margin-left` — because the
 * same guideline renders right-to-left in Arabic. A block aligned to the start
 * sits on the left in English and the right in Arabic, which is what "align to
 * the start of the line" means in both, and is why the stored value is an
 * alignment rather than a position.
 */

const PADDING: Record<NonNullable<BlockStyle["padding"]>, number> = {
  none: 0,
  sm: 16,
  md: 28,
  lg: 44,
};

const RADIUS: Record<NonNullable<BlockStyle["radius"]>, number> = {
  none: 0,
  md: 14,
  lg: 24,
};

const WIDTH: Record<NonNullable<BlockStyle["width"]>, string> = {
  narrow: "62ch",
  wide: "900px",
  full: "100%",
};

export const SCALE_MIN = 0.75;
export const SCALE_MAX = 1.75;

/**
 * True when nothing has been overridden, so the caller can skip the wrapper.
 *
 * `variant` does not count. It picks which component draws the section, not how
 * the result is styled, so a section that has only had its layout changed still
 * needs no wrapper — and wrapping it anyway would put a stray `<div>` between a
 * template's grid and its children the moment somebody chose a layout.
 */
export function isEmptyStyle(style: BlockStyle | undefined): boolean {
  if (!style) return true;
  return Object.entries(style).every(
    ([key, v]) =>
      key === "variant" || v === undefined || (typeof v === "object" && v !== null && Object.keys(v).length === 0),
  );
}

/** The keys a narrower width or the other direction is allowed to change. */
export const RESPONSIVE_KEYS: Array<keyof ResponsiveStyle> = [
  "align",
  "scale",
  "padding",
  "width",
  "hidden",
];

/**
 * The style that actually applies in a given view.
 *
 * Desktop-first and narrowest-last: base, then tablet, then phone, then the
 * RTL layer. A phone reading also picks up the tablet override, because the
 * cascade is cumulative — someone who set the padding down at tablet meant it
 * to stay down, and making them set it twice is how the two drift apart.
 *
 * This is the same shape as the document core's `resolveProps`, deliberately:
 * the block document model and the section style model are the same cascade
 * over different data, and when the builder moves onto `BlockNode` the
 * behaviour people already learned comes with it.
 */
export function resolveStyle(
  style: BlockStyle | undefined,
  view: { breakpoint: Breakpoint; dir: Dir },
): BlockStyle | undefined {
  if (!style) return undefined;
  if (!style.bp && !style.rtl) return style;

  const out: BlockStyle = { ...style };
  if (view.breakpoint === "tablet" || view.breakpoint === "phone") Object.assign(out, style.bp?.tablet ?? {});
  if (view.breakpoint === "phone") Object.assign(out, style.bp?.phone ?? {});
  if (view.dir === "rtl") Object.assign(out, style.rtl ?? {});

  // The override containers are not style. Leaving them in means every
  // consumer that counts keys — `isEmptyStyle`, the reset button, a diff —
  // sees a section as styled when all it carries is an empty container.
  delete out.bp;
  delete out.rtl;
  return out;
}

/** Which scopes carry their own value for `key` — the inspector's override dot. */
export function overriddenIn(
  style: BlockStyle | undefined,
  key: keyof ResponsiveStyle,
): Array<"tablet" | "phone" | "rtl"> {
  const out: Array<"tablet" | "phone" | "rtl"> = [];
  if (style?.bp?.tablet && key in style.bp.tablet) out.push("tablet");
  if (style?.bp?.phone && key in style.bp.phone) out.push("phone");
  if (style?.rtl && key in style.rtl) out.push("rtl");
  return out;
}

/**
 * Writes a patch into the scope a view owns.
 *
 * The editor never asks "do you want an override?" — editing a field in a
 * narrow view simply lands there, which is the behaviour Figma Sites settled
 * on and the only one that does not require people to hold a mental model of
 * the storage format while they are trying to design something.
 *
 * `undefined` removes the override rather than storing an undefined value, so
 * "reset to desktop" and "never set" end up as the same state.
 */
export function patchScope(
  style: BlockStyle | undefined,
  scope: "tablet" | "phone" | "rtl",
  patch: Partial<ResponsiveStyle>,
): BlockStyle {
  const base: BlockStyle = { ...(style ?? {}) };
  const current: ResponsiveStyle = { ...(scope === "rtl" ? base.rtl : base.bp?.[scope]) ?? {} };

  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) delete current[key as keyof ResponsiveStyle];
    else (current as Record<string, unknown>)[key] = value;
  }

  const empty = Object.keys(current).length === 0;
  if (scope === "rtl") {
    if (empty) delete base.rtl;
    else base.rtl = current;
  } else {
    const bp = { ...(base.bp ?? {}) };
    if (empty) delete bp[scope];
    else bp[scope] = current;
    if (Object.keys(bp).length === 0) delete base.bp;
    else base.bp = bp;
  }
  return base;
}

function parse(hex: string): [number, number, number] | null {
  const clean = hex.trim().replace(/^#/, "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  if (!/^[0-9a-f]{6}$/i.test(full)) return null;
  return [parseInt(full.slice(0, 2), 16), parseInt(full.slice(2, 4), 16), parseInt(full.slice(4, 6), 16)];
}

/** `ink` at `t` over `ground`, flattened — the quieter steps of a text ramp. */
function fade(ink: string, ground: string, t: number): string | null {
  const a = parse(ink);
  const b = parse(ground);
  if (!a || !b) return null;
  const mix = [0, 1, 2].map((i) => Math.round(a[i] * t + b[i] * (1 - t)));
  return `#${mix.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

/**
 * The text colours a section needs once it has been given its own background.
 *
 * Setting a background used to change only the background. Everything inside
 * kept the page's inks, so putting a section on the brand's deep navy in a
 * light template left navy text on navy — the control was a way to make a
 * section unreadable in one click, and the studio's only recourse was to hunt
 * for the separate "Text color" field and guess.
 *
 * So the ink follows the ground. The whole `--g-*` text ramp is re-pointed for
 * the subtree, which is enough because every template and every shared body
 * component reads its colours from those variables rather than from literals.
 *
 * How far the quieter levels fade depends on how much headroom there is: on a
 * ground where the best available ink only just clears the floor, fading it
 * would push the muted level under. Measured, not assumed.
 */
function inkVarsFor(
  background: string,
  explicitInk: string | undefined,
  accent: string | undefined
): Record<string, string> {
  const ink = explicitInk ?? bestInkOn(background)?.ink;
  if (!ink) return {};

  /*
   * The surfaces first, because the inks are solved against them.
   *
   * A card inside the section is the ground the quietest text actually lands
   * on — a section note sitting on a panel, a nav numeral on a chip. Solving
   * the ramp against the section's own background instead put those at 2.7:1
   * while the same colour measured fine on the section itself. So the ramp is
   * solved against `surface3`, the most-lifted surface in the section, the
   * same way the app's own token ramp is solved against its worst ground.
   */
  const surface1 = fade(ink, background, 0.07) ?? background;
  const surface2 = fade(ink, background, 0.13) ?? background;
  const surface3 = fade(ink, background, 0.19) ?? background;

  /**
   * The quietest mix of `ink` into `background` that still clears `floor`
   * against the worst ground in the section.
   *
   * Searched rather than tabulated: how far an ink can fade before it stops
   * being readable depends entirely on the colour underneath, and a fixed
   * "muted is 72%" is a guess that happens to be right on the two grounds it
   * was written against.
   */
  const quietest = (floor: number): string => {
    for (let t = 0.4; t <= 1.0001; t += 0.02) {
      const candidate = fade(ink, background, Math.min(t, 1));
      if (!candidate) return ink;
      if ((contrastRatio(candidate, surface3) ?? 0) >= floor) return candidate;
    }
    return ink;
  };

  const muted = quietest(7);
  const faint = quietest(4.5);
  const hairline = fade(ink, background, 0.18) ?? ink;
  const hairlineStrong = fade(ink, background, 0.3) ?? hairline;

  /*
   * The accent has to move too — as a tint of itself, never as another colour.
   *
   * Templates set their section numerals, their "view →" links and their chip
   * fills in the brand's accent, and that accent was solved against the page's
   * canvas. Dropped onto a section ground the studio chose, it was landing at
   * 2.7:1. So it is lightened or darkened toward the section's own ink until
   * it clears the floor — the "use the lighter tint of the brand blue on the
   * dark panel" move a printed guideline would spell out — which keeps the
   * hue, and therefore keeps it the brand's colour, while making it readable.
   * Its ink follows, so a chip filled with the adjusted accent stays legible.
   */
  /** A colour lightened or darkened toward `ink` until it clears 4.5:1. */
  const readable = (colour: string): string => {
    if ((contrastRatio(colour, surface3) ?? 0) >= 4.5) return colour;
    let out = colour;
    for (let t = 0.05; t <= 1.0001; t += 0.05) {
      const candidate = fade(ink, colour, Math.min(t, 1));
      if (!candidate) break;
      out = candidate;
      if ((contrastRatio(candidate, surface3) ?? 0) >= 4.5) break;
    }
    return out;
  };

  /*
   * Do / Don't, Verified / Failed — Markyos's own semantic colours, not the
   * brand's, and so not something a template can be asked to supply. They have
   * a light-ground value and a dark-ground one, and the section's ink already
   * says which kind of ground this is; from there they are tuned like the
   * accent. Hue is preserved throughout, because on a "Do this / not this"
   * panel the colour *is* the message.
   */
  const onDarkGround = ink.toLowerCase() === "#ffffff";
  const statusVars: Record<string, string> = {};
  for (const [name, dark, light] of [
    ["success", "#7ce7ac", "#0e7545"],
    ["warning", "#f4be5e", "#905b00"],
    ["danger", "#ff808b", "#c02d3a"],
  ] as const) {
    const tuned = readable(onDarkGround ? dark : light);
    statusVars[`--${name}`] = tuned;
    // A badge filled with the tuned colour needs ink solved against *that*, not
    // against the app theme's untuned one — which is how a white ✕ ended up on
    // a pale pink dot at 2:1.
    if (name === "danger") {
      const dangerInk = bestInkOn(tuned)?.ink;
      if (dangerInk) statusVars["--danger-ink"] = dangerInk;
    }
  }
  // Anything filled with a status colour inks from --status-ink; solve it
  // against the strongest of the three so one token serves all of them.
  const statusInk = bestInkOn(statusVars["--danger"])?.ink;
  if (statusInk) statusVars["--status-ink"] = statusInk;

  const accentVars: Record<string, string> = {};
  if (accent) {
    const tuned = readable(accent);
    accentVars["--g-accent"] = tuned;
    accentVars["--accent"] = tuned;
    // Small accent-coloured labels in shared chrome use `--accent-text`; it
    // follows the section's tuned accent for the same reason `--accent` does.
    accentVars["--accent-text"] = tuned;
    accentVars["--accent-on-soft"] = tuned;
    const accentInk = bestInkOn(tuned)?.ink;
    if (accentInk) {
      accentVars["--g-accent-ink"] = accentInk;
      accentVars["--accent-ink"] = accentInk;
      accentVars["--status-ink"] = accentInk;
    }
    const soft = fade(tuned, background, 0.16);
    if (soft) {
      accentVars["--g-accent-soft"] = soft;
      accentVars["--accent-soft"] = soft;
    }
  }

  /*
   * The surfaces move with the ground, not just the ink.
   *
   * A quote block, a swatch card, a logo plate — each sits on its own filled
   * surface, and those were solved against the template's canvas. Re-pointing
   * only the text put white copy on a surface still tinted for a white page:
   * 1.18:1, worse than leaving the whole thing alone. A section given its own
   * background is a small theme of its own, so the surfaces are re-derived
   * from it — the ink lifted into the ground just enough to separate a card
   * from the section behind it, which is the same surface-step rule the rest
   * of the system uses.
   */
  return {
    ...statusVars,
    ...accentVars,
    color: ink,
    "--g-canvas": background,
    "--g-surface-1": surface1,
    "--g-surface-2": surface2,
    "--g-card-bg": surface1,
    "--g-plate-bg": surface1,
    "--g-plate-shadow": `inset 0 0 0 1px ${hairline}`,
    "--g-card-shadow": "none",
    "--g-text": ink,
    "--g-text-muted": muted,
    "--g-text-faint": faint,
    "--g-hairline": hairline,
    "--g-hairline-strong": hairlineStrong,
    // The shared admin-side components (BlockRenderer, the sign-off panel)
    // read the plain tokens, so they have to move with the branded ones or a
    // section on a dark ground keeps light-theme body copy inside it.
    "--canvas": background,
    "--surface-0": surface1,
    "--surface-1": surface1,
    "--surface-2": surface2,
    "--surface-3": surface3,
    "--text": ink,
    "--text-secondary": muted,
    "--text-muted": muted,
    "--text-faint": faint,
    "--hairline": hairline,
    "--hairline-strong": hairlineStrong,
  };
}

/**
 * Whether a chosen section background can carry legible text at all.
 *
 * Reported to the studio rather than silently worked around: a mid-tone brand
 * colour where neither black nor white reaches 4.5:1 is a colour that cannot
 * hold body copy, and that is a fact about the palette, not something this
 * code should paper over.
 */
export function backgroundInkWarning(background: string | undefined): { ratio: number; ink: string } | null {
  if (!background) return null;
  const best = bestInkOn(background);
  if (!best || best.result.aa) return null;
  return { ratio: best.result.ratio, ink: best.ink };
}

/**
 * The inline style for an element's wrapper.
 *
 * Only the keys the studio actually set are emitted. An unset key must stay
 * absent rather than become a default, or every styled element would start
 * overriding the template with values nobody chose — which is how a block that
 * was nudged once stops following a template switch.
 */
export function blockStyleCss(style: BlockStyle | undefined, accent?: string): CSSProperties {
  if (isEmptyStyle(style)) return {};
  const s = style!;
  const css: CSSProperties = {};

  if (s.background) {
    css.background = s.background;
    Object.assign(css, inkVarsFor(s.background, s.textColor, accent));
  }
  if (s.textColor) css.color = s.textColor;
  if (s.padding) css.padding = PADDING[s.padding];
  if (s.radius) css.borderRadius = RADIUS[s.radius];
  if (s.align) css.textAlign = s.align;

  if (s.width) {
    css.maxWidth = WIDTH[s.width];
    // A width only reads as an alignment choice once the box can sit
    // somewhere other than the start of the line.
    if (s.align === "center") css.marginInline = "auto";
    else if (s.align === "end") css.marginInlineStart = "auto";
  }

  if (s.scale && s.scale !== 1) {
    // `zoom` rather than `transform: scale()`: zoom is a layout property, so a
    // scaled-up section pushes the next one down instead of overlapping it.
    css.zoom = Math.min(Math.max(s.scale, SCALE_MIN), SCALE_MAX);
  }

  return css;
}

/**
 * The narrow-width and RTL overrides, as real CSS.
 *
 * Inline styles cannot express a conditional rule, so a responsive override has
 * to leave the style attribute and become one. This emits it — through the
 * document core's emitter, which enforces logical properties and deterministic
 * output, and which writes `@container g-page` rather than `@media` so the rule
 * resolves against the page instead of the window — for exactly the scopes that
 * differ from the base.
 *
 * Returns an empty string when there is nothing to say, so a page with no
 * responsive overrides ships no extra bytes and no empty `<style>` tag.
 */
export function blockStyleRules(id: string, style: BlockStyle | undefined): string {
  if (!style?.bp && !style?.rtl) return "";

  const at = (bp: Breakpoint, dir: Dir) => toDeclarations(resolveStyle(style, { breakpoint: bp, dir }));
  const base = at("desktop", "ltr");

  return emitNode(id, {
    // The base already ships inline on the element. Emitting it again here
    // would be a second copy to keep correct, and the two would disagree the
    // first time somebody edited one of them.
    base: {},
    tablet: diffFrom(base, at("tablet", "ltr")),
    phone: diffFrom(at("tablet", "ltr"), at("phone", "ltr")),
    rtl: diffFrom(base, at("desktop", "rtl")),
  });
}

/** The responsive-capable keys, as CSS. Everything else is base-only. */
function toDeclarations(style: BlockStyle | undefined): Declarations {
  const out: Declarations = {};
  if (!style) return out;
  if (style.align) out["text-align"] = style.align;
  if (style.padding) out.padding = PADDING[style.padding];
  if (style.width) {
    out["max-inline-size"] = WIDTH[style.width];
    if (style.align === "center") out["margin-inline"] = "auto";
    else if (style.align === "end") out["margin-inline-start"] = "auto";
  }
  if (style.scale && style.scale !== 1) {
    out.zoom = Math.min(Math.max(style.scale, SCALE_MIN), SCALE_MAX);
  }
  if (style.hidden) out.display = "none";
  return out;
}

function diffFrom(from: Declarations, to: Declarations): Declarations | undefined {
  const out: Declarations = {};
  for (const key of Object.keys(to)) if (from[key] !== to[key]) out[key] = to[key];
  // A declaration that exists at the wider width and not here has to be undone
  // explicitly, or the cascade keeps applying it and "remove this on phone"
  // quietly does nothing.
  for (const key of Object.keys(from)) if (!(key in to)) out[key] = "revert";
  return Object.keys(out).length ? out : undefined;
}

/** The class a block's responsive rules are written against. */
export { classFor as blockClass };

/**
 * Whether this element renders at all on the published site.
 *
 * Hidden elements still render on the editing canvas — dimmed — because a
 * studio needs to see what it has parked in order to bring it back. Nothing
 * that reads this on the client site ever sees one.
 */
export function isHiddenStyle(style: BlockStyle | undefined): boolean {
  return style?.hidden === true;
}
