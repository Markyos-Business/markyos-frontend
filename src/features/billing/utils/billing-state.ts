import type { BadgeTone } from "@/components/ui";
import type { Billing } from "@/types";
import type { BrandBillingAnswer, BrandSubscription, PendingPlanChange } from "../types";

/*
 * How the server's billing reads on screen. Pure mapping only: nothing here
 * decides a plan, a price or a date, it names what the server returned.
 */

export type StatusKey = "active" | "pending" | "paymentFailed" | "awaitingPayment" | "suspended" | "cancelled" | "ended" | "none";

const ENDED = ["cancelled", "canceled"];

/** The badge on the Billing tab: the subscription's status, or "No plan". */
export function statusOf(billing: Billing, subscription: BrandSubscription | null, now: number): StatusKey {
  const status = (subscription?.status ?? billing.subscriptionStatus ?? "").toLowerCase();
  const paid = billing.plan !== "free";
  if (!status) return paid ? "active" : "none";
  if (subscription?.awaitingPayment) return "awaitingPayment";
  if (inGrace(billing, subscription, now) && (status === "active" || status === "suspended")) return "paymentFailed";
  if (status === "active" || status === "trialing") return "active";
  if (["approval_pending", "approved", "pending", "incomplete"].includes(status)) return "pending";
  if (["suspended", "past_due", "unpaid"].includes(status)) return "suspended";
  if (ENDED.includes(status)) return paid ? "cancelled" : "ended";
  if (status === "expired" || status === "incomplete_expired") return "ended";
  return paid ? "active" : "ended";
}

export const STATUS_TONE: Record<StatusKey, BadgeTone> = {
  active: "success",
  pending: "warning",
  paymentFailed: "warning",
  awaitingPayment: "warning",
  suspended: "danger",
  cancelled: "neutral",
  ended: "neutral",
  none: "neutral",
};

/** A renewal failed and the 7-day grace (D6) is still running. */
export function inGrace(billing: Billing, subscription: BrandSubscription | null, now: number): boolean {
  const failed = subscription?.paymentFailedAt ?? billing.paymentFailedAt;
  const ends = subscription?.graceEndsAt ?? billing.graceEndsAt;
  return Boolean(failed && ends && ends > now);
}

/** The failed-payment banner in the brand area: the brand's billing only (no extra request per page). */
export function failureBannerDue(billing: Billing | undefined, now: number): billing is Billing & { graceEndsAt: number } {
  return Boolean(billing?.paymentFailedAt && billing.graceEndsAt && billing.graceEndsAt > now);
}

/** Grace ran out: the server suspended the plan and the brand is on Free. */
export function suspendedToFree(billing: Billing): boolean {
  return billing.plan === "free" && billing.subscriptionStatus === "suspended";
}

/** PayPal statuses that can still charge someone: the server refuses a transfer on these (D4). */
const STILL_BILLING = ["approved", "active", "suspended", "refused"];

/**
 * Ownership can't move while a PayPal subscription can still charge, whatever
 * the plan (a suspended one on Free included), unless it's cancelled. The
 * same rule as the server's; retired Stripe plans never block.
 */
export function transferBlocked(billing: Billing | undefined): boolean {
  return billing?.provider === "paypal" && STILL_BILLING.includes(billing.subscriptionStatus ?? "");
}

/** A plan bought before PayPal (a Stripe subscription or a Project Pass): shown, never managed here. */
export function isLegacy(billing: Billing, subscription: BrandSubscription | null): boolean {
  return subscription?.provider === "stripe" || billing.plan === "pass";
}

/** A plan an admin gave: shown with its end date, never managed by the owner. */
export function isComp(billing: Billing, subscription: BrandSubscription | null): boolean {
  return subscription?.provider === "comp" || billing.provider === "comp";
}

/** When a comp ends: the server's date only. */
export function compUntil(billing: Billing, subscription: BrandSubscription | null): number | null {
  return billing.paidUntil ?? subscription?.accessUntil ?? billing.currentPeriodEnd ?? null;
}

/** When a resumed plan first charges: the server's date, else when the paid month ends. */
export function resumeDate(subscription: BrandSubscription | null): number | null {
  return subscription?.resumeStartsAt ?? subscription?.accessUntil ?? null;
}

/** When a cancelled plan's access ends: the server's date, never a guess. */
export function accessEndsAt(billing: Billing, subscription: BrandSubscription | null): number | null {
  return subscription?.accessUntil ?? subscription?.nextChargeAt ?? billing.paidUntil ?? billing.currentPeriodEnd ?? null;
}

export type HistoryStateKey = "completed" | "pending" | "refunded" | "reversed" | "failed" | "open" | "other";

