import { GuidelineTemplate, StudioStyle, Workspace } from "@/core/data/types";
import { bestInkOn } from "@/shared/lib/contrast";

/**
 * The hues the status colours are recognised by, before any ground is known.
 *
 * Kept as plain saturated seeds rather than the app's own tokens: those are
 * already solved against the app's surfaces, and re-solving an
 * already-darkened green against a dark brand page only darkens it further.
 * `accentOn` moves lightness and leaves hue alone, so starting from the pure
 * hue is what keeps green reading as green.
 */
const STATUS = {
  success: "#22c55e",
  warning: "#f59e0b",
  danger: "#ef4444",
} as const;
import { DesignSystem, designSystemFor, designSystemOf } from "./designSystem";
import {
  accentOn,
  hexToHsl,
  hexToRgb,
  isLightHex,
  readableInk,
  rgbToHex,
  stepFrom,
  tintedNeutral,
  withAlpha,
  type RGB,
} from "./palette";

export { isLightHex };

export interface BrandTheme {
  accent: string;
  accentSoft: string;
  /** The accent, re-solved to read as text on `accentSoft`. */
  accentOnSoft: string;
  /** Black or white — whichever is legible on the accent itself. */
  accentInk: string;
  canvas: string;
  surface1: string;
  surface2: string;
  text: string;
  textMuted: string;
  textFaint: string;
  hairline: string;
  /** A ground of the opposite polarity, in the same brand hue, and its ink. */
  invertBg: string;
  invertInk: string;
  /** The accent, solved for legibility on `invertBg` rather than on the page. */
  invertAccent: string;
  isLight: boolean;
  /** The template's design system — corner language, type scale, card treatment. */
  ds: DesignSystem;
}

/**
 * Derives the client-facing guideline site's palette from the workspace's own
 * Color section and the chosen template's design system.
 *
 * Two things this deliberately does NOT do any more. It does not paint
 * Markyos's greys: the neutrals are built from the brand's own hue, so a warm
 * brand gets warm surfaces and a cold one gets cold surfaces, and no client
 * site looks like the tool that produced it. And it does not hand every
 * template the same numbers: the ground polarity, how far the neutrals are
 * tinted and how far apart the surfaces sit all come from the template's
 * design system, so the six templates are six looks rather than six
 * navigations over one look.
 *
 * Contrast is held by construction rather than by choosing nice-looking hexes:
 * body text is solved for 7:1 on whatever ground the brand ends up with,
 * secondary for 4.5:1 and captions for 3:1, so a studio cannot pick a palette
 * that renders its own guideline illegible.
 */
export function getBrandTheme(ws: Workspace): BrandTheme {
  return themeForSystem(ws, designSystemOf(ws));
}

/**
 * The palette this workspace would get under a template it has not chosen.
 *
 * The template picker needs this: now that the design system decides the
 * ground, the tint and the corner language, a picker that rendered every card
 * with the *current* template's theme would show six identical previews and
 * then hand over something different on click.
 */
export function getBrandThemeFor(
  ws: Workspace,
  template: GuidelineTemplate,
  studioStyle: StudioStyle = ws.studioStyle
): BrandTheme {
  return themeForSystem(ws, designSystemFor(template, studioStyle));
}

