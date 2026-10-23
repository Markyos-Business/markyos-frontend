import { BrandTheme } from "@/components/features/guideline-site/model/theme";
import { bestInkOn } from "@/lib/contrast";
import { hexToRgb } from "@/lib/utils";
import { Workspace } from "@/types";

/**
 * The deck's palette, derived from the workspace's own colors.
 *
 * The source deck this layout follows is built on a two-accent system — a
 * primary hue carrying the titles and panels, and a second, warmer hue
 * carrying the numerals and the alternate panel. Both are the *brand's*
 * colors here, not the source's: `primary` is whatever swatch the workspace
 * marks primary, and `secondary` is the next genuinely different hue in its
 * palette. A brand with only one color gets a one-accent deck rather than an
 * invented second hue — the geometry is unchanged, it simply reads monochrome.
 *
 * Ground and ink follow the workspace too. The source is a white deck; a
 * brand whose palette says its canvas is dark gets the same layout on its own
 * dark ground, because the whole point of the guideline site is that it looks
 * like the brand it documents.
 */
export interface DeckPalette {
  /** The brand's primary — titles, panels, the app-tile fills. */
  primary: string;
  /** The brand's second hue — numerals, the warm panel. Equals `primary` when the palette has only one. */
  secondary: string;
  /** True when the brand actually supplied a second hue. */
  hasSecondary: boolean;
  /** Page ground and the ink that reads on it. */
  paper: string;
  ink: string;
  /** Primary at 5% over paper — the default panel fill. */
  panel: string;
  /** Secondary at 5% over paper — its warm twin. */
  panelWarm: string;
  /** Primary at 40% over paper — the logo-usage grid's rule colour. */
  primary40: string;
  /** Ink at 5% over paper — chips. */
  chip: string;
  /** Ink at 20% / 10% over paper — rules and hairlines. */
  rule: string;
  hairline: string;
  /** Secondary at 40% — the oversized chapter numeral. */
  accentNumber: string;
  /** Ink at 70% / 60% — body and muted copy. */
  textBody: string;
  textMuted: string;
  /** Ink or paper at 10% — the ghosted watermark mark. */
  watermark: string;
  /** True when `paper` is dark, so artwork drawn on it is drawn on a dark ground. */
  paperIsDark: boolean;
  /** Legible text on a primary / secondary fill. */
  onPrimary: string;
  onSecondary: string;
  isLight: boolean;
}

function rgbOf(hex: string): [number, number, number] {
  const rgb = hexToRgb(hex);
  return rgb ? [rgb.r, rgb.g, rgb.b] : [0, 0, 0];
}

function toHex([r, g, b]: [number, number, number]): string {
  return `#${[r, g, b].map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0")).join("")}`;
}

/**
 * `a` at `t` opacity over `b`, flattened to an opaque hex.
 *
 * The source builds every tint this way — "the base hue at that opacity over
 * white" — and flattening it rather than emitting rgba() matters because
 * these fills stack (a chip sits on a panel sits on the page) and stacked
 * alphas would compound into something darker than the spec.
 */
function over(a: string, t: number, b: string): string {
  const [r1, g1, b1] = rgbOf(a);
  const [r2, g2, b2] = rgbOf(b);
  return toHex([r1 * t + r2 * (1 - t), g1 * t + g2 * (1 - t), b1 * t + b2 * (1 - t)]);
}

/** Hue in degrees, and saturation 0–1, for deciding whether two swatches read as different colours. */
function hueSat(hex: string): { hue: number; sat: number } {
  const [r, g, b] = rgbOf(hex).map((v) => v / 255) as [number, number, number];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  if (delta === 0) return { hue: 0, sat: 0 };
  let hue: number;
  if (max === r) hue = ((g - b) / delta) % 6;
  else if (max === g) hue = (b - r) / delta + 2;
  else hue = (r - g) / delta + 4;
  hue = (hue * 60 + 360) % 360;
  return { hue, sat: max === 0 ? 0 : delta / max };
}

function hueDistance(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

export function deckPalette(ws: Workspace, theme: BrandTheme): DeckPalette {
  const primary = theme.accent;
  const primaryHue = hueSat(primary);

  // The second accent has to be a colour a reader would call different — not
  // another tint of the primary, and not a near-grey from the neutral ramp,
  // either of which would make the deck's two-tone structure invisible.
  const candidate = ws.colors.find((c) => {
    if (c.hex.toLowerCase() === primary.toLowerCase()) return false;
    const { hue, sat } = hueSat(c.hex);
    if (sat < 0.25) return false;
    return hueDistance(hue, primaryHue.hue) > 40;
  });
  const secondary = candidate?.hex ?? primary;

  const isLight = theme.isLight;
  const paper = theme.canvas;
  const ink = theme.text;

  return {
    primary,
    secondary,
    hasSecondary: !!candidate,
    paper,
    ink,
    panel: over(primary, 0.05, paper),
    panelWarm: over(secondary, 0.05, paper),
    primary40: over(primary, 0.4, paper),
    chip: over(ink, 0.05, paper),
    rule: over(ink, 0.2, paper),
    hairline: over(ink, 0.1, paper),
    accentNumber: over(secondary, 0.4, paper),
    textBody: over(ink, 0.7, paper),
    textMuted: over(ink, 0.6, paper),
    watermark: over(ink, 0.1, paper),
    // Solved by contrast ratio rather than by a lightness threshold: a
    // mid-tone brand colour sits either side of "is it light?" while one of
    // black or white is still measurably more readable on it.
    onPrimary: theme.accentInk,
    onSecondary: bestInkOn(secondary)?.ink ?? "#ffffff",
    /*
     * There used to be a `markFilter` here — `invert(1)` on every dark deck —
     * carrying the note "logo artwork in this app is drawn as black shapes on
     * transparency". That was true of the seed marks and false of every real
     * upload: inverting a brand's blue turns it orange, which is precisely the
     * bug lib/markTone.ts was written to end. The deck was the one surface
     * still doing it. It now draws marks through BrandMark like everything
     * else, which measures the artwork instead of assuming it, and this flag
     * only says which ground the mark is landing on.
     */
    paperIsDark: !isLight,
    isLight,
  };
}
