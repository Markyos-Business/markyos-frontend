"use client";

import { AssetCredit } from "@/types";

/**
 * Stock photography search against real, free-to-use image libraries.
 *
 * Two sources, for two different reasons:
 *
 * - **Openverse** (WordPress/Creative Commons) needs no account and no API
 *   key, so it works the moment a studio opens the picker. Every search is
 *   filtered to `license_type=commercial,modification`, which is the part that
 *   actually matters here: a brand book is commercial work, and an NC- or
 *   ND-licensed photo in one is a licensing problem handed to the client. The
 *   filter means everything this returns may legally be used and adapted
 *   commercially — but most of it is CC BY or CC BY-SA, which *requires*
 *   attribution, so the credit is captured with the file rather than left to
 *   the studio to remember.
 * - **Unsplash** is what most studios actually reach for, and its license
 *   needs no attribution at all. It requires an API key, which is free and
 *   instant but is the studio's to create — so it stays optional and the
 *   picker says plainly that it's off until a key is pasted in.
 *
 * Nothing here is mocked. If a source is unreachable the picker says so
 * instead of showing placeholder results.
 */

export type StockSource = "openverse" | "unsplash";

export interface StockResult {
  id: string;
  /** Small preview for the picker grid. */
  thumbUrl: string;
  /** The version actually imported. */
  fullUrl: string;
  title: string;
  credit: AssetCredit;
}

const UNSPLASH_KEY_STORAGE = "markyos:unsplash-key";

export function getUnsplashKey(): string {
  try {
    return window.localStorage.getItem(UNSPLASH_KEY_STORAGE) ?? "";
  } catch {
    return "";
  }
}

export function setUnsplashKey(key: string): void {
  try {
    const trimmed = key.trim();
    if (trimmed) window.localStorage.setItem(UNSPLASH_KEY_STORAGE, trimmed);
    else window.localStorage.removeItem(UNSPLASH_KEY_STORAGE);
  } catch {
    // Private-mode storage refusal — the key just won't be remembered.
  }
}

/** "by-sa" + "2.0" as Openverse reports them, written the way a credit line reads. */
function ccLabel(license: string, version: string): string {
  const upper = license.toUpperCase();
  if (upper === "CC0") return "CC0";
  if (upper === "PDM") return "Public Domain Mark";
  return `CC ${upper}${version ? ` ${version}` : ""}`;
}

interface OpenverseResult {
  id: string;
  title?: string;
  url: string;
  thumbnail?: string;
  creator?: string;
  foreign_landing_url?: string;
  license: string;
  license_version?: string;
  license_url?: string;
}

async function searchOpenverse(query: string, signal: AbortSignal): Promise<StockResult[]> {
  const url = new URL("https://api.openverse.org/v1/images/");
  url.searchParams.set("q", query);
  // 20 is Openverse's hard ceiling for unauthenticated requests — ask for more
  // and it rejects the whole call with a 401 rather than truncating.
  url.searchParams.set("page_size", "20");
  // The whole point of the integration: only work that may be used and
  // modified commercially, which is the only kind that belongs in a client's
  // brand guideline.
  url.searchParams.set("license_type", "commercial,modification");
  url.searchParams.set("mature", "false");

  const res = await fetch(url.toString(), { signal });
  if (!res.ok) {
    // Openverse explains its own refusals ("page_size may not exceed 20 for
    // anonymous requests"), and that sentence is far more use on screen than
    // a bare status code.
    const detail = await res
      .json()
      .then((j: { detail?: string }) => j?.detail)
      .catch(() => undefined);
    throw new Error(detail || `Openverse returned ${res.status}`);
  }
  const json = (await res.json()) as { results?: OpenverseResult[] };

  return (json.results ?? []).map((r) => ({
    id: r.id,
    thumbUrl: r.thumbnail || r.url,
    fullUrl: r.url,
    title: r.title || "Untitled",
    credit: {
      source: "Openverse",
      author: r.creator || "Unknown",
      sourceUrl: r.foreign_landing_url || r.url,
      license: ccLabel(r.license, r.license_version ?? ""),
      licenseUrl: r.license_url,
    },
  }));
}