function themeForSystem(ws: Workspace, ds: DesignSystem): BrandTheme {
  const colors = ws.colors;

  const accentSwatch = colors.find((c) => c.isPrimary) || colors.find((c) => !c.locked) || colors[0];
  const rawAccent = accentSwatch?.hex || "#0099ff";
  const accentHsl = hexToHsl(rawAccent);
  const hue = accentHsl?.h ?? 210;
  // A greyscale brand still gets a hue to tint toward; with no chroma to
  // borrow, every neutral collapses to grey on its own, which is correct.
  const chroma = accentHsl?.s ?? 0;

  /**
   * Light or dark.
   *
   * On "auto" the **template's design system** decides, because choosing Docs
   * or Atlas is choosing a light system and choosing Signal is choosing a dark
   * one — that is most of what those names mean. A canvas swatch used to win
   * here, which meant a brand with a dark background colour got the identical
   * dark page under all six templates. The studio's explicit light/dark switch
   * still outranks everything.
   */
  const canvasSwatch = colors.find((c) => c.id === "canvas" || /canvas|background|^bg$/i.test(c.name));
  const mode = ws.siteMode ?? "auto";
  const isLight = mode === "auto" ? ds.polarity === "light" : mode === "light";

  // The brand's own ground colour is used verbatim when it agrees with the
  // polarity — it is a real decision someone made. Otherwise the ground is
  // built from the brand's hue at the lightness this design system wants.
  const swatchMatchesMode = canvasSwatch ? isLightHex(canvasSwatch.hex) === isLight : false;
  const canvas =
    (swatchMatchesMode ? canvasSwatch?.hex : undefined) ??
    tintedNeutral(hue, chroma, isLight ? 97 : 6, ds.tint);

  const surface1 = stepFrom(canvas, 1, ds.step);
  const surface2 = stepFrom(canvas, 2, ds.step);

  /*
   * Insets, not ratios: body text sits a few percent off the far end,
   * secondary a third of the way in, captions half. The ratios are floors
   * those roles are pushed back out to if a particular ground can't carry
   * them.
   *
   * The muted and caption floors were 4.5 and 3, which is the same mistake the
   * app's own ramp made one layer up: 4.5:1 is WCAG's bar for text around 16px,
   * and these two levels are what the templates set their 10–12px captions,
   * file sizes, rail numerals and "Access password" labels in. A 3:1 caption is
   * a caption nobody reads.
   *
   * Both now floor at 7:1. The insets still hold them apart on any palette with
   * room; where a brand's ground is too tight for that, they converge at the
   * floor — which trades a step of hierarchy for a caption that can be read,
   * and that is the right way round.
   */
  /*
   * Solved against `surface2`, not `canvas`.
   *
   * On a light system the surfaces step *darker* than the page; on a dark one
   * they step lighter. Either way they move toward the ink, so a ramp solved
   * against the canvas clears its floor on the page and quietly misses it on
   * every card — which is where captions actually live. The client password
   * gate was the proof: 6.5:1 on `--g-surface-1` from a ramp that passed 7:1 on
   * the canvas behind it.
   *
   * `surface2` is the worst of the three, so solving there makes the floor true
   * everywhere. This mirrors the app's own ramp, which is solved against
   * `--surface-3` for exactly this reason.
   */
  const text = readableInk(surface2, hue, chroma, ds.tint, 7, 4);
  const textMuted = readableInk(surface2, hue, chroma, ds.tint, 7, 34);
  const textFaint = readableInk(surface2, hue, chroma, ds.tint, 7, 50);

  /*
   * 4.5:1, not 3:1.
   *
   * 3:1 is the bar for a *graphic* — a rule, an icon, a filled chip — and the
   * accent is used as all of those. It is also used as text: section numerals,
   * "VIEW →", the labels on a colour card. Those were landing at 4.4–5.6:1 on
   * the brand's own page, which is under AA for text.
   *
   * Not pushed to the 7:1 the app's own chrome uses, and that is a deliberate
   * line. This is the studio's identity colour; moving it far enough to clear
   * AAA would visibly stop being their blue. AA is the floor the app will
   * enforce on a brand's behalf, and the in-app ContrastReport shows them the
   * rest so it stays their decision.
   */
  // Against `surface2`, not `canvas`, for the same reason the text ramp is:
  // the surfaces step toward the ink, so an accent that clears 4.5:1 on the
  // page lands at 4.36:1 on a card — which is where the "PRIMARY" label on a
  // colour swatch actually sits.
  const accent = accentOn(rawAccent, surface2, 4.5);
  const ink = bestInkOn(accent);

  /*
   * The ground a "PRIMARY"-style chip actually sits on: the accent tint,
   * flattened onto the card behind it. Solved as an opaque colour rather than
   * left as an alpha, because a contrast ratio against a translucent fill is
   * not a number — it depends on what shows through.
   */
  const softAlpha = isLight ? 0.12 : 0.18;
  const accentRgb = hexToRgb(accent);
  const surfaceRgb = hexToRgb(surface2);
  const softGround =
    accentRgb && surfaceRgb
      ? rgbToHex([0, 1, 2].map((i) => accentRgb[i] * softAlpha + surfaceRgb[i] * (1 - softAlpha)) as RGB)
      : surface2;
  const accentOnSoft = accentOn(rawAccent, softGround, 4.5);

  /**
   * A ground of the opposite polarity, in the same brand hue.
   *
   * Some systems are deliberately two-tone — a printed manual runs white pages
   * and inverts for its chapter openers. Deriving the inverse here means that
   * flip still belongs to the brand (a warm brand's dark is a warm dark) rather
   * than a template reaching for a hard-coded near-black.
   */
  const invertBg = tintedNeutral(hue, chroma, isLight ? 11 : 96, ds.tint);
  const invertInk = readableInk(invertBg, hue, chroma, ds.tint, 7, 4);
  // The accent solved against THAT ground, not the page's. A deep navy passes
  // on a white page and then vanishes when the same token paints a chapter
  // opener in the same deep tone — one accent cannot answer for two grounds.
  const invertAccent = accentOn(rawAccent, invertBg, 4.5);

  return {
    accent,
    accentSoft: withAlpha(accent, softAlpha),
    accentOnSoft,
    accentInk: ink?.ink ?? "#ffffff",
    canvas,
    surface1,
    surface2,
    text,
    textMuted,
    textFaint,
    // Derived from the text rather than pure black/white so rules and borders
    // carry the same hue as everything else on the page.
    hairline: withAlpha(text, isLight ? 0.14 : 0.12),
    invertBg,
    invertInk,
    invertAccent,
    isLight,
    ds,
  };
}

