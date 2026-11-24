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
  /** Which PayPal app the server bills through; the button must load the same one (billing epic 4.2). */
  paypal?: { clientId: string | null; env: "sandbox" | "live" };
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
  /** "comp": a plan an admin gave, with nothing to manage. */
  provider: "paypal" | "stripe" | "comp";
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
  /** D2: the owner's account type changed; the price moves to it at renewal. */
  pendingPlanChange?: PendingPlanChange | null;
  /** A promo code's discount on this subscription, while it lasts. */
  discount?: SubscriptionDiscount | null;
};

export type PendingPlanChange = {
  accountType: AccountType;
  /** Cents a month, in the subscription's currency. */
  amount: number;
  effectiveAt: number | null;
  /** Set when PayPal asks the owner to approve the new price. */
  approvalUrl: string | null;
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

/*
 * Promo codes (docs/promo-codes-plan.md §4): the one place the app's types for
 * the promo endpoints live. The server makes the codes and works out every
 * price; the app shows its answers. Amounts in cents, times in ms.
 */

/** Why the server refused a code (POST /billing/codes/check/ 400 `code`). */
export const PROMO_REFUSALS = ["expired", "used_up", "wrong_type", "not_first_purchase", "inactive", "unknown"] as const;
export type PromoRefusal = (typeof PROMO_REFUSALS)[number];

/** POST /billing/codes/check/ 200: the terms for this brand. `months` null = for as long as the plan runs. */
export type PromoTerms = {
  code: string;
  label: string;
  firstAmount: number;
  regularAmount: number;
  months: number | null;
  currency: string;
};

/** The billing summary's `subscription.discount`. `until` null = for as long as the plan runs. */
export type SubscriptionDiscount = {
  code: string;
  label: string;
  /** Cents a month while the discount lasts. */
  amount: number;
  until: number | null;
  /** Cents a month once it ends; when left out, the subscription's own amount. */
  regularAmount?: number | null;
};

export const PROMO_DURATIONS = ["once", "repeating", "forever"] as const;
export type PromoDuration = (typeof PROMO_DURATIONS)[number];

export const PROMO_STATUSES = ["active", "used_up", "expired", "disabled"] as const;
export type PromoStatus = (typeof PROMO_STATUSES)[number];

/** POST admin/billing/codes/generate/. Exactly one of percentOff / amountOff. */
export type PromoGenerateRequest = {
  count: number;
  /** Null = unlimited. */
  usesPerCode: number | null;
  percentOff?: number;
  /** Cents. */
  amountOff?: number;
  duration: PromoDuration;
  months?: number;
  expiresAt?: number;
  accountTypes?: AccountType[];
  firstPurchaseOnly: boolean;
  note: string;
};

export type PromoBatch = {
  id: string;
  note?: string;
  createdAt?: number;
};

export type PromoGenerateAnswer = { batch: PromoBatch; codes: { id: string; code: string }[] };

/** One code in the admin list. The discount's own fields, when sent, let the app word it in Arabic too. */
export type PromoCodeRow = {
  id: string;
  code: string;
  batchId: string;
  label: string;
  uses: number;
  /** Null = unlimited. */
  maxUses: number | null;
  status: PromoStatus;
  expiresAt: number | null;
  createdAt: number;
  percentOff?: number | null;
  amountOff?: number | null;
  duration?: PromoDuration;
  months?: number | null;
  currency?: string;
};

export type PromoCodePage = { count: number; results: PromoCodeRow[] };

export type PromoRedemption = {
  brand: { id: string; name: string } | null;
  owner: { id: string; email: string; name?: string } | null;
  createdAt: number;
  /** reserved / active / released, as the server words it. */
  status: string;
  /** Cents a month the brand pays now, or null. */
  payingNow: number | null;
  currency?: string;
};

export type PromoCodeDetail = PromoCodeRow & {
  redemptions: PromoRedemption[];
  note?: string;
  firstPurchaseOnly?: boolean;
  accountTypes?: AccountType[] | null;
  audit?: { id: string; action: string; reason: string; createdAt: number; actor?: { email: string; name?: string } | null }[];
};

export type PromoCodeQuery = { batch?: string; status?: string; page?: number };
