import type { TagTone } from "@/components/ui";
import type { MemberRole } from "./types";

export const MEMBER_ROLES: MemberRole[] = ["editor", "viewer", "client"];

export const ROLE_TONE: Record<MemberRole, TagTone> = {
  editor: "success",
  viewer: "neutral",
  client: "warning",
};

/** At most this many emails in one invite. */
export const MAX_INVITES = 20;
