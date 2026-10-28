import { ACCOUNT_TYPES, ACCOUNT_TYPE_KEYS } from "@/constants/accountTypes";
import type { AccountRole } from "@/types";

type Tone = "neutral" | "accent" | "success" | "warning" | "danger";

export const ROLE_LABELS: Record<AccountRole, string> = {
  admin: "Admin",
  member: "Member",
};

export const ROLE_TONES: Record<AccountRole, Tone> = {
  admin: "accent",
  member: "neutral",
};

/** Account types, as the dashboard breakdown names them; admins have none. */
export const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  ...Object.fromEntries(ACCOUNT_TYPE_KEYS.map((key) => [key, ACCOUNT_TYPES[key].label])),
  none: "No type (admins)",
};

export const STATUS_LABELS = { active: "Active", inactive: "Deactivated" } as const;

export const STATUS_TONES: Record<keyof typeof STATUS_LABELS, Tone> = {
  active: "success",
  inactive: "danger",
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

export const BRAND_ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  editor: "Editor",
  viewer: "Viewer",
  client: "Client",
};

export const ORDERINGS = [
  { value: "-created_at", label: "Newest" },
  { value: "created_at", label: "Oldest" },
  { value: "-last_login", label: "Last active" },
  { value: "email", label: "Email A–Z" },
] as const;

/** The admin sidebar. Each new admin page adds its link here. */
export const ADMIN_NAV = [
  {
    key: "overview",
    label: "Overview",
    items: [{ key: "dashboard", label: "Dashboard", icon: "chart-line", href: "/admin" }],
  },
  {
    key: "manage",
    label: "Manage",
    items: [{ key: "users", label: "Users", icon: "users", href: "/admin/users" }],
  },
];

/** Brand stages in the order a brand moves through them. */
export const STAGE_ORDER = ["discovery", "strategy", "design", "review", "delivered", "live"];

/** Accounts per page on the users list. */
export const PAGE_SIZE = 25;

/** The users table; narrower screens drop the less useful columns. */
export const USER_COLUMNS = [
  { key: "person", label: "Person" },
  { key: "type", label: "Type" },
  { key: "role", label: "Role", className: "hidden sm:table-cell" },
  { key: "status", label: "Status" },
  { key: "brands", label: "Brands", className: "hidden md:table-cell" },
  { key: "joined", label: "Joined", className: "hidden lg:table-cell" },
  { key: "last", label: "Last signed in", className: "hidden lg:table-cell" },
];
