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

/** A published snapshot still needs a paid brand plan; passwords remain enforced by the viewer. */
export function publishedGuidelineHref(workspace: Workspace): string | null {
  return workspace.published && workspace.billing.plan !== "free" ? `/v/${workspace.slug}` : null;
}
