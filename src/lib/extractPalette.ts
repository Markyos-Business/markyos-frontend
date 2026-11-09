"use client";

/**
 * Reads the colours actually present in a piece of artwork.
 *
 * Nothing here is guessed or generated — every value returned is a colour the
 * file genuinely contains, reported with the share of the mark it covers, so
 * a studio can see at a glance which is the dominant one and which is a
 * detail. What it cannot know is *intent*: which of them the brand considers
 * primary, or what they should be called. Those stay the studio's call, which
 * is why the picker adds nothing until someone chooses.
 */

export interface ExtractedColor {
  hex: string;
  /** Share of the artwork's opaque pixels, 0–1. */
  share: number;
  /** A plain description of the measured colour, offered as a starting name. */
  name: string;
}

export type ExtractFailure =
  | { ok: false; reason: "load" }
  | { ok: false; reason: "tainted" }
  | { ok: false; reason: "empty" };

export type ExtractResult = { ok: true; colors: ExtractedColor[] } | ExtractFailure;

/** Sampled small: a palette is a whole-image property, and 160² is plenty. */
const SAMPLE = 160;
/**
 * Anti-aliased edges are blends of the shape and whatever is behind it — real
 * pixels, but not real brand colours. Requiring near-full opacity drops most
 * of them; the rest are removed by the share floor below.
 */
const MIN_ALPHA = 250;
/** Colours covering less than this share are edge residue, not palette. */
const MIN_SHARE = 0.005;
/** CIE76 distance under which two colours are treated as the same one. */
const MERGE_DISTANCE = 18;
const MAX_RESULTS = 8;

interface Lab {
  L: number;
  a: number;
  b: number;
}

function srgbToLinear(c: number): number {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

/** sRGB → CIE Lab (D65), so "are these the same colour?" matches human vision
 *  rather than raw channel distance, which groups nothing usefully. */
function rgbToLab(r: number, g: number, b: number): Lab {
  const rl = srgbToLinear(r);
  const gl = srgbToLinear(g);
  const bl = srgbToLinear(b);
  const x = (rl * 0.4124 + gl * 0.3576 + bl * 0.1805) / 0.95047;
  const y = rl * 0.2126 + gl * 0.7152 + bl * 0.0722;
  const z = (rl * 0.0193 + gl * 0.1192 + bl * 0.9505) / 1.08883;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const fx = f(x);
  const fy = f(y);
  const fz = f(z);
  return { L: 116 * fy - 16, a: 500 * (fx - fy), b: 200 * (fy - fz) };
}

function deltaE(p: Lab, q: Lab): number {
  return Math.sqrt((p.L - q.L) ** 2 + (p.a - q.a) ** 2 + (p.b - q.b) ** 2);
}

function toHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;
}

/**
 * A plain description of a measured colour — "Deep blue", "Off-white".
 *
 * Offered as a starting name only. It describes what the value *is*; it makes
 * no claim about what the brand calls it, and the picker lets every name be
 * rewritten before anything is saved.
 */
function describe(r: number, g: number, b: number): string {
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  const lp = l * 100;

  if (s < 0.08) {
    if (lp < 12) return "Near-black";
    if (lp < 32) return "Charcoal";
    if (lp < 62) return "Grey";
    if (lp < 88) return "Light grey";
    return "Off-white";
  }

  let h: number;
  const rf = r / 255;
  const gf = g / 255;
  const bf = b / 255;
  if (max === rf) h = ((gf - bf) / d) % 6;
  else if (max === gf) h = (bf - rf) / d + 2;
  else h = (rf - gf) / d + 4;
  h = (h * 60 + 360) % 360;

  const hue =
    h < 15 || h >= 345
      ? "Red"
      : h < 42
        ? "Orange"
        : h < 66
          ? "Yellow"
          : h < 160
            ? "Green"
            : h < 200
              ? "Teal"
              : h < 252
                ? "Blue"
                : h < 292
                  ? "Violet"
                  : h < 345
                    ? "Magenta"
                    : "Red";

  const qualifier = lp < 26 ? "Deep " : lp > 76 ? "Pale " : s < 0.35 ? "Muted " : "";
  return `${qualifier}${qualifier ? hue.toLowerCase() : hue}`;
}

interface Bucket {
  count: number;
  r: number;
  g: number;
  b: number;
}

function sample(img: HTMLImageElement): ExtractResult {
  const w = img.naturalWidth || SAMPLE;
  const h = img.naturalHeight || SAMPLE;
  const scale = Math.min(1, SAMPLE / Math.max(w, h));
  const cw = Math.max(1, Math.round(w * scale));
  const ch = Math.max(1, Math.round(h * scale));

  const canvas = document.createElement("canvas");
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return { ok: false, reason: "load" };
  ctx.drawImage(img, 0, 0, cw, ch);

  let data: Uint8ClampedArray;
  try {
    data = ctx.getImageData(0, 0, cw, ch).data;
  } catch {
    return { ok: false, reason: "tainted" };
  }

  // Coarse 5-bit-per-channel buckets first: exact-colour counting would treat
  // every gradient step as its own colour and return a hundred near-identical
  // blues. The mean of each bucket is kept so the reported hex is a real
  // average of real pixels, not the bucket's rounded corner.
  const buckets = new Map<number, Bucket>();
  let opaque = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < MIN_ALPHA) continue;
    opaque++;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const key = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.count++;
      bucket.r += r;
      bucket.g += g;
      bucket.b += b;
    } else {
      buckets.set(key, { count: 1, r, g, b });
    }
  }

  if (opaque === 0) return { ok: false, reason: "empty" };

  const ranked = [...buckets.values()]
    .map((k) => ({ count: k.count, r: k.r / k.count, g: k.g / k.count, b: k.b / k.count }))
    .sort((x, y) => y.count - x.count);

  // Merge perceptually-close buckets into the more common of the pair, so a
  // mark's one blue is reported once rather than as four shades of itself.
  const merged: { count: number; r: number; g: number; b: number; lab: Lab }[] = [];
  for (const c of ranked) {
    const lab = rgbToLab(c.r, c.g, c.b);
    const near = merged.find((m) => deltaE(m.lab, lab) < MERGE_DISTANCE);
    if (near) near.count += c.count;
    else merged.push({ ...c, lab });
  }

  const colors = merged
    .map((m) => ({ hex: toHex(m.r, m.g, m.b), share: m.count / opaque, name: describe(m.r, m.g, m.b) }))
    .filter((c) => c.share >= MIN_SHARE)
    .slice(0, MAX_RESULTS);

  if (colors.length === 0) return { ok: false, reason: "empty" };
  return { ok: true, colors };
}

export function extractPalette(url: string): Promise<ExtractResult> {
  return new Promise((resolve) => {
    const img = new Image();
    // Required for anything that isn't a data: URL, or reading the pixels back
    // throws a security error.
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(sample(img));
    img.onerror = () => resolve({ ok: false, reason: "load" });
    img.src = url;
  });
}
