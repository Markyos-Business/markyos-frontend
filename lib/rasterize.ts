/**
 * Client-side vector→raster conversion — the v2.0 "no server compute cost"
 * bet from the architecture doc, done with the plain Canvas 2D API rather
 * than a Rust/WASM pipeline. Same result for the user (instant PNG/WebP
 * export in the browser), simpler to ship for a local demo.
 */

function loadImageEl(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Couldn't load ${url}`));
    img.src = url;
  });
}

export type RasterFormat = "png" | "webp";

/**
 * Rasterizes an SVG/PNG source at the given pixel size, optionally
 * color-inverted (used for the "Reversed" logo variant, which mirrors the
 * `filter: invert(1)` treatment used everywhere else in the app to show
 * these dark-ink source files as white marks on the dark canvas).
 */
export async function rasterize(
  url: string,
  width: number,
  height: number,
  format: RasterFormat,
  invert: boolean
): Promise<Blob> {
  const img = await loadImageEl(url);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");
  if (invert) ctx.filter = "invert(1)";
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Rasterization failed"))),
      format === "webp" ? "image/webp" : "image/png",
      0.94
    );
  });
}

export function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}
