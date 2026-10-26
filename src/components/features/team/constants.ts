import type { TeamRole } from "@/types";

export const PAGE_SECTION = {
  en: "Team & history",
  ar: "الفريق والإصدارات",
} as const;

export const ROLES: TeamRole[] = ["owner", "editor", "viewer", "client"];

export const ROLE_TONE: Record<
  TeamRole,
  "accent" | "success" | "neutral" | "warning"
> = {
  owner: "accent",
  editor: "success",
  viewer: "neutral",
  client: "warning",
};