interface UnsplashResult {
  id: string;
  description?: string | null;
  alt_description?: string | null;
  urls: { small: string; regular: string };
  links: { html: string; download_location?: string };
  user: { name: string; links: { html: string } };
}

async function searchUnsplash(query: string, key: string, signal: AbortSignal): Promise<StockResult[]> {
  const url = new URL("https://api.unsplash.com/search/photos");
  url.searchParams.set("query", query);
  url.searchParams.set("per_page", "20");
  url.searchParams.set("content_filter", "high");

  const res = await fetch(url.toString(), {
    signal,
    headers: { Authorization: `Client-ID ${key}`, "Accept-Version": "v1" },
  });
  if (res.status === 401) throw new Error("Unsplash rejected that access key.");
  if (!res.ok) throw new Error(`Unsplash returned ${res.status}`);
  const json = (await res.json()) as { results?: UnsplashResult[] };

  return (json.results ?? []).map((r) => ({
    id: r.id,
    thumbUrl: r.urls.small,
    fullUrl: r.urls.regular,
    title: r.description || r.alt_description || "Untitled",
    credit: {
      source: "Unsplash",
      author: r.user.name,
      sourceUrl: r.links.html,
      license: "Unsplash License",
      licenseUrl: "https://unsplash.com/license",
    },
  }));
}

export async function searchStock(source: StockSource, query: string, signal: AbortSignal): Promise<StockResult[]> {
  const q = query.trim();
  if (!q) return [];
  if (source === "unsplash") {
    const key = getUnsplashKey();
    if (!key) throw new Error("Add a free Unsplash access key to search Unsplash.");
    return searchUnsplash(q, key, signal);
  }
  return searchOpenverse(q, signal);
}

/**
 * Unsplash's API terms require a hit on the photo's `download_location` when a
 * photo is actually taken, so the photographer's download count is real. It is
 * fire-and-forget: a failure here must never block the import.
 */
export function pingUnsplashDownload(result: StockResult): void {
  if (result.credit.source !== "Unsplash") return;
  const key = getUnsplashKey();
  if (!key) return;
  void fetch(`https://api.unsplash.com/photos/${result.id}/download`, {
    headers: { Authorization: `Client-ID ${key}` },
  }).catch(() => {
    // Attribution telemetry, not the import — a failure changes nothing here.
  });
}

export interface ImportedImage {
  url: string;
  sizeKB: number;
  /**
   * True when the bytes were copied into the workspace. False means the host
   * refused a cross-origin read and the asset points at the remote URL
   * instead — still a working image, but one that depends on that host.
   */
  embedded: boolean;
}

const MAX_EDGE = 1600;
const JPEG_QUALITY = 0.82;

/** Re-encodes a fetched image down to a sane size for a web brand book. A raw
 *  stock photo is often 3–6 MB, and base64 inflates it by a further third —
 *  enough of them would exhaust the workspace's storage budget outright. */
async function downscale(blob: Blob): Promise<string> {
  const bitmap = await createImageBitmap(blob);
  try {
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no 2d context");
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
  } finally {
    bitmap.close();
  }
}

/**
 * Copies a remote image into the workspace as a self-contained data URL, so
 * the brand book keeps rendering even if the original host takes the file
 * down. Where the host blocks cross-origin reads there is nothing to copy, and
 * the caller is told so rather than being handed a silently broken asset.
 */
export async function importRemoteImage(url: string): Promise<ImportedImage> {
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) throw new Error(`${res.status}`);
    const blob = await res.blob();
    if (!blob.type.startsWith("image/")) throw new Error("not an image");
    const dataUrl = await downscale(blob);
    // A data: URL is ~4/3 the size of the bytes it carries, and that inflated
    // string is what actually gets stored — so that is what's reported.
    return { url: dataUrl, sizeKB: Math.round(dataUrl.length / 1024), embedded: true };
  } catch {
    return { url, sizeKB: 0, embedded: false };
  }
}

/** A filename for an imported image, since a stock URL rarely carries a useful one. */
export function stockFileName(title: string, source: string): string {
  const base =
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "image";
  return `${base}-${source.toLowerCase()}.jpg`;
}
