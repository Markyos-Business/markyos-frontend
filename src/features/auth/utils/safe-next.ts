/** Authentication may return only to an internal app path. */
export function safeNextPath(value: string | null): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//") || /[\\\u0000-\u0020\u007f]/.test(value)) return null;
  try {
    const url = new URL(value, "https://markyos.invalid");
    const path = decodeURIComponent(url.pathname);
    if (url.origin !== "https://markyos.invalid" || path.startsWith("//") || /[\\\u0000-\u0020\u007f]/.test(path)) return null;
    return url.pathname + url.search + url.hash;
  } catch { return null; }
}