/**
 * CSS custom properties for the theme, scoped to whatever element they're set
 * on. Three groups:
 *
 * 1. `--g-*` colour tokens, used directly by the template shells and the
 *    shared section bodies.
 * 2. `--g-radius-*`, `--g-card-*`, `--g-hero-*`, `--g-label-*` and friends —
 *    the design system's non-colour decisions. These are what let one shared
 *    component (a colour grid, a persona card) render as a sharp shadowed
 *    panel under Signal and a soft filled card under Atlas without forking.
 * 3. The app's own base token names (`--surface-1`, `--accent`, `--text`),
 *    re-pointed within this subtree only, because several components are
 *    shared between the internal /w/ admin UI and the client-facing site and
 *    are written against the base names. The internal app never renders inside
 *    a themeCssVars-wrapped element, so its own theme is untouched.
 */
export function themeCssVars(t: BrandTheme): Record<string, string> {
  const ds = t.ds;
  // One shadow token rather than a ring plus a shadow: the three card
  // treatments are mutually exclusive, and `box-shadow: none, none` — what a
  // two-token version produces for a filled card — is invalid and drops the
  // whole declaration.
  const cardBg = ds.card === "outline" ? "transparent" : t.surface1;
  const cardShadow =
    ds.card === "outline"
      ? `inset 0 0 0 1px ${t.hairline}`
      : ds.card === "raised"
        ? t.isLight
          ? "0 10px 30px rgba(0,0,0,.10)"
          : "0 14px 34px rgba(0,0,0,.55)"
        : "none";

  /**
   * A plate is what brand artwork sits ON — a logo tile, an icon tile, a
   * swatch card, a type specimen. It is always a real filled surface with a
   * visible edge, even under a design system whose content cards are outlined.
   *
   * Outlining these was a mistake worth recording: a transparent logo tile on a
   * near-black page gives a reader no way to judge clearspace or to see the
   * mark's own edges, and a transparent swatch card makes a near-black swatch
   * literally invisible. The whole job of this section is to show artwork
   * against a neutral ground, so the ground is not negotiable.
   */
  const plateShadow = `inset 0 0 0 1px ${t.hairline}`;

  return {
    "--g-plate-bg": t.surface1,
    "--g-plate-shadow": plateShadow,

    "--g-accent": t.accent,
    "--g-accent-soft": t.accentSoft,
    "--g-accent-ink": t.accentInk,
    /*
     * The accent, as text on a tint of itself.
     *
     * A "PRIMARY" chip fills with `--g-accent-soft` and labels itself in the
     * accent. The tint lifts the ground toward the ink, so an accent that
     * clears 4.5:1 on a card lands at 4.36:1 on its own tint — which is the
     * whole reason the app's chrome has `--accent-on-soft`. This is that,
     * for the brand.
     */
    "--g-accent-on-soft": t.accentOnSoft,
    "--g-canvas": t.canvas,
    "--g-surface-1": t.surface1,
    "--g-surface-2": t.surface2,
    "--g-text": t.text,
    "--g-text-muted": t.textMuted,
    "--g-text-faint": t.textFaint,
    "--g-hairline": t.hairline,
    "--g-invert-bg": t.invertBg,
    "--g-invert-ink": t.invertInk,
    "--g-invert-accent": t.invertAccent,
    "--g-invert-hairline": withAlpha(t.invertInk, 0.22),

    "--g-radius-sm": `${ds.radius.sm}px`,
    "--g-radius-md": `${ds.radius.md}px`,
    "--g-radius-lg": `${ds.radius.lg}px`,
    "--g-radius-pill": `${ds.radius.pill}px`,
    "--g-card-bg": cardBg,
    "--g-card-shadow": cardShadow,
    "--g-rhythm": `${ds.rhythm}px`,

    "--g-hero-size": `${ds.display.hero}px`,
    "--g-hero-tracking": ds.display.tracking,
    "--g-hero-weight": String(ds.display.weight),
    "--g-section-size": `${ds.display.section}px`,
    "--g-body-size": `${ds.body.size}px`,
    "--g-lead": String(ds.body.lead),
    "--g-label-size": `${ds.label.size}px`,
    "--g-label-tracking": ds.label.tracking,
    "--g-label-transform": ds.label.transform,
    "--g-label-weight": String(ds.label.weight),

    /*
     * Status colours, re-solved against the brand's own ground.
     *
     * These were the one family left inheriting the *app's* theme inside a
     * brand page, and it showed: the "Do" and "Don't" labels on a misuse panel
     * are `--success` and `--danger`, and a studio running a dark guideline
     * while the app itself is on the light theme got the light theme's near-
     * black green on a near-black page — 1.8:1, a label that isn't there.
     *
     * The polarity of the page is a property of the brand, not of which theme
     * the studio happens to have the editor in, so the colours follow the page.
     * Hue is preserved: green stays green on a "Do" panel, which is most of
     * what those two labels are saying.
     */
    "--success": accentOn(STATUS.success, t.surface2, 4.5),
    "--warning": accentOn(STATUS.warning, t.surface2, 4.5),
    "--danger": accentOn(STATUS.danger, t.surface2, 4.5),
    "--danger-ink": bestInkOn(accentOn(STATUS.danger, t.surface2, 4.5))?.ink ?? "#ffffff",

    "--canvas": t.canvas,
    "--surface-0": t.surface1,
    "--surface-1": t.surface1,
    "--surface-2": t.surface2,
    "--surface-3": t.surface2,
    "--accent": t.accent,
    // Shared chrome inks small labels with `--accent-text` rather than
    // `--accent`, so it has to follow the brand here too — otherwise a studio's
    // guideline would show Markyos's blue on its own captions.
    "--accent-text": t.accent,
    "--accent-on-soft": t.accent,
    "--accent-soft": t.accentSoft,
    // Components shared with the admin UI (BlockRenderer, the sign-off panel)
    // fill with `--accent` and ink with `--accent-ink`. Without re-pointing
    // this too, a brand's accent button would be inked for *Markyos's* accent
    // — which is a different colour and often the wrong polarity.
    "--accent-ink": t.accentInk,
    "--status-ink": t.accentInk,
    "--text": t.text,
    "--text-secondary": t.textMuted,
    "--text-muted": t.textMuted,
    "--text-faint": t.textFaint,
    "--hairline": t.hairline,
    "--hairline-strong": t.hairline,
  };
}
