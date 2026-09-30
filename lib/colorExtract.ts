import { hexToRgb } from "./utils";

/**
 * The v5.0 "AI brand-compliance checker" from the roadmap, done for real
 * with plain Canvas pixel sampling instead of a model call — genuinely
 * computes dominant colors from whatever image is uploaded and compares
 * them to the workspace's approved palette. No network request, no API key.
 */

function loadImageEl(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Couldn't load ${url}`));
    img.src = url;
  });
}

export interface DominantColor {
  hex: string;
  weight: number;
}

export async function extractDominantColors(url: string, maxColors = 5): Promise<DominantColor[]> {
  const img = await loadImageEl(url);
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");
  ctx.drawImage(img, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size);

  const buckets = new Map<string, number>();
  let sampled = 0;
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a < 128) continue;
    // Quantize to a coarser grid so near-identical pixels bucket together.
    const qr = Math.round(data[i] / 16) * 16;
    const qg = Math.round(data[i + 1] / 16) * 16;
    const qb = Math.round(data[i + 2] / 16) * 16;
    const key = `${qr},${qg},${qb}`;
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
    sampled++;
  }

  const sorted = [...buckets.entries()].sort((a, b) => b[1] - a[1]).slice(0, maxColors);
  return sorted.map(([key, count]) => {
    const [r, g, b] = key.split(",").map((n) => Math.min(255, Number(n)));
    const hex = "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
    return { hex, weight: sampled > 0 ? count / sampled : 0 };
  });
}

/** Euclidean RGB distance, 0–441. Under ~40 reads as "the same color" to the eye. */
export function colorDistance(hexA: string, hexB: string): number | null {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  if (!a || !b) return null;
  return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2);
}
