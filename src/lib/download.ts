/**
 * Save a file under its own name, whatever origin it is on.
 *
 * `<a download>` only works for same-origin and `data:` URLs; a brand file on
 * the API's media host would just open in a tab. Fetching it first and saving
 * the blob keeps "Download" a download. Falls back to opening the link if the
 * fetch fails, so the file is never unreachable.
 */
export async function saveFile(url: string, fileName: string): Promise<void> {
  if (url.startsWith("data:") || url.startsWith("blob:")) return clickDownload(url, fileName);
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(String(res.status));
    saveBlob(await res.blob(), fileName);
  } catch {
    window.open(url, "_blank", "noopener");
  }
}

/** Save bytes already in hand (a CSV export) under a name. */
export function saveBlob(blob: Blob, fileName: string): void {
  const blobUrl = URL.createObjectURL(blob);
  clickDownload(blobUrl, fileName);
  // Revoked after the click has been handed to the browser.
  setTimeout(() => URL.revokeObjectURL(blobUrl), 30_000);
}

function clickDownload(href: string, fileName: string) {
  const a = document.createElement("a");
  a.href = href;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/** For an `<a href download>`: keeps the link, turns the click into a real download. */
export const downloadOnClick = (url: string, fileName: string) => (e: { preventDefault: () => void }) => {
  if (url.startsWith("data:")) return;
  e.preventDefault();
  void saveFile(url, fileName);
};
