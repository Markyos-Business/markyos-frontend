"use client";

/**
 * What a piece of uploaded artwork actually looks like, and what ground it
 * needs in order to be seen.
 *
 * This exists because the app used to put `filter: invert(1)` on every logo
 * and icon it rendered. That was written for the seed marks, which are black
 * shapes on transparency and genuinely need reversing to read on a dark
 * ground — but a filter cannot tell the difference between that and a real
 * uploaded logo. Inverting a brand's blue `#0099FF` mark turns it orange, and
 * the brand's own guideline was showing the wrong colour on every page.
 *
 * So the artwork is measured instead of assumed:
 *
 * - `mono-dark`  — one dark tone on transparency. Reversing it on a dark
 *                  ground is what "reversed logo" means, so it is allowed.
 * - `mono-light` — one light tone. Reversed on a light ground for the same reason.
 * - `colour`     — carries real colour. Never touched, at any size, on any
 *                  ground. If it is illegible the answer is a plate behind it,
 *                  not a filter over it.
 *
 * The second half — **which ground** — is `placeArtwork`, and it takes the
 * measured luminance of the surface the artwork is about to be drawn on rather
 * than a light/dark flag. A thumbnail well, a brand's own guideline page and
 * the app's sidebar are three different greys, and "is this ground dark" is not
 * the question: the question is whether *this* ink separates from *that*
 * surface, which is a ratio, not a category.
 */

export type MarkTone = "mono-dark" | "mono-light" | "colour" | "unknown";

export interface MarkProfile {
  tone: MarkTone;
  /**
   * Mean WCAG relative luminance of the artwork's opaque pixels, 0–1.
   *
   * The tone alone can't answer "will this read here": a `colour` mark is never
   * reversed, so the only remaining question is whether its ink is close enough
   * in lightness to the ground to disappear into it. That's a measurement, and
   * this is it. `NaN` when nothing was measurable.
   *
   * It is *relative* luminance — each channel linearised before averaging, the
   * way WCAG defines it — rather than a mean of the gamma-encoded bytes, so it
   * can be put straight into a contrast ratio against the ground. The earlier
   * version averaged the raw bytes, which is a perceptual lightness and not a
   * quantity a ratio means anything with.
   */
  luminance: number;
  /**
   * Share of sampled pixels that are effectively transparent, 0–1.
   *
   * A logo delivered as a transparent PNG has no ground of its own, so whatever
   * is behind it *is* its background. A JPEG with a baked-in white box does
   * not — plating it would put a white card inside a white card. Measuring the
   * difference is the only way to tell them apart.
   */
  transparency: number;
}

const UNKNOWN: MarkProfile = { tone: "unknown", luminance: NaN, transparency: 0 };

/** Cached per URL — one workspace re-renders the same handful of marks constantly. */
const cache = new Map<string, MarkProfile>();
const inFlight = new Map<string, Promise<MarkProfile>>();

/** Saturation above which a pixel counts as carrying real colour. */
const COLOUR_SAT = 0.18;
/** Share of visible pixels that must be coloured before the whole mark is. */
const COLOUR_SHARE = 0.06;
/** Sampled at a small size: tone is a whole-image property, not a detail one. */
const SAMPLE = 48;

