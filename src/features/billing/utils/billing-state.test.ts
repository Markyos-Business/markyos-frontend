import { describe, expect, it } from "vitest";
import type { Billing } from "@/types";
import type { BrandSubscription } from "../types";
import { accessEndsAt, failureBannerDue, historyState, inGrace, isLegacy, statusOf, suspendedToFree, transferBlocked } from "./billing-state";

const NOW = Date.UTC(2026, 10, 22);
const DAY = 86_400_000;
const sub = (over: Partial<BrandSubscription> = {}): BrandSubscription => ({
  provider: "paypal",
  status: "active",
  amount: 2900,
  currency: "usd",
  nextChargeAt: NOW + 20 * DAY,
  accessUntil: null,
  payerEmail: "n***@gmail.com",
  paymentFailedAt: null,
  graceEndsAt: null,
  cancelledAt: null,
  cancelReason: null,
  resumeStartsAt: null,
  ...over,
});
const paid: Billing = { plan: "subscription", subscriptionStatus: "active", provider: "paypal" };
const free: Billing = { plan: "free" };

describe("statusOf", () => {
  it("says No plan for a brand with nothing", () => {
    expect(statusOf(free, null, NOW)).toBe("none");
  });

  it("names the subscription's status", () => {
    expect(statusOf(paid, sub(), NOW)).toBe("active");
    expect(statusOf(free, sub({ status: "approval_pending" }), NOW)).toBe("pending");
    expect(statusOf(free, sub({ status: "suspended" }), NOW)).toBe("suspended");
    expect(statusOf(free, sub({ status: "expired" }), NOW)).toBe("ended");
  });

  it("is cancelled while access lasts, ended after", () => {
    expect(statusOf(paid, sub({ status: "cancelled" }), NOW)).toBe("cancelled");
    expect(statusOf(free, sub({ status: "cancelled" }), NOW)).toBe("ended");
    expect(statusOf(paid, sub({ provider: "stripe", status: "canceled" }), NOW)).toBe("cancelled");
  });

  it("is payment failed during the grace only", () => {
    const failing = sub({ paymentFailedAt: NOW - DAY, graceEndsAt: NOW + 6 * DAY });
    expect(statusOf(paid, failing, NOW)).toBe("paymentFailed");
    expect(statusOf(free, sub({ status: "suspended", paymentFailedAt: NOW - 8 * DAY, graceEndsAt: NOW - DAY }), NOW)).toBe("suspended");
  });

  it("falls back to the brand's billing without a subscription row", () => {
    expect(statusOf({ plan: "pass" }, null, NOW)).toBe("active");
  });
});

describe("grace and the banner", () => {
  it("shows while the grace runs and not after", () => {
    const failing: Billing = { ...paid, paymentFailedAt: NOW - DAY, graceEndsAt: NOW + 6 * DAY };
    expect(failureBannerDue(failing, NOW)).toBe(true);
    expect(inGrace(failing, null, NOW)).toBe(true);
    expect(failureBannerDue({ ...failing, graceEndsAt: NOW - 1 }, NOW)).toBe(false);
    expect(failureBannerDue(paid, NOW)).toBe(false);
    expect(failureBannerDue(undefined, NOW)).toBe(false);
  });

  it("knows a plan suspended back to Free", () => {
    expect(suspendedToFree({ plan: "free", subscriptionStatus: "suspended" })).toBe(true);
    expect(suspendedToFree({ ...paid, subscriptionStatus: "suspended" })).toBe(false);
  });
});

describe("transferBlocked (D4)", () => {
  it("blocks an active plan and lets a cancelled or free one go", () => {
    expect(transferBlocked(paid)).toBe(true);
    expect(transferBlocked({ ...paid, subscriptionStatus: "suspended" })).toBe(true);
    expect(transferBlocked({ ...paid, subscriptionStatus: "cancelled" })).toBe(false);
    expect(transferBlocked(free)).toBe(false);
    expect(transferBlocked({ plan: "pass" })).toBe(false);
    expect(transferBlocked(undefined)).toBe(false);
  });
});

describe("dates and legacy", () => {
  it("takes the server's access date first", () => {
    expect(accessEndsAt(paid, sub({ accessUntil: NOW + DAY, nextChargeAt: NOW + 2 * DAY }))).toBe(NOW + DAY);
    expect(accessEndsAt(paid, sub())).toBe(NOW + 20 * DAY);
    expect(accessEndsAt({ ...paid, currentPeriodEnd: NOW + 3 * DAY }, null)).toBe(NOW + 3 * DAY);
    expect(accessEndsAt(free, null)).toBeNull();
  });

  it("marks Stripe and Pass plans as legacy", () => {
    expect(isLegacy(paid, sub({ provider: "stripe" }))).toBe(true);
    expect(isLegacy({ plan: "pass" }, null)).toBe(true);
    expect(isLegacy(paid, sub())).toBe(false);
  });
});

describe("historyState", () => {
  it("maps PayPal states to a word and a tone", () => {
    expect(historyState("COMPLETED")).toEqual({ key: "completed", tone: "success" });
    expect(historyState("pending")).toEqual({ key: "pending", tone: "warning" });
    expect(historyState("partially_refunded").key).toBe("refunded");
    expect(historyState("denied")).toEqual({ key: "failed", tone: "danger" });
    expect(historyState("reversed").key).toBe("reversed");
    expect(historyState("something_new")).toEqual({ key: "other", tone: "neutral" });
  });
});
