import type { AccountRole, AccountType } from "@/types";

/** `GET /admin/stats/`. */
export interface AdminStats {
  users: {
    /** Accounts people have taken up: a password set, or Google. */
    total: number;
    /** Invited, or signed up, and not through the emailed link yet. */
    pending: number;
    active: number;
    admins: number;
    new7d: number;
    new30d: number;
    activeLast30d: number;
    /** Studios, freelancers and companies; admins under "none". */
    byType: Record<string, number>;
  };
  signups: { date: string; count: number }[];
  brands: {
    total: number;
    shared: number;
    byStage: Record<string, number>;
    byPlan: Record<string, number>;
  };
  members: { total: number; people: number };
}

/** A row of `GET /admin/users/`. */
export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AccountRole;
  accountType: AccountType | null;
  isAdmin: boolean;
  isActive: boolean;
  isSuperuser: boolean;
  twoFactorEnabled: boolean;
  avatarUrl: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  brandsOwned: number;
  brandsMember: number;
}

export interface AdminUserPage {
  count: number;
  next: string | null;
  previous: string | null;
  results: AdminUser[];
}

export interface AdminUserQuery {
  search?: string;
  role?: AccountRole | "";
  accountType?: AccountType | "";
  isActive?: "true" | "false" | "";
  ordering?: string;
  page?: number;
}

/** What an admin may change on an account. */
export type AdminUserPatch = Partial<Pick<AdminUser, "role" | "isActive" | "accountType">>;

/** A row of `GET /admin/users/<id>/brands/`. */
export interface AdminUserBrand {
  id: string;
  name: string;
  slug: string;
  stage: string;
  role: "owner" | "editor" | "viewer" | "client";
  updatedAt: string;
}