/** WCAG relative luminance of one sRGB byte triple. */
function relativeLuminance(r: number, g: number, b: number): number {
  const channel = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** The WCAG contrast ratio between two relative luminances. */
export function luminanceRatio(a: number, b: number): number {
  const [light, dark] = a > b ? [a, b] : [b, a];
  return (light + 0.05) / (dark + 0.05);
}

/**
 * The luminance that is equally far, in ratio terms, from black and from white:
 * `sqrt(0.05 * 1.05) - 0.05`. Anything below it is closer to black, so white
 * ink reads better on it, and vice versa. This is the honest midpoint of the
 * scale — 0.5 looks like the middle and is not, because luminance is linear
 * light and perception is not.
 */
export const MID_LUMINANCE = Math.sqrt(0.05 * 1.05) - 0.05;

/**
 * The separation an uploaded mark has to keep from the surface behind it before
 * this code leaves it alone.
 *
 * Deliberately below the 3:1 WCAG 1.4.11 asks of a control's boundary. A logo
 * is the brand's own artwork, and putting a plate behind one is a visible change
 * to how that brand looks — so the bar here is "can it be seen at all", not "is
 * its edge crisp". Below 1.5:1 a shape at thumbnail size stops being reliably
 * distinguishable from its ground, which is the failure people actually report:
 * a white wordmark on a white card reads as an empty card.
 */
export const MIN_ARTWORK_SEPARATION = 1.5;

/** The two grounds a plate may be — the extremes, because a plate is a last resort. */
const PLATE_LIGHT = "#ffffff";
const PLATE_DARK = "#0d0d0f";
const PLATE_LIGHT_LUM = relativeLuminance(255, 255, 255);
const PLATE_DARK_LUM = relativeLuminance(0x0d, 0x0d, 0x0f);

function measure(img: HTMLImageElement): MarkProfile {
  const canvas = document.createElement("canvas");
  canvas.width = SAMPLE;
  canvas.height = SAMPLE;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return UNKNOWN;
  ctx.drawImage(img, 0, 0, SAMPLE, SAMPLE);

  let data: Uint8ClampedArray;
  try {
    data = ctx.getImageData(0, 0, SAMPLE, SAMPLE).data;
  } catch {
    // A cross-origin image taints the canvas. Unknown is the safe answer:
    // callers leave the artwork exactly as uploaded.
    return UNKNOWN;
  }

  let sampled = 0;
  let visible = 0;
  let clear = 0;
  let coloured = 0;
  let luminanceSum = 0;

  for (let i = 0; i < data.length; i += 4) {
    sampled++;
    const alpha = data[i + 3];
    // Anything under a quarter opaque contributes nothing anyone can see, so
    // it counts as the artwork having no ground of its own there.
    if (alpha < 64) clear++;
    // Anti-aliased edges are half-transparent and read as mid-grey; counting
    // them would drag a pure black mark toward "light".
    if (alpha < 200) continue;
    visible++;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (max > 0 && (max - min) / max > COLOUR_SAT) coloured++;
    luminanceSum += relativeLuminance(r, g, b);
  }

  if (visible === 0) return UNKNOWN;
  const luminance = luminanceSum / visible;
  const transparency = sampled === 0 ? 0 : clear / sampled;
  if (coloured / visible > COLOUR_SHARE) return { tone: "colour", luminance, transparency };
  return { tone: luminance < MID_LUMINANCE ? "mono-dark" : "mono-light", luminance, transparency };
}

export function getCachedProfile(url: string): MarkProfile | undefined {
  return cache.get(url);
}

export function analyseMark(url: string): Promise<MarkProfile> {
  const hit = cache.get(url);
  if (hit) return Promise.resolve(hit);
  const pending = inFlight.get(url);
  if (pending) return pending;

  const promise = new Promise<MarkProfile>((resolve) => {
    const img = new Image();
    // Needed for any URL that isn't a data: URL, or getImageData throws.
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(measure(img));
    img.onerror = () => resolve(UNKNOWN);
    img.src = url;
  }).then((profile) => {
    cache.set(url, profile);
    inFlight.delete(url);
    return profile;
  });

  inFlight.set(url, promise);
  return promise;
}

export interface ArtworkPlacement {
  /** Invert the artwork. Only ever true for a single-tone mark. */
  reverse: boolean;
  /** A ground to draw the artwork on, or null to leave the surface as it is. */
  plate: string | null;
  /** How far the artwork ends up separated from what is behind it, as a ratio. */
  separation: number;
}

/**
 * How to draw this artwork on a surface of this luminance.
 *
 * One function, because the two answers are not independent: a mark that has
 * been reversed no longer needs a plate, and a mark that cannot be reversed is
 * exactly the one that might. Splitting them is how the app ended up with a
 * plate rule that was written down and never drawn.
 *
 * Nothing measurable, nothing done — an unknown profile (a cross-origin image,
 * a file that failed to decode) renders exactly as uploaded, because a guess
 * about a brand's artwork is worse than leaving it alone.
 */
export function placeArtwork(profile: MarkProfile, groundLuminance: number): ArtworkPlacement {
  const asIs = luminanceRatio(profile.luminance, groundLuminance);
  if (Number.isNaN(profile.luminance)) return { reverse: false, plate: null, separation: NaN };

  // A single-tone mark reverses when that is what makes it read. `1 - l` is not
  // the luminance of the inverted ink — inversion happens on the encoded bytes,
  // not on linear light — but it is monotonic in the right direction, and the
  // decision only needs to know which side of the ground the ink ends up on.
  if (profile.tone === "mono-dark" || profile.tone === "mono-light") {
    const reversedLuminance = 1 - profile.luminance;
    const reversed = luminanceRatio(reversedLuminance, groundLuminance);
    if (asIs < MIN_ARTWORK_SEPARATION && reversed > asIs) {
      return { reverse: true, plate: null, separation: reversed };
    }
  }

  if (asIs >= MIN_ARTWORK_SEPARATION) return { reverse: false, plate: null, separation: asIs };

  /*
   * A plate, then — the printed-brand-book answer for a positive logo on a
   * dark page, and the one this file has always specified for artwork that
   * carries real colour.
   *
   * Which plate is measured rather than assumed from the theme: a navy-and-blue
   * lockup is in trouble on a dark card and wants white behind it, while a
   * white-and-pale-grey one is in trouble on a light card and wants black. Both
   * are `colour` marks; only the measurement separates them.
   */
  const onLight = luminanceRatio(profile.luminance, PLATE_LIGHT_LUM);
  const onDark = luminanceRatio(profile.luminance, PLATE_DARK_LUM);
  const best = onLight >= onDark ? PLATE_LIGHT : PLATE_DARK;
  const separation = Math.max(onLight, onDark);
  // A plate that is no better than the surface it covers is just a rectangle.
  if (separation <= asIs) return { reverse: false, plate: null, separation: asIs };
  return { reverse: false, plate: best, separation };
}

/**
 * Whether this artwork may be reversed to read on the given ground.
 *
 * The older, categorical form of the question, kept because the guideline
 * templates depend on it: inside a brand book a single-tone mark is *expected*
 * to flip on a dark page, whether or not the positive version would technically
 * still have been visible. That is what "reversed logo" means to a designer,
 * and it is not the same question `placeArtwork` asks, which is only ever
 * "can this be seen at all".
 *
 * Everything else — including every tone we could not measure — renders exactly
 * as uploaded.
 */
export function shouldReverse(tone: MarkTone, onDarkGround: boolean): boolean {
  if (tone === "mono-dark") return onDarkGround;
  if (tone === "mono-light") return !onDarkGround;
  return false;
}

/*
 * Restated on the relative-luminance scale.
 *
 * These were 0.42 and 0.62 when `MarkProfile.luminance` was a mean of the
 * gamma-encoded bytes. It is now WCAG relative luminance, which is linear
 * light, so the same two points sit far lower on the scale — roughly l^2.2.
 * Leaving the old numbers in place would have quietly plated almost every mark
 * on the dark theme and almost none on the light one.
 */
const PLATE_DARK_MAX = 0.15;
const PLATE_LIGHT_MIN = 0.35;

/**
 * Whether this artwork needs a plate behind it to be visible on this ground.
 *
 * The other half of the rule this file opens with — "if it is illegible on a
 * dark page the answer is a plate behind it, not a filter over it". Only
 * artwork that is about to be drawn as-is qualifies: anything reversing already
 * reads. Everything else is judged on measured lightness rather than on its
 * category, because a white-and-blue lockup and a navy-and-blue one are both
 * `colour` and only one of them is in trouble on a dark page.
 */
export function needsPlate(profile: MarkProfile, onDarkGround: boolean): boolean {
  if (Number.isNaN(profile.luminance)) return false;
  if (shouldReverse(profile.tone, onDarkGround)) return false;
  return onDarkGround ? profile.luminance < PLATE_DARK_MAX : profile.luminance > PLATE_LIGHT_MIN;
}

/**
 * The relative luminance of a resolved CSS colour string.
 *
 * Takes what `getComputedStyle` returns — `rgb(20, 20, 20)` or
 * `rgba(20, 20, 20, 0.5)` — plus a hex, so a caller can read the real painted
 * ground out of the document rather than hard-coding what the theme's tokens
 * are supposed to be. Returns NaN for anything unparseable, including
 * `transparent`, which is the honest answer: an unknown ground is not a ground.
 */
export function luminanceOfCss(value: string): number {
  const text = value.trim();
  const rgb = /rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+))?\s*\)/i.exec(text);
  if (rgb) {
    // A translucent ground is not measurable on its own — what is behind it
    // decides. Treating it as opaque would report a confident wrong number.
    if (rgb[4] !== undefined && Number(rgb[4]) < 0.95) return NaN;
    return relativeLuminance(Number(rgb[1]), Number(rgb[2]), Number(rgb[3]));
  }
  const hex = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(text);
  if (!hex) return NaN;
  const full =
    hex[1].length === 3
      ? hex[1]
          .split("")
          .map((c) => c + c)
          .join("")
      : hex[1];
  return relativeLuminance(
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  );
}
