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

/** Why the server refused a code: `reason` of a check, or `code` of a refused start. */
export const PROMO_REFUSALS = ["expired", "used_up", "wrong_type", "not_first_purchase", "inactive", "already_redeemed", "unknown"] as const;
export type PromoRefusal = (typeof PROMO_REFUSALS)[number];

export const PROMO_DURATIONS = ["once", "repeating", "forever"] as const;
export type PromoDuration = (typeof PROMO_DURATIONS)[number];

/** A batch's discount: `value` is a percent, or cents for `amount`; `months` is 1 for once, null for forever. */
export type PromoDiscount = {
  kind: "percent" | "amount";
  value: number;
  duration: PromoDuration;
  months: number | null;
};

/** POST /billing/codes/check/: always 200, valid or not. */
export type PromoCheckAnswer =
  | { valid: false; reason: string }
  | {
      valid: true;
      code: string;
      label: string;
      terms: { discount: PromoDiscount; currency: string; amount: number; regularAmount: number; months: number | null };
    };

/** An accepted code's terms for this brand, as the modal holds them. `months` null = for as long as the plan runs. */
export type PromoTerms = { code: string; label: string } & Extract<PromoCheckAnswer, { valid: true }>["terms"];

/** The billing summary's `subscription.discount`, while it lasts. `until` null = for as long as the plan runs. */
export type SubscriptionDiscount = {
  code: string;
  label: string;
  /** Cents a month while the discount lasts. */
  amount: number;
  until: number | null;
  /** Cents a month once it ends. */
  regularAmount: number | null;
  discount: PromoDiscount;
};

export const PROMO_STATUSES = ["active", "used_up", "expired", "disabled"] as const;
export type PromoStatus = (typeof PROMO_STATUSES)[number];

/** POST admin/billing/codes/generate/. */
export type PromoGenerateRequest = {
  count: number;
  /** Null = unlimited. */
  usesPerCode: number | null;
  /** `value`: a percent, or cents for `amount`. */
  discount: { kind: "percent" | "amount"; value: number };
  duration: { kind: PromoDuration; months?: number };
  expiresAt?: number;
  accountTypes?: AccountType[];
  firstPurchaseOnly: boolean;
  note: string;
};

export type PromoPerson = { id: string; email: string; name?: string | null };

/** A batch: the settings its codes share. */
export type PromoBatch = {
  id: string;
  note: string;
  label: string;
  discount: PromoDiscount;
  usesPerCode: number | null;
  expiresAt: number | null;
  accountTypes: AccountType[];
  firstPurchaseOnly: boolean;
  codes: number;
  createdAt: number;
  createdBy: PromoPerson | null;
  disabledAt: number | null;
};

/** One code in the admin list. */
export type PromoCodeRow = {
  id: string;
  code: string;
  batchId: string;
  /** English; the app words the discount itself from `discount`. */
  label: string;
  discount: PromoDiscount;
  /** `limit` null = unlimited; `reserved` are checkouts not yet paid. */
  uses: { used: number; reserved: number; limit: number | null };
  status: PromoStatus;
  expiresAt: number | null;
  createdAt: number;
  disabledAt: number | null;
};

export type PromoGenerateAnswer = { batch: PromoBatch; codes: PromoCodeRow[] };

export type PromoCodePage = { count: number; results: PromoCodeRow[] };

export type PromoRedemption = {
  id: string;
  /** reserved / active / ended / released. */
  status: string;
  brand: { id: string; name: string; slug: string } | null;
  owner: PromoPerson | null;
  checkoutId: string;
  subscriptionStatus: string;
  reservedAt: number | null;
  activatedAt: number | null;
  releasedAt: number | null;
  endedAt: number | null;
  endReason: string | null;
  /** Cents a month now, and until when the discounted price lasts (null when it isn't discounted now, or forever). */
  paysNow: { amount: number | null; currency: string; until: number | null };
};

export type PromoAuditEntry = { id: string; action: string; actor: PromoPerson | null; reason: string | null; createdAt: number };

export type PromoCodeDetail = PromoCodeRow & {
  batch: PromoBatch;
  redemptions: PromoRedemption[];
  audit: PromoAuditEntry[];
};

export type PromoCodeQuery = { batch?: string; status?: string; page?: number };
