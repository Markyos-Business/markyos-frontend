import type { AccountRole, AccountType } from "@/types";

/** Where an account stands: taken up, switched off, or not taken up yet. */
export type AdminUserStatus = "active" | "deactivated" | "waiting";

/** Counts by status, as now or as a month ago. */
export interface AdminStatusCounts {
  /** Active and deactivated: accounts people have taken up. */
  total: number;
  active: number;
  pending: number;
  deactivated: number;
}

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
    deactivated: number;
    /** Active admins, superusers included: the last one can't be removed. */
    activeAdmins: number;
    now: AdminStatusCounts;
    /** Accounts that existed 30 days ago, in their state now. */
    monthAgo: AdminStatusCounts;
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
  status: AdminUserStatus;
  /** The interface language they chose; null follows the open brand. */
  language: "en" | "ar" | null;
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
  status?: AdminUserStatus | "";
  language?: "en" | "ar" | "none" | "";
  /** ISO dates, inclusive. */
  lastActiveFrom?: string;
  lastActiveTo?: string;
  ordering?: string;
  page?: number;
  pageSize?: number;
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

/** `POST /admin/users/`: someone new, waiting for the emailed link. */
export interface AdminInvite {
  email: string;
  name?: string;
  role: AccountRole;
  accountType: AccountType | null;
  language: "en" | "ar" | null;
}

/** A row of `GET /admin/users/<id>/sessions/`: one signed-in browser. */
export interface AdminSession {
  id: string;
  browser: string | null;
  os: string | null;
  mobile: boolean;
  ip: string | null;
  createdAt: string;
  lastSeenAt: string;
  expiresAt: string;
}

/** What `GET /admin/users/<id>/activity/` can say happened. */
export type AdminActivityKind =
  | "joined"
  | "verified"
  | "password_changed"
  | "signed_in"
  | "brand_created"
  | "invited"
  | "invite_resent"
  | "role_changed"
  | "type_changed"
  | "deactivated"
  | "reactivated"
  | "signed_out"
  | "session_ended";

export interface AdminActivity {
  id: string;
  kind: AdminActivityKind;
  at: string;
  /** By kind: `by` (the admin), `from`/`to`, `brand`, `browser`/`os`/`ip`. */
  detail: Record<string, string | boolean | number | null>;
}

export type AdminBulkAction = "deactivate" | "reactivate" | "role" | "remove";

/** `POST /admin/users/bulk/`: which went through, and why the rest didn't. */
export interface AdminBulkResult {
  done: string[];
  refused: { id: string; email: string; detail: string }[];
}
