/**
 * Which uploaded files belong to which derived section of the guideline site.
 *
 * These live outside the components because two places need the same answer and
 * must not be able to disagree: `useGuidelineViewer` asks whether a section has
 * anything to show (and so whether it exists at all), and the section body asks
 * what to draw. A section that appears in the contents and then renders an empty
 * grid is the failure a second copy of this filter produces.
 */

import { Asset, SocialLink, Workspace } from "@/core/data/types";

/** Repeating artwork — a tile meant to be laid edge to edge. */
export function patternAssets(ws: Workspace): Asset[] {
  return ws.assets.filter((a) => a.type === "pattern");
}

/**
 * Supporting artwork that isn't a pattern, a photograph or an icon —
 * illustrations and one-off graphics.
 *
 * These asset types were uploadable from the Visual identity page and then
 * appeared on no client-facing section at all, which made them a file store
 * with no output. They share the Pattern section rather than getting one of
 * their own: a reader looking for "the brand's drawn artwork" is looking in one
 * place, not three.
 */
export function graphicAssets(ws: Workspace): Asset[] {
  return ws.assets.filter((a) => a.type === "graphic" || a.type === "illustration");
}

/**
 * The brand's social accounts, as the studio actually entered them.
 *
 * Read off the authored `socialLinks` blocks rather than guessed from the
 * workspace slug. A handle invented from a slug is a plausible-looking lie: it
 * renders as if the brand owns that account, and a client copying it out of
 * their own guideline has no way to know it was made up.
 */
export function brandSocialLinks(ws: Workspace): SocialLink[] {
  const seen = new Set<string>();
  return [...ws.customBlocks, ...ws.pages.flatMap((p) => p.blocks)]
    .filter((b) => b.kind === "socialLinks")
    .flatMap((b) => b.socialLinks ?? [])
    .filter((l) => {
      const key = `${l.platform}|${l.url}`.toLowerCase();
      if (!l.url.trim() || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

/**
 * The account name a profile preview should show, taken from the link itself.
 *
 * The last meaningful path segment of a profile URL is the handle on every
 * platform that has one, so this reads what the studio typed rather than
 * inventing anything. A URL with no path (a bare domain) yields nothing, and
 * the preview simply shows no handle.
 */
export function handleFromUrl(url: string): string {
  try {
    const path = new URL(url.startsWith("http") ? url : `https://${url}`).pathname;
    const last = path.split("/").filter(Boolean).pop();
    return last ? `@${last.replace(/^@/, "")}` : "";
  } catch {
    return "";
  }
}
