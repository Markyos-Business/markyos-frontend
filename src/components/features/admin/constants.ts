import { ACCOUNT_TYPES, ACCOUNT_TYPE_KEYS } from "@/constants/accountTypes";
import type { BadgeTone } from "@/components/ui";
import type { AdminUserStatus } from "./types";

/** Account types, as the dashboard breakdown names them; admins have none. */
export const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  ...Object.fromEntries(ACCOUNT_TYPE_KEYS.map((key) => [key, ACCOUNT_TYPES[key].label])),
  none: "No type (admins)",
};

/** A user's status dot; the word beside it says the same. */
export const STATUS_TONE: Record<AdminUserStatus, BadgeTone> = {
  active: "success",
  waiting: "warning",
  deactivated: "danger",
};

export const STAGE_LABELS: Record<string, string> = {
  discovery: "Discovery",
  strategy: "Strategy",
  design: "Design",
  review: "Review",
  delivered: "Delivered",
  live: "Live",
  none: "No stage",
};

export const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  subscription: "Subscription",
  pass: "One-time pass",
};

/** The admin sidebar, in both languages. Each new admin page adds its link here. */
export const ADMIN_NAV = [
  {
    key: "overview",
    label: { en: "Overview", ar: "نظرة عامة" },
    items: [{ key: "dashboard", label: { en: "Dashboard", ar: "لوحة المعلومات" }, icon: "chart-line", href: "/admin" }],
  },
  {
    key: "manage",
    label: { en: "Manage", ar: "الإدارة" },
    items: [{ key: "users", label: { en: "Users", ar: "المستخدمون" }, icon: "users", href: "/admin/users" }],
  },
];

/** The admin shell's own words. */
export const SHELL_COPY = {
  en: { area: "Admin", back: "Back to studio", language: "Interface language" },
  ar: { area: "الإدارة", back: "العودة إلى الاستوديو", language: "لغة الواجهة" },
} as const;

/** Brand stages in the order a brand moves through them. */
export const STAGE_ORDER = ["discovery", "strategy", "design", "review", "delivered", "live"];

/** What each role may do, for the read-only Permissions tab. Keys are the copy's `permissions.items`. */
export const ROLE_PERMISSIONS = {
  ownBrands: { admin: true, member: true },
  adminArea: { admin: true, member: false },
  seeAccounts: { admin: true, member: false },
  invite: { admin: true, member: false },
  changeRoles: { admin: true, member: false },
  removeAccounts: { admin: true, member: false },
} as const;

/** The account page's tabs, in order. */
export const USER_TABS = ["overview", "activity", "permissions", "sessions"] as const;
