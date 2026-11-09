import type { TeamRole } from "@/types";

export const PAGE_SECTION = {
  en: "Team & history",
  ar: "الفريق والإصدارات",
} as const;

export const ROLES: TeamRole[] = ["owner", "editor", "viewer", "client"];

/** A role as read: lower-case is how it is stored, not how it is said. */
export const ROLE_LABELS: Record<TeamRole, { en: string; ar: string }> = {
  owner: { en: "Owner", ar: "مالك" },
  editor: { en: "Editor", ar: "محرّر" },
  viewer: { en: "Viewer", ar: "مشاهد" },
  client: { en: "Client", ar: "عميل" },
};

export const ROLE_TONE: Record<TeamRole, "accent" | "success" | "neutral" | "warning"> = {
  owner: "accent",
  editor: "success",
  viewer: "neutral",
  client: "warning",
};
