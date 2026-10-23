/**
 * Colour maths for building a guideline site's neutrals out of the brand's
 * own palette.
 *
 * Until now the client-facing site painted Markyos's own greys (#141414,
 * #1c1c1c, #a3a3ab …) and dropped the brand's accent on top. That made every
 * guideline, for every brand, look like the tool that produced it — which is
 * exactly backwards for a document whose job is to show what the brand looks
 * like. These helpers derive the ground, the surfaces and the text from the
 * brand's own hue instead, so a warm brand gets warm greys and a cold one gets
 * cold greys, with contrast held to WCAG by construction rather than by luck.
 */

import { bestInkOn, contrastRatio } from "@/lib/contrast";

export type RGB = [number, number, number];
export interface HSL {
  /** Degrees, 0–360. */
  h: number;
  /** 0–100. */
  s: number;
  /** 0–100. */
  l: number;
}

export function hexToRgb(hex: string): RGB | null {
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

export function rgbToHex([r, g, b]: RGB): string {
  const part = (c: number) =>
    Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, "0");
  return `#${part(r)}${part(g)}${part(b)}`;
}

export function rgbToHsl([r, g, b]: RGB): HSL {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l: l * 100 };

  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
  else if (max === gn) h = ((bn - rn) / d + 2) / 6;
  else h = ((rn - gn) / d + 4) / 6;
  return { h: h * 360, s: s * 100, l: l * 100 };
}

export function hslToRgb({ h, s, l }: HSL): RGB {
  const hn = (((h % 360) + 360) % 360) / 360;
  const sn = Math.max(0, Math.min(100, s)) / 100;
  const ln = Math.max(0, Math.min(100, l)) / 100;
  if (sn === 0) {
    const v = Math.round(ln * 255);
    return [v, v, v];
  }
  const q = ln < 0.5 ? ln * (1 + sn) : ln + sn - ln * sn;
  const p = 2 * ln - q;
  const channel = (t: number) => {
    let tn = t;
    if (tn < 0) tn += 1;
    if (tn > 1) tn -= 1;
    if (tn < 1 / 6) return p + (q - p) * 6 * tn;
    if (tn < 1 / 2) return q;
    if (tn < 2 / 3) return p + (q - p) * (2 / 3 - tn) * 6;
    return p;
  };
  return [
    Math.round(channel(hn + 1 / 3) * 255),
    Math.round(channel(hn) * 255),
    Math.round(channel(hn - 1 / 3) * 255),
  ];
}

export function hexToHsl(hex: string): HSL | null {
  const rgb = hexToRgb(hex);
  return rgb ? rgbToHsl(rgb) : null;
}

export function hslToHex(hsl: HSL): string {
  return rgbToHex(hslToRgb(hsl));
}

/** 0 (black) to 1 (white), per WCAG's relative-luminance definition. */
export function luminanceOf(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  const channel = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2]);
}

export function isLightHex(hex: string): boolean {
  return luminanceOf(hex) > 0.5;
}

export function withAlpha(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return `rgba(127,127,127,${alpha})`;
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
}

/**
 * A neutral at a given lightness, carrying some of the brand's hue.
 *
 * `tint` is 0–1: at 0 this is a plain grey, at 1 it takes as much of the
 * brand's own saturation as a background can hold before it stops reading as
 * a neutral and starts reading as a colour. The cap is deliberate — a
 * guideline's ground should feel like the brand, not compete with the swatches
 * printed on it.
 */
export function tintedNeutral(hue: number, chroma: number, lightness: number, tint: number): string {
  return hslToHex({
    h: hue,
    s: neutralSaturation(chroma, tint),
    l: Math.max(0, Math.min(100, lightness)),
  });
}

/**
 * How saturated a "neutral" is allowed to get at a given tint setting.
 *
 * The ceiling rises with the system's appetite for colour — a documentation
 * template stays within a few percent of grey, a colour-forward one is allowed
 * a ground you can clearly name — but it is always a ceiling, so a fully
 * saturated brand colour can never be used raw as a page background.
 */
