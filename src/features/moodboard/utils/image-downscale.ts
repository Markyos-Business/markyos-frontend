import { fileToDataUrl } from "@/lib/utils";

/**
 * Reference images, stored at a size a screen can actually use.
 *
 * A moodboard is filled by dragging photographs in off a camera or a phone, and
 * `fileToDataUrl` stores whatever it is handed. Twelve 4000×3000 photos were
 * measured on the canvas: the browser held **576MB of decoded bitmap** in order
 * to draw cards of 2,533 pixels each — roughly five thousand times more pixels
 * than were on screen. Nothing about that shows up in the file sizes, because
 * the encoded bytes are small; it is the decode that costs, and it is paid on
 * every raster, which is why the board got slower the more references went on
 * it.
 *
 * 1600px on the long edge is the same ceiling `stockImages.ts` already applies
 * to photos fetched from the web, chosen there for the same reason. It is above
 * any size a card is drawn at, and above a retina full-bleed section on the
 * published site.
 */
export const MAX_IMAGE_EDGE = 1600;

const JPEG_QUALITY = 0.82;

/**
 * Formats where re-encoding would throw away the thing the file exists for: a
 * vector has no resolution to reduce, and rasterising it would destroy it; an
 * animation would come back as its first frame.
 */
const KEEP_WHOLE = new Set(["image/svg+xml", "image/gif"]);

/**
 * A file as a data URL, reduced to {@link MAX_IMAGE_EDGE} if it is larger.
 *
 * Deliberately a no-op on anything already small enough: an image under the
 * ceiling is returned byte-for-byte, with no re-encode and so no generation
 * loss. That also keeps colour sampling exact — the palette reader pulls hex
 * values straight out of these pixels, and a JPEG round-trip would move them.
 */
export async function fileToDownscaledDataUrl(file: File, maxEdge = MAX_IMAGE_EDGE): Promise<string> {
  if (KEEP_WHOLE.has(file.type)) return fileToDataUrl(file);

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    // Not something this browser can decode. Store it untouched rather than
    // lose the upload over an optimisation.
    return fileToDataUrl(file);
  }

  try {
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    if (scale === 1) return await fileToDataUrl(file);

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return await fileToDataUrl(file);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    // PNG keeps its alpha — a reference with a cut-out background is a real
    // thing to pin to a board, and JPEG would fill it with black. Everything
    // else is a photograph, which is what JPEG is for.
    return file.type === "image/png"
      ? canvas.toDataURL("image/png")
      : canvas.toDataURL("image/jpeg", JPEG_QUALITY);
  } finally {
    bitmap.close();
  }
}