/** A payment's state from PayPal, as a word and a tone. */
export function historyState(state: string): { key: HistoryStateKey; tone: BadgeTone } {
  const s = state.toLowerCase();
  if (["completed", "succeeded", "paid", "resolved", "won"].includes(s)) return { key: "completed", tone: "success" };
  if (["pending", "processing", "under_review"].includes(s)) return { key: "pending", tone: "warning" };
  if (["refunded", "partially_refunded"].includes(s)) return { key: "refunded", tone: "neutral" };
  if (["reversed", "lost"].includes(s)) return { key: "reversed", tone: "danger" };
  if (["denied", "failed", "declined", "voided"].includes(s)) return { key: "failed", tone: "danger" };
  if (["open", "waiting_for_buyer_response", "waiting_for_seller_response"].includes(s)) return { key: "open", tone: "attention" };
  return { key: "other", tone: "neutral" };
}

export type BillingBanner = "grace" | "awaitingPayment" | "suspended" | "cancelled" | "queued";
export type BillingButton = "subscribe" | "resume" | "reactivate" | "updatePayment" | "cancel";

/** What the Billing tab shows for one server answer: which banner, which dates, which buttons. */
export type BillingView = {
  status: StatusKey;
  banner: BillingBanner | null;
  legacy: boolean;
  /** A complimentary plan: "Complimentary plan until <date>" and no actions. */
  comp: boolean;
  compUntil: number | null;
  /** D2: the price moves to the new account type at renewal (and may need approving at PayPal). */
  pendingChange: PendingPlanChange | null;
  /** "No plan. Subscribe to put it live": only for a brand with nothing running. */
  showFreeBody: boolean;
  nextChargeAt: number | null;
  accessUntil: number | null;
  resumesOn: number | null;
  /** In the plan card; the banner carries Update payment (grace) or Reactivate (suspended) itself. */
  buttons: BillingButton[];
  bannerAction: "updatePayment" | "reactivate" | null;
};

const QUEUED = ["active", "approved", "approval_pending"];

export function billingView(answer: BrandBillingAnswer, now: number): BillingView {
  const { billing, subscription: sub, actions } = answer;
  const status = statusOf(billing, sub, now);
  const legacy = isLegacy(billing, sub);
  const comp = isComp(billing, sub);
  const awaiting = Boolean(sub?.awaitingPayment);
  const grace = inGrace(billing, sub, now);
  const suspended = !awaiting && billing.plan === "free" && (billing.subscriptionStatus === "suspended" || sub?.status === "suspended");
  const cancelled = status === "cancelled";
  const queued = Boolean(sub?.resumeStartsAt && !sub.cancelledAt && QUEUED.includes(sub.status.toLowerCase()));
  const banner: BillingBanner | null = grace ? "grace" : awaiting ? "awaitingPayment" : suspended ? "suspended" : cancelled ? "cancelled" : queued ? "queued" : null;

  const bannerAction =
    banner === "grace" && actions.updatePaymentUrl ? "updatePayment" : banner === "suspended" && actions.reactivate ? "reactivate" : null;
  const buttons: BillingButton[] = [];
  if (!legacy && !comp) {
    if (actions.subscribe) buttons.push("subscribe");
    if (actions.resume) buttons.push("resume");
    if (actions.reactivate && bannerAction !== "reactivate") buttons.push("reactivate");
    if (actions.updatePaymentUrl && bannerAction !== "updatePayment") buttons.push("updatePayment");
    if (actions.cancel) buttons.push("cancel");
  }

  return {
    status,
    banner: comp ? null : banner,
    legacy,
    comp,
    compUntil: comp ? compUntil(billing, sub) : null,
    // A cancelled plan never renews, so a change that waits for the renewal doesn't apply.
    pendingChange: !comp && !legacy && !cancelled ? (sub?.pendingPlanChange ?? null) : null,
    showFreeBody: !comp && billing.plan === "free" && (status === "none" || status === "ended"),
    nextChargeAt: !comp && !cancelled && !awaiting && !queued ? (sub?.nextChargeAt ?? null) : null,
    accessUntil: cancelled ? (sub?.accessUntil ?? accessEndsAt(billing, sub)) : null,
    resumesOn: queued ? (sub?.resumeStartsAt ?? null) : null,
    buttons,
    bannerAction: legacy || comp ? null : bannerAction,
  };
}

/** Reactivating answered: the plan is back only when the server says active and paid. */
export function reactivateOutcome(answer: { status: string; billing: Billing }): "active" | "waiting" {
  return answer.status === "active" && answer.billing.plan !== "free" ? "active" : "waiting";
}