export function neutralSaturation(chroma: number, tint: number): number {
  return Math.min(chroma, 4 + tint * 18);
}

/**
 * Moves a colour away from the ground's own end of the scale.
 *
 * A dark ground's cards sit lighter than it and a light ground's sit darker,
 * so one helper covers both and a template describes its surfaces as "one step
 * up, two steps up" rather than hard-coding a hex per mode.
 */
export function stepFrom(ground: string, steps: number, size: number): string {
  const hsl = hexToHsl(ground);
  if (!hsl) return ground;
  const direction = isLightHex(ground) ? -1 : 1;
  // Very dark grounds have little room below them, so the first step is given
  // extra travel — without it a #050505 ground and its cards are indistinguishable.
  const floorBoost = !isLightHex(ground) && hsl.l < 8 ? 2 : 0;
  return hslToHex({ ...hsl, l: hsl.l + direction * (steps * size + floorBoost) });
}

/**
 * Ink for one text role, tinted toward the brand and held above a contrast floor.
 *
 * `inset` is how far in from the far end of the scale this role sits: body text
 * a few percent off white (or off black), secondary text further in, captions
 * further still. The ratio is a **floor, not a target** — if the requested
 * inset fails on this ground the value is pushed back out until it passes.
 * Solving straight for the ratio instead is a trap worth naming: it returns the
 * dimmest ink that scrapes AAA, so body text that could have been 18:1 ends up
 * at exactly 7:1 and the page reads as washed out while still technically
 * passing.
 */
export function readableInk(
  ground: string,
  hue: number,
  chroma: number,
  tint: number,
  minRatio: number,
  inset: number
): string {
  // Which end to start from is decided by measured contrast, not by "is the
  // ground light?": a mid-tone ground sits on the wrong side of that threshold
  // while black is still clearly the more readable of the two inks on it.
  const darkInk = (bestInkOn(ground)?.ink ?? (isLightHex(ground) ? "#000000" : "#ffffff")) === "#000000";
  const saturation = neutralSaturation(chroma, tint);
  const extreme = darkInk ? 0 : 100;
  /** +1 or -1 — the direction that moves the ink toward the ground. */
  const inward = darkInk ? 1 : -1;

  for (let l = extreme + inward * inset; ; l -= inward * 2) {
    const candidate = hslToHex({ h: hue, s: saturation, l });
    const ratio = contrastRatio(candidate, ground);
    if (ratio !== null && ratio >= minRatio) return candidate;
    // Backed all the way out to pure black or white and it still fails: the
    // ground itself cannot carry text at this ratio. Return the best there is
    // and let the contrast report say so rather than pretending otherwise.
    if (darkInk ? l <= 0 : l >= 100) return hslToHex({ h: hue, s: saturation, l: extreme });
  }
}

/**
 * Lifts an accent off a ground it would otherwise disappear into.
 *
 * A navy brand on a navy ground, or a pale yellow on white, is a real palette a
 * studio will hand over. Rather than silently substituting a different colour,
 * this keeps the hue and moves only the lightness — the smallest change that
 * makes the brand's own accent usable as a link and a focus ring.
 */
export function accentOn(accent: string, ground: string, minRatio = 3): string {
  const ratio = contrastRatio(accent, ground);
  if (ratio !== null && ratio >= minRatio) return accent;
  const hsl = hexToHsl(accent);
  if (!hsl) return accent;
  const direction = isLightHex(ground) ? -1 : 1;
  for (let i = 1; i <= 50; i++) {
    const candidate = hslToHex({ ...hsl, l: hsl.l + direction * i * 2 });
    const next = contrastRatio(candidate, ground);
    if (next !== null && next >= minRatio) return candidate;
  }
  return direction > 0 ? "#ffffff" : "#000000";
}
