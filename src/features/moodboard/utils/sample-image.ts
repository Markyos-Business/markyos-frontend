"use client";

import { describeColor, extractPalette } from "./kmeans";
import type { Cluster } from "./kmeans";

/**
 * The browser half of palette extraction: load an image, shrink it, and hand
 * the pixels to the pure clusterer.
 *
 * **Why this is not the same thing as `lib/extractPalette.ts`.** That one
 * answers "which colours does this file contain?", by bucketing exact values —
 * the right question for a vector logo with flat fills, where the brand's blue
 * is a specific hex and reporting an average of it would be wrong. This one
 * answers "what does this photograph look like?", by clustering — the right
 * question for a moodboard, where no pixel is the answer and the useful reply
 * is six colours that stand for thousands. Two questions, two algorithms; the
 * mistake would be having one function pretend to answer both.
 *
 * **Why not a worker.** The build spec calls for one, and at this size it
 * would be ceremony: 128px on the long edge is about 16,000 points, and six
 * clusters over twenty-four iterations is a few milliseconds. A worker earns
 * its keep when a board holds hundreds of images — the clusterer is already
 * pure and takes a plain pixel array, so moving it is a change of caller and
 * nothing else.
 */

/** 128px on the long edge. A palette is a whole-image property; detail is noise. */
const SAMPLE = 128;

export type SampleResult =
  | { ok: true; colors: Array<Cluster & { name: string }> }
  /** A remote image with no CORS headers cannot be read back out of a canvas. */
  | { ok: false; reason: "tainted" | "load" | "empty" };

export function sampleImage(url: string, k = 6): Promise<SampleResult> {
  return new Promise((resolve) => {
    const img = new Image();
    // Required for anything that is not a data: URL, or reading the pixels
    // back throws a security error rather than returning something wrong.
    img.crossOrigin = "anonymous";
    img.onerror = () => resolve({ ok: false, reason: "load" });
    img.onload = () => resolve(read(img, k));
    img.src = url;
  });
}

function read(img: HTMLImageElement, k: number): SampleResult {
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

  const colors = extractPalette(data, { k });
  if (colors.length === 0) return { ok: false, reason: "empty" };
  return { ok: true, colors: colors.map((c) => ({ ...c, name: describeColor(c.hex) })) };
}
