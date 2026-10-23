import { ApiError, api } from "@/lib/api/client";

/**
 * Brand files between this browser and the server.
 *
 * The app holds every file as an inline `data:` URL. The server holds links:
 * each file is uploaded once to `/brands/files/` and the brand carries its
 * URL. These two walks convert a brand between the forms, and both
 * directions are cached for the life of the page, so a file is uploaded once
 * and downloaded once however often the brand is synced or opened.
 */

/** data: URL -> its uploaded URL, and back. */
const fileUrls = new Map<string, string>();
const fileData = new Map<string, string>();

function remember(dataUrl: string, url: string) {
  fileUrls.set(dataUrl, url);
  fileData.set(url, dataUrl);
}

/** `value` with each string replaced by `fn(string)`, one at a time, so a
 *  file used twice in a brand is uploaded once. */
async function mapStrings(value: unknown, fn: (s: string) => Promise<string>): Promise<unknown> {
  if (typeof value === "string") return fn(value);
  if (Array.isArray(value)) {
    const out: unknown[] = [];
    for (const v of value) out.push(await mapStrings(v, fn));
    return out;
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = await mapStrings(v, fn);
    return out;
  }
  return value;
}

function readAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/**
 * `value` with every inline file uploaded and swapped for its URL.
 *
 * A file the server refuses (too big, a type it won't store) becomes
 * whatever `onRefused` returns; any other failure throws, so the caller can
 * retry the whole brand.
 */
export function withFileUrls<T>(value: T, onRefused: (dataUrl: string, err: ApiError) => string): Promise<T> {
  return mapStrings(value, async (s) => {
    if (!s.startsWith("data:")) return s;
    const known = fileUrls.get(s);
    if (known) return known;
    const form = new FormData();
    form.append("file", await (await fetch(s)).blob(), "file");
    try {
      const { url } = await api<{ url: string }>("/brands/files/", { method: "POST", body: form });
      remember(s, url);
      return url;
    } catch (err) {
      if (!(err instanceof ApiError) || err.status !== 400) throw err;
      return onRefused(s, err);
    }
  }) as Promise<T>;
}

/**
 * `value` with every link under `fileBase` turned back into a `data:` URL.
 * A file that cannot be fetched keeps its link, which still renders.
 */
export function inlineFiles<T>(value: T, fileBase: string): Promise<T> {
  return mapStrings(value, async (s) => {
    if (!fileBase || !s.startsWith(fileBase)) return s;
    const known = fileData.get(s);
    if (known) return known;
    try {
      const res = await fetch(s);
      if (!res.ok) return s;
      const dataUrl = await readAsDataUrl(await res.blob());
      remember(dataUrl, s);
      return dataUrl;
    } catch {
      return s;
    }
  }) as Promise<T>;
}
