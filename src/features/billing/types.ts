import type { AccountType } from "@/types";

/** GET /billing/plans/: what Markyos sells, from the backend (billing epic 2.1). */
export type Plans = {
  currency: string;
  interval: "month";
  perBrand: true;
  /** A brand without a plan: how many an account may own, and its editors. */
  free: { brands: number; editors: number | null };
  /** False where the staging switch lifts the Free rules. */
  freeRulesApply: boolean;
  types: Record<AccountType, { monthly: number; limits: { brands: number | null; editors: number | null } }>;
};

/** Why the upgrade modal opened: each paywall moment says what it unlocks. */
export type UpgradeReason = "publish" | "badge" | "editor" | "brand_limit" | "billing";
