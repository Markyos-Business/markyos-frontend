import { API_URL } from "./client";

type PublicBadgeSurface = "form" | "analysis" | "share" | "guide";

type PublicBadge = {
  show: boolean;
  pageType: "form" | "moodboard" | "guide" | "other";
  pageId: string;
  workspaceId: string;
  locale: "ar" | "en";
};

/**
 * The backend's answer for one public page: does it carry the "Made with
 * Markyos" badge? Asked on the server while the page renders, so a paid
 * page's HTML never contains it. Never cached: an upgrade (or a lapse back
 * to free) shows on the next view. Without an answer (no API, an error) the
 * badge stays off: a paid page must never wrongly carry it.
 */
async function getPublicBadge(surface: PublicBadgeSurface, token: string): Promise<PublicBadge | null> {
  if (!API_URL) return null;
  try {
    const res = await fetch(`${API_URL}/public/badge/${surface}/${encodeURIComponent(token)}/`, { cache: "no-store" });
    return res.ok ? ((await res.json()) as PublicBadge) : null;
  } catch {
    return null;
  }
}

export { getPublicBadge };
export type { PublicBadge, PublicBadgeSurface };
