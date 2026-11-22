import type { AccountType, Billing } from "@/types";

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
export type UpgradeReason = "publish" | "badge" | "editor" | "brand_limit" | "billing" | "resume";

/** Why an owner cancels (POST /billing/paypal/cancel/). */
export const CANCEL_REASONS = ["too_expensive", "not_using", "missing_feature", "switching", "other"] as const;
export type CancelReason = (typeof CANCEL_REASONS)[number];
/** The longest note the server keeps with a cancellation. */
export const CANCEL_NOTE_MAX = 500;

/** The brand's latest subscription as the server describes it; amounts in cents, times in ms. */
export type BrandSubscription = {
  provider: "paypal" | "stripe";
  status: string;
  amount: number | null;
  currency: string;
  nextChargeAt: number | null;
  accessUntil: number | null;
  /** Masked by the server, e.g. "n***@gmail.com". */
  payerEmail: string | null;
  paymentFailedAt: number | null;
  graceEndsAt: number | null;
  cancelledAt: number | null;
  cancelReason: string | null;
  /** When a resumed plan would first charge (filled whenever resume is allowed, and once a resume is queued). */
  resumeStartsAt: number | null;
  /** Reactivated or suspended after the grace, and PayPal hasn't collected yet: the brand stays on Free until it does. */
  awaitingPayment?: boolean;
};

/** What the owner may do now; the app shows only these. */
export type BillingActions = {
  subscribe: boolean;
  cancel: boolean;
  resume: boolean;
  reactivate: boolean;
  /** PayPal's page for changing the card or account it charges. */
  updatePaymentUrl: string | null;
};

export type BillingHistoryItem = {
  id: string;
  kind: "sale" | "refund" | "reversal" | "dispute";
  amount: number;
  currency: string;
  state: string;
  occurredAt: number;
};

/** GET /billing/brands/<id>/ (owner only). */
export type BrandBillingAnswer = {
  billing: Billing;
  subscription: BrandSubscription | null;
  actions: BillingActions;
  history: BillingHistoryItem[];
};
