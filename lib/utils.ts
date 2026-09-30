export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "brand";
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

/**
 * Reads a File into a base64 data: URL rather than a blob: object URL.
 * blob: URLs only stay valid for the document that created them — the
 * instant this app's persisted state (localStorage) is reloaded in a new
 * page load, every blob: URL in it points nowhere and every uploaded asset,
 * logo, or block image renders broken. A data: URL is a plain string that
 * survives serialization/reload exactly like any other persisted field.
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function initialsFor(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export function formatRelative(ts: number, now: number = Date.now()): string {
  const diffMs = now - ts;
  const sec = Math.round(diffMs / 1000);
  if (sec < 60) return ltr("just now");
  const min = Math.round(sec / 60);
  if (min < 60) return ltr(`${min}m ago`);
  const hr = Math.round(min / 60);
  if (hr < 24) return ltr(`${hr}h ago`);
  const day = Math.round(hr / 24);
  if (day < 7) return ltr(`${day}d ago`);
  const week = Math.round(day / 7);
  if (week < 5) return ltr(`${week}w ago`);
  const month = Math.round(day / 30);
  if (month < 12) return ltr(`${month}mo ago`);
  const year = Math.round(day / 365);
  return ltr(`${year}y ago`);
}

/**
 * Bracket a string with LEFT-TO-RIGHT MARKs so it always paints
 * left-to-right, whatever the surrounding text direction is.
 *
 * "236 KB" is two directional runs: the digits (weak, European Number) and the
 * unit (strong Latin). Alone inside `dir="rtl"` each run is internally LTR,
 * but the *runs themselves* get laid out right-to-left, so they swap and the
 * label paints as "KB 236". The same happens to "10m ago" ("10" / "m ago").
 *
 * The fix has to live in the string, not in CSS: several callers interpolate
 * these values into `title` attributes and into longer sentences, where there
 * is no wrapper element to carry `unicode-bidi: isolate`.
 *
 * LRM rather than an LRI…PDI isolate, which was tried first and measured: an
 * isolate makes the value a single neutral object, so when it is embedded in
 * an English sentence ("Saved 10m ago") it resolves to the RTL paragraph level
 * and jumps to the far side of the sentence. LRM is a strong L character, so
 * the digits and the unit resolve to Latin level whether the value stands
 * alone or sits mid-sentence. The marks are zero-width — treat the output as
 * display text and never parse it back.
 */
export function ltr(text: string): string {
  return `‎${text}‎`;
}

export function formatBytes(kb: number): string {
  if (kb < 1024) return ltr(`${Math.round(kb)} KB`);
  return ltr(`${(kb / 1024).toFixed(1)} MB`);
}

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export function hexToRgb(hex: string): Rgb | null {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  if (!m) return null;
  return {
    r: parseInt(m[1], 16),
    g: parseInt(m[2], 16),
    b: parseInt(m[3], 16),
  };
}

export function isValidHex(hex: string): boolean {
  return hexToRgb(hex) !== null;
}

export interface Cmyk {
  c: number;
  m: number;
  y: number;
  k: number;
}

export function rgbToCmyk({ r, g, b }: Rgb): Cmyk {
  if (r === 0 && g === 0 && b === 0) return { c: 0, m: 0, y: 0, k: 100 };
  const rf = r / 255;
  const gf = g / 255;
  const bf = b / 255;
  const k = 1 - Math.max(rf, gf, bf);
  const c = (1 - rf - k) / (1 - k);
  const m = (1 - gf - k) / (1 - k);
  const y = (1 - bf - k) / (1 - k);
  return {
    c: Math.round(c * 100),
    m: Math.round(m * 100),
    y: Math.round(y * 100),
    k: Math.round(k * 100),
  };
}

export interface Hsl {
  h: number;
  s: number;
  l: number;
}

export function rgbToHsl({ r, g, b }: Rgb): Hsl {
  const rf = r / 255;
  const gf = g / 255;
  const bf = b / 255;
  const max = Math.max(rf, gf, bf);
  const min = Math.min(rf, gf, bf);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l: Math.round(l * 100) };
  const s = d / (1 - Math.abs(2 * l - 1));
  let h: number;
  if (max === rf) h = ((gf - bf) / d) % 6;
  else if (max === gf) h = (bf - rf) / d + 2;
  else h = (rf - gf) / d + 4;
  h = (h * 60 + 360) % 360;
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

/**
 * Every notation a designer or developer might need to paste somewhere, from
 * one hex.
 *
 * CMYK is included with a caveat that belongs on the label, not in a comment:
 * converting sRGB to CMYK without an ICC profile is an approximation, and a
 * press will not match it exactly. Showing it silently would imply a print
 * accuracy this cannot deliver.
 */
export interface ColorFormat {
  label: string;
  value: string;
  /** Set when the value is an approximation rather than an exact restatement. */
  note?: string;
  arNote?: string;
}

export function colorFormats(hex: string): ColorFormat[] {
  const rgb = hexToRgb(hex);
  if (!rgb) return [{ label: "HEX", value: hex.toUpperCase() }];
  const hsl = rgbToHsl(rgb);
  const cmyk = rgbToCmyk(rgb);
  return [
    { label: "HEX", value: hex.toUpperCase() },
    { label: "RGB", value: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` },
    { label: "HSL", value: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)` },
    {
      label: "CMYK",
      value: `${cmyk.c}, ${cmyk.m}, ${cmyk.y}, ${cmyk.k}`,
      note: "Approximate — no ICC profile applied. Confirm with your printer.",
      arNote: "تقريبي — بدون ملف ألوان ICC. تأكّد مع المطبعة.",
    },
  ];
}

function relativeLuminance({ r, g, b }: Rgb): number {
  const [rs, gs, bs] = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/** WCAG 2.x contrast ratio between two hex colors, 1–21. */
export function contrastRatio(hexA: string, hexB: string): number | null {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  if (!a || !b) return null;
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [lighter, darker] = la > lb ? [la, lb] : [lb, la];
  return (lighter + 0.05) / (darker + 0.05);
}
