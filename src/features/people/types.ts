import type { TeamRole } from "@/types";

/** A role someone can hold on a brand they don't own. Ownership moves only by a transfer, on the brand's own team page. */
export type MemberRole = Exclude<TeamRole, "owner">;

/** One brand a person is on, and as what. */
export interface PersonBrand {
  workspaceId: string;
  brandName: string;
  slug: string;
  /** Their entry in that brand's team, for changing or removing it. */
  memberId: string;
  role: MemberRole;
}

/** Someone on at least one of your brands, across all of them. */
export interface Person {
  /** Lower-cased: one person, however each brand spelled their address. */
  email: string;
  name: string;
  brands: PersonBrand[];
}
