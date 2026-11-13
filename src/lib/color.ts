import { hexToRgb, rgbToCmyk, rgbToHsl, type Cmyk, type Hsl, type Rgb } from "./utils";

/**
 * Colour conversions for the picker. The one-way helpers (hex → rgb → hsl /
 * cmyk) already live in utils; this adds the way back and HSV, the space the
 * picker's square is drawn in (saturation across, brightness up).
 */

export type Hsv = { h: number; s: number; v: number };

/** The notations the picker reads and writes. */
export type ColorNotation = "hex" | "rgb" | "hsl" | "cmyk";

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

export function rgbToHex({ r, g, b }: Rgb): string {
  return `#${[r, g, b].map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}

/** `h` 0–360, `s` and `v` 0–100. */
export function rgbToHsv({ r, g, b }: Rgb): Hsv {
  const rf = r / 255;
  const gf = g / 255;
  const bf = b / 255;
  const max = Math.max(rf, gf, bf);
  const d = max - Math.min(rf, gf, bf);
  let h = 0;
  if (d !== 0) {
    if (max === rf) h = ((gf - bf) / d) % 6;
    else if (max === gf) h = (bf - rf) / d + 2;
    else h = (rf - gf) / d + 4;
    h = (h * 60 + 360) % 360;
  }
  return { h, s: max === 0 ? 0 : (d / max) * 100, v: max * 100 };
}

export function hsvToRgb({ h, s, v }: Hsv): Rgb {
  const sf = clamp(s, 0, 100) / 100;
  const vf = clamp(v, 0, 100) / 100;
  const f = (n: number) => {
    const k = (n + ((h % 360) + 360) / 60) % 6;
    return vf - vf * sf * Math.max(0, Math.min(k, 4 - k, 1));
  };
  return { r: Math.round(f(5) * 255), g: Math.round(f(3) * 255), b: Math.round(f(1) * 255) };
}

export function hslToRgb({ h, s, l }: Hsl): Rgb {
  const sf = clamp(s, 0, 100) / 100;
  const lf = clamp(l, 0, 100) / 100;
  const a = sf * Math.min(lf, 1 - lf);
  const f = (n: number) => {
    const k = (n + ((h % 360) + 360) / 30) % 12;
    return lf - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return { r: Math.round(f(0) * 255), g: Math.round(f(8) * 255), b: Math.round(f(4) * 255) };
}

/** Naive CMYK (no ICC profile), the inverse of `rgbToCmyk`. */
export function cmykToRgb({ c, m, y, k }: Cmyk): Rgb {
  const kf = 1 - clamp(k, 0, 100) / 100;
  const ch = (v: number) => Math.round(255 * (1 - clamp(v, 0, 100) / 100) * kf);
  return { r: ch(c), g: ch(m), b: ch(y) };
}

/** `#09f`, `09F`, `#0099ff` → `#0099FF`; anything else → null. */
export function normalizeHex(text: string): string | null {
  let t = text.trim().replace(/^#/, "");
  if (/^[\da-f]{3}$/i.test(t)) t = t.replace(/./g, (c) => c + c);
  return /^[\da-f]{6}$/i.test(t) ? `#${t.toUpperCase()}` : null;
}

/** The channels a notation shows, as whole numbers. HEX is one text value. */
export function channels(hex: string, notation: Exclude<ColorNotation, "hex">): number[] {
  const rgb = hexToRgb(hex) ?? { r: 0, g: 0, b: 0 };
  if (notation === "rgb") return [rgb.r, rgb.g, rgb.b];
  if (notation === "hsl") {
    const { h, s, l } = rgbToHsl(rgb);
    return [h, s, l];
  }
  const { c, m, y, k } = rgbToCmyk(rgb);
  return [c, m, y, k];
}

/** Each channel's upper bound, for clamping what is typed. */
export const CHANNEL_MAX: Record<Exclude<ColorNotation, "hex">, number[]> = {
  rgb: [255, 255, 255],
  hsl: [360, 100, 100],
  cmyk: [100, 100, 100, 100],
};

/** Channels back to a hex, clamped to their ranges. */
export function fromChannels(notation: Exclude<ColorNotation, "hex">, values: number[]): string {
  const v = values.map((n, i) => clamp(Number.isFinite(n) ? n : 0, 0, CHANNEL_MAX[notation][i]));
  if (notation === "rgb") return rgbToHex({ r: v[0], g: v[1], b: v[2] });
  if (notation === "hsl") return rgbToHex(hslToRgb({ h: v[0], s: v[1], l: v[2] }));
  return rgbToHex(cmykToRgb({ c: v[0], m: v[1], y: v[2], k: v[3] }));
}

/** The value as someone would paste it into CSS or a print spec. */
export function formatColor(hex: string, notation: ColorNotation): string {
  if (notation === "hex") return hex.toUpperCase();
  const [a, b, c, d] = channels(hex, notation);
  if (notation === "rgb") return `rgb(${a}, ${b}, ${c})`;
  if (notation === "hsl") return `hsl(${a}, ${b}%, ${c}%)`;
  return `cmyk(${a}%, ${b}%, ${c}%, ${d}%)`;
}
