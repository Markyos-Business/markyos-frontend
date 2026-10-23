import { ApiError, api } from "@/lib/api/client";
import { createLocalAdapter } from "@/lib/data/adapters/localAdapter";
import { inlineFiles } from "@/lib/data/adapters/serverFiles";
import type { AppState, Brief, ShareLink, Workspace } from "@/types";

/**
 * What a studio's clients open without an account: the published guideline
 * site, share links and discovery briefs, read from `/api/v1/public/`.
 *
 * The server strips everything only the studio should see (the gate
 * password, other links, drafts, keys) before any of it leaves, and checks
 * the site password itself. What comes back is shaped like the brand the
 * app already renders, so the pages need no second set of components.
 */

const local = createLocalAdapter();

/** A brand from the server as the app holds it: files inline, repaired. */
async function toWorkspace(brand: Partial<Workspace>, fileBase = ""): Promise<Workspace> {
  const inlined = await inlineFiles(brand as Workspace, fileBase);
  const [ws] = local.repairWorkspaces([inlined], { workspaces: [] } as unknown as AppState);
  return ws;
}

const notFound = (err: unknown) => err instanceof ApiError && err.status === 404;

export type PublicSite =
  | { status: "ok"; ws: Workspace }
  /** Password-protected; `cover` is enough to draw the gate in its colours. */
  | { status: "locked"; cover: Workspace }
  | { status: "not_published" }
  | { status: "missing" };

const unlockKey = (slug: string) => `markyos:site-unlock:${slug}`;

function readUnlock(slug: string): string {
  try {
    return window.sessionStorage.getItem(unlockKey(slug)) ?? "";
  } catch {
    return "";
  }
}

export async function fetchPublicSite(slug: string): Promise<PublicSite> {
  try {
    const { brand, fileBase } = await api<{ brand: Workspace; fileBase: string }>(
      `/public/sites/${encodeURIComponent(slug)}/`,
      { headers: { "X-Brand-Unlock": readUnlock(slug) } }
    );
    return { status: "ok", ws: { ...(await toWorkspace(brand, fileBase)), published: null } };
  } catch (err) {
    if (!(err instanceof ApiError)) throw err;
    const body = err.data as { code?: string; cover?: Partial<Workspace> } | null;
    if (err.status === 403 && body?.cover) return { status: "locked", cover: await toWorkspace(body.cover) };
    if (err.status === 404) return { status: body?.code === "not_published" ? "not_published" : "missing" };
    throw err;
  }
}

/**
 * Checks a site password on the server. True when it matched; the unlock is
 * kept for this tab, the same as the browser-only gate did.
 */
export async function unlockPublicSite(slug: string, password: string): Promise<boolean> {
  try {
    const { unlock } = await api<{ unlock: string }>(`/public/sites/${encodeURIComponent(slug)}/unlock/`, {
      method: "POST",
      body: { password },
    });
    try {
      window.sessionStorage.setItem(unlockKey(slug), unlock);
    } catch {
      // Without storage the unlock lasts until the page is reloaded.
    }
    return true;
  } catch (err) {
    if (err instanceof ApiError && err.status === 400) return false;
    throw err;
  }
}

export async function fetchShareLink(token: string): Promise<{ ws: Workspace; link: ShareLink } | null> {
  try {
    const { link, brand, fileBase } = await api<{ link: ShareLink; brand: Workspace; fileBase: string }>(
      `/public/share/${encodeURIComponent(token)}/`
    );
    return { link, ws: await toWorkspace(brand, fileBase) };
  } catch (err) {
    if (notFound(err)) return null;
    throw err;
  }
}

/** Only what the brief page shows of the brand. */
export interface BriefBrand {
  id: string;
  slug: string;
  name: string;
}

interface BriefResponse {
  brief: Brief;
  brand: BriefBrand;
}

export async function fetchBrief(token: string): Promise<{ brief: Brief; workspace: BriefBrand } | null> {
  try {
    const { brief, brand } = await api<BriefResponse>(`/public/briefs/${encodeURIComponent(token)}/`);
    return { brief, workspace: brand };
  } catch (err) {
    if (notFound(err)) return null;
    throw err;
  }
}

export async function saveBriefAnswer(token: string, questionKey: string, value: string): Promise<Brief> {
  const { brief } = await api<BriefResponse>(`/public/briefs/${encodeURIComponent(token)}/answers/`, {
    method: "PUT",
    body: { questionKey, value },
  });
  return brief;
}

export async function sendBrief(token: string): Promise<Brief> {
  const { brief } = await api<BriefResponse>(`/public/briefs/${encodeURIComponent(token)}/submit/`, {
    method: "POST",
  });
  return brief;
}
