import type { AccountRole, AccountType, Lang } from "@/types";

/** The account as the backend sends it (`AccountSerializer`). */
export interface ApiAccount {
  id: string;
  name: string;
  email: string;
  adminLang: Lang | null;
  createdAt: string;
  lastLoginAt: string | null;
  passwordUpdatedAt: string | null;
  role: AccountRole;
  accountType: AccountType | null;
  isAdmin: boolean;
  avatarUrl: string | null;
  twoFactorEnabled: boolean;
}

export interface Strength {
  /** 0–4. */
  score: number;
  label: string;
  /** The single most useful thing to do next, or null when it's strong. */
  advice: string | null;
}

/** Where the reset flow is. */
export type ResetStep = "request" | "sent" | "confirm";
