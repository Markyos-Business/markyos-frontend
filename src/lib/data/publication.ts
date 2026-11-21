import type { Workspace } from "@/types";

/*
 * Is a brand's guideline site live, and may it go live?
 *
 * The server decides both (a published copy, and a paid plan or staging's
 * switch) and sends them as `live` and `canGoLive`. "Published" in the
 * builder and the sidebar's dot read these, so they can't claim a site the
 * public link won't show. The offline demo has no server: there, a local
 * publish is live and anything may go live.
 */
export const isLive = (ws: Pick<Workspace, "live" | "publishedAt">): boolean => ws.live ?? !!ws.publishedAt;

export const canGoLive = (ws: Pick<Workspace, "canGoLive">): boolean => ws.canGoLive ?? true;

/** Published, but the public link doesn't serve it (no paid plan). */
export const publishedButNotLive = (ws: Pick<Workspace, "live" | "publishedAt">): boolean => !!ws.publishedAt && !isLive(ws);
