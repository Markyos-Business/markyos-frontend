import type { BadgeTone } from "@/components/ui";
import type { Billing } from "@/types";
import type { BrandSubscription } from "../types";

/*
 * How the server's billing reads on screen. Pure mapping only: nothing here
 * decides a plan, a price or a date, it names what the server returned.
 */

export type StatusKey = "active" | "pending" | "paymentFailed" | "suspended" | "cancelled" | "ended" | "none";

const ENDED = ["cancelled", "canceled"];

/** The badge on the Billing tab: the subscription's status, or "No plan". */
export function statusOf(billing: Billing, subscription: BrandSubscription | null, now: number): StatusKey {
  const status = (subscription?.status ?? billing.subscriptionStatus ?? "").toLowerCase();
  const paid = billing.plan !== "free";
  if (!status) return paid ? "active" : "none";
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

/** Ownership can't move while a plan is on, unless it's cancelled at the period end (D4). */
export function transferBlocked(billing: Billing | undefined): boolean {
  return billing?.plan === "subscription" && !ENDED.includes(billing.subscriptionStatus ?? "");
}

/** A plan bought before PayPal (a Stripe subscription or a Project Pass): shown, never managed here. */
export function isLegacy(billing: Billing, subscription: BrandSubscription | null): boolean {
  return subscription?.provider === "stripe" || billing.plan === "pass";
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
