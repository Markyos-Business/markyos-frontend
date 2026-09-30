export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const ACCEPTED_EXTENSIONS = ["svg", "png"] as const;

export function extensionOf(fileName: string): string {
  const parts = fileName.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
}

export type ValidationResult =
  | { ok: true; format: "svg" | "png" }
  | { ok: false; reason: string };

export function validateFile(file: File): ValidationResult {
  const ext = extensionOf(file.name);
  if (ext !== "svg" && ext !== "png") {
    return { ok: false, reason: `.${ext || "?"} isn't supported` };
  }
  if (file.size > MAX_FILE_BYTES) {
    return { ok: false, reason: "File is larger than the 10 MB cap" };
  }
  return { ok: true, format: ext };
}

export function loadImageDimensions(
  url: string
): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.naturalWidth || 300,
        height: img.naturalHeight || 150,
      });
    };
    img.onerror = () => resolve({ width: 300, height: 150 });
    img.src = url;
  });
}
