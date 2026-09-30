/**
 * WCAG 2.1 contrast, applied to the guideline site's own palette.
 *
 * This is not a general accessibility audit — it answers one question a brand
 * guideline has to get right: is the brand's own colour system legible when
 * the guideline renders in it? A palette that looks fine on a designer's
 * calibrated screen in a dark room routinely fails on a laptop in an office,
 * and the person who finds out is the client's customer.
 *
 * WCAG 2.1 rather than APCA: 2.1 is the version written into procurement
 * requirements and accessibility law, so it is the number a studio can be
 * asked to evidence.
 */

export interface ContrastResult {
  ratio: number;
  /** Passes AA for normal body text (4.5:1). */
  aa: boolean;
  /** Passes AA for large text — 18.66px bold or 24px regular (3:1). */
  aaLarge: boolean;
  /** Passes AAA for normal body text (7:1). */
  aaa: boolean;
}

export type ContrastLevel = "fail" | "large-only" | "aa" | "aaa";

function parseHex(hex: string): [number, number, number] | null {
  const clean = hex.trim().replace(/^#/, "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  if (!/^[0-9a-f]{6}$/i.test(full)) return null;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

/**
 * Resolves the handful of non-hex colour forms the theme actually produces —
 * `rgb()`/`rgba()` strings from the alpha helpers — so a swatch built from one
 * isn't silently skipped. An `rgba` is flattened onto the ground it sits on,
 * because a translucent colour's real contrast depends on what's behind it.
 */
function parseColor(value: string, behind?: [number, number, number]): [number, number, number] | null {
  const hex = parseHex(value);
  if (hex) return hex;
  const rgb = /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?\s*\)/i.exec(value);
  if (!rgb) return null;
  const [r, g, b] = [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
  const alpha = rgb[4] === undefined ? 1 : Number(rgb[4]);
  if (alpha >= 1 || !behind) return [r, g, b];
  return [
    Math.round(r * alpha + behind[0] * (1 - alpha)),
    Math.round(g * alpha + behind[1] * (1 - alpha)),
    Math.round(b * alpha + behind[2] * (1 - alpha)),
  ];
}

function luminance([r, g, b]: [number, number, number]): number {
  const channel = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** The contrast ratio between two colours, 1 (identical) to 21 (black on white). */
export function contrastRatio(foreground: string, background: string): number | null {
  const bg = parseColor(background);
  if (!bg) return null;
  const fg = parseColor(foreground, bg);
  if (!fg) return null;
  const a = luminance(fg);
  const b = luminance(bg);
  const [light, dark] = a > b ? [a, b] : [b, a];
  return (light + 0.05) / (dark + 0.05);
}

export function checkContrast(foreground: string, background: string): ContrastResult | null {
  const ratio = contrastRatio(foreground, background);
  if (ratio === null) return null;
  return {
    ratio,
    aa: ratio >= 4.5,
    aaLarge: ratio >= 3,
    aaa: ratio >= 7,
  };
}

export function levelOf(result: ContrastResult): ContrastLevel {
  if (result.aaa) return "aaa";
  if (result.aa) return "aa";
  if (result.aaLarge) return "large-only";
  return "fail";
}

export const LEVEL_LABEL: Record<ContrastLevel, string> = {
  aaa: "AAA",
  aa: "AA",
  "large-only": "Large text only",
  fail: "Fails",
};

export const LEVEL_COLOR: Record<ContrastLevel, string> = {
  aaa: "var(--success)",
  aa: "var(--success)",
  "large-only": "var(--warning)",
  fail: "var(--danger)",
};

/** Formats a ratio the way the WCAG spec writes it. */
export function formatRatio(ratio: number): string {
  return `${ratio.toFixed(2)}:1`;
}

/**
 * Whether black or white ink reads better on a given colour.
 *
 * Used for the "if you put text on this swatch" check — it reports the better
 * of the two rather than assuming white, which is the assumption that puts
 * white type on a pale yellow.
 */
export function bestInkOn(background: string): { ink: "#ffffff" | "#000000"; result: ContrastResult } | null {
  const white = checkContrast("#ffffff", background);
  const black = checkContrast("#000000", background);
  if (!white || !black) return null;
  return white.ratio >= black.ratio ? { ink: "#ffffff", result: white } : { ink: "#000000", result: black };
}
