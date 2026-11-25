import type { TeamRole, Workspace } from "@/types";

/** Discovery/call notes and analysis follow the backend's CAN_READ roles. */
const INTERNAL_BRAND_SECTIONS = new Set(["discovery", "forms", "analysis", "brief"]);

/** Shared by the sidebar and workspace shell, including nested and old URLs. */
export function canOpenBrandPage(role: TeamRole | null, pathname: string, slug: string) {
  if (!role) return false;
  const base = `/w/${slug}`;
  if (pathname !== base && !pathname.startsWith(`${base}/`)) return false;
  const section = pathname.slice(base.length).split("/")[1] ?? "";
  return role !== "client" || !INTERNAL_BRAND_SECTIONS.has(section);
}

/**
 * The client's link to the published site, only while the server says the
 * link serves it (`live`: a paid plan, or the account's free site since
 * 25 Nov 2026). Without the server's word (the offline demo, an older
 * server) a paid plan is still the rule. Passwords remain enforced by the viewer.
 */
export function publishedGuidelineHref(workspace: Workspace): string | null {
  const live = workspace.live ?? workspace.billing.plan !== "free";
  return workspace.published && live ? `/v/${workspace.slug}` : null;
}
