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
  /** On the account's own page (GET /admin/users/<id>/) only: what it may have now. */
  limits?: AccountLimits;
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

/** Latest platform events; deleted accounts retain a subject but no link. */
export interface DashboardActivity extends Omit<AdminActivity, "kind"> {
  kind: AdminActivityKind | "removed";
  userId: string | null;
  subject: string;
}

// ---- Billing (billing epic 4.3): the admin billing tool. ----
// One place for the admin billing contract. Amounts are cents, times are ms.

export type AdminCheckoutProvider = "paypal" | "stripe" | "comp";

/** A row of `GET /admin/billing/checkouts/`: one checkout (subscription, pass or comp) of one brand. */
export interface AdminCheckout {
  id: string;
  /** Null once the brand was deleted. */
  brand: { id: string; name: string; slug: string } | null;
  owner: { id: string; email: string; name: string } | null;
  provider: AdminCheckoutProvider;
  plan: string;
  /** Our status, lower case, as stored. */
  status: string;
  amount: number | null;
  currency: string;
  subscriptionId: string | null;
  paidAt: number | null;
  currentPeriodEnd: number | null;
  paymentFailedAt: number | null;
  /** PayPal's terms didn't match ours: it grants nothing. */
  refused: boolean;
  createdAt: number;
}

export interface AdminCheckoutPage {
  count: number;
  results: AdminCheckout[];
}

export interface AdminCheckoutQuery {
  q?: string;
  status?: string;
  provider?: string;
  page?: number;
}

/** One payment PayPal reported on a checkout. */
export interface AdminPayment {
  id: string;
  kind: "sale" | "refund" | "reversal" | "dispute";
  amount: number;
  currency: string;
  state: string;
  occurredAt: number;
}

/** What PayPal says about the subscription right now. */
export interface AdminPaypalView {
  status: string;
  nextBillingAt: number | null;
  lastPaymentAt: number | null;
  lastPaymentAmount: number | null;
  failedPayments: number;
}

/** `GET /admin/billing/checkouts/<id>/`. */
export interface AdminCheckoutDetail extends AdminCheckout {
  payments: AdminPayment[];
  cancelReason: string | null;
  cancelNote: string | null;
  /** Null for comps, Stripe rows, or when PayPal couldn't be read. */
  paypal: AdminPaypalView | null;
  /** Our status and PayPal's disagree: the server decides, the page only says so. */
  mismatch: boolean;
}

/** A row of `GET /admin/billing/orphans/`: a PayPal subscription with no live checkout behind it. */
export interface AdminOrphan {
  subscriptionId: string;
  /** The checkout it once belonged to, if any. */
  checkout: string | null;
  workspaceId: string | null;
  paypalStatus: string;
  moneyTaken: boolean;
  firstSeenAt: number;
  alertedAt: number | null;
  cancelledAt: number | null;
}

/** A row of `GET /admin/billing/audit/`: one admin billing action, with why. */
export interface AdminAuditEntry {
  id: string;
  actor: { email: string } | null;
  action: string;
  target: string;
  reason: string;
  createdAt: number;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
}

export interface AdminAuditPage {
  count: number;
  results: AdminAuditEntry[];
}

/** `POST /admin/billing/comps/`: a plan at no charge until `expiresAt`. */
export interface AdminCompRequest {
  brandId: string;
  reason: string;
  expiresAt: number;
}

/** An account's limits: a number, or null for unlimited. `override` is set when an admin changed them. */
export interface AccountLimits {
  brands: number | null;
  editors: number | null;
  override: boolean;
}

/** One limit as sent: a number, null for unlimited, "default" to clear the override. */
export type LimitInput = number | null | "default";
