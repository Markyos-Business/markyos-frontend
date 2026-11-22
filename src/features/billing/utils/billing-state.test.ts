import { describe, expect, it } from "vitest";
import type { Billing } from "@/types";
import type { BrandSubscription } from "../types";
import type { BrandBillingAnswer } from "../types";
import {
  accessEndsAt,
  billingView,
  failureBannerDue,
  historyState,
  inGrace,
  isLegacy,
  reactivateOutcome,
  resumeDate,
  statusOf,
  suspendedToFree,
  transferBlocked,
} from "./billing-state";

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

describe("transferBlocked (D4), as the server decides it", () => {
  it("blocks a PayPal subscription that can still charge, whatever the plan", () => {
    expect(transferBlocked(paid)).toBe(true);
    for (const subscriptionStatus of ["approved", "suspended", "refused"]) expect(transferBlocked({ ...paid, subscriptionStatus })).toBe(true);
    // Suspended after the grace: on Free, but PayPal can still charge it.
    expect(transferBlocked({ plan: "free", provider: "paypal", subscriptionStatus: "suspended" })).toBe(true);
  });

  it("lets ended PayPal subscriptions, Stripe and free brands go", () => {
    for (const subscriptionStatus of ["cancelled", "expired", "refunded", "reversed"]) expect(transferBlocked({ ...paid, subscriptionStatus })).toBe(false);
    expect(transferBlocked({ plan: "subscription", subscriptionStatus: "active" })).toBe(false); // Stripe: no provider
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

const actions = (over: Partial<BrandBillingAnswer["actions"]> = {}): BrandBillingAnswer["actions"] => ({
  subscribe: false,
  cancel: false,
  resume: false,
  reactivate: false,
  updatePaymentUrl: null,
  ...over,
});
const answer = (over: Partial<BrandBillingAnswer>): BrandBillingAnswer => ({ billing: paid, subscription: sub(), actions: actions(), history: [], ...over });

describe("billingView", () => {
  it("comp: until the server's date, no actions, no banner, no charge", () => {
    const until = NOW + 90 * DAY;
    const view = billingView(
      answer({
        billing: { plan: "subscription", provider: "comp", paidUntil: until },
        subscription: sub({ provider: "comp", amount: null, nextChargeAt: null, payerEmail: null }),
        // Even if the server offered something, a comp shows no buttons.
        actions: actions({ cancel: true, subscribe: true }),
      }),
      NOW,
    );
    expect(view).toMatchObject({ comp: true, compUntil: until, status: "active", banner: null, buttons: [], bannerAction: null, nextChargeAt: null, showFreeBody: false, pendingChange: null });
  });

  it("comp from billing alone (no subscription row)", () => {
    const view = billingView(answer({ billing: { plan: "subscription", provider: "comp", paidUntil: NOW + DAY }, subscription: null, actions: actions() }), NOW);
    expect(view).toMatchObject({ comp: true, compUntil: NOW + DAY, buttons: [] });
  });

  it("a pending plan change is passed through, with or without approval", () => {
    const change = { accountType: "studio" as const, amount: 4900, effectiveAt: NOW + 20 * DAY, approvalUrl: "https://www.sandbox.paypal.com/webapps/billing/subscriptions/update?ba_token=BA-1" };
    const view = billingView(answer({ subscription: sub({ pendingPlanChange: change }), actions: actions({ cancel: true }) }), NOW);
    expect(view.pendingChange).toEqual(change);
    expect(view.buttons).toEqual(["cancel"]);
    const lower = billingView(answer({ subscription: sub({ pendingPlanChange: { ...change, amount: 1900, approvalUrl: null } }) }), NOW);
    expect(lower.pendingChange?.approvalUrl).toBeNull();
  });

  it("a cancelled plan shows no pending change: it never renews", () => {
    const change = { accountType: "studio" as const, amount: 4900, effectiveAt: NOW + 20 * DAY, approvalUrl: null };
    const view = billingView(
      answer({ subscription: sub({ status: "cancelled", cancelledAt: NOW, accessUntil: NOW + 20 * DAY, pendingPlanChange: change }) }),
      NOW,
    );
    expect(view.pendingChange).toBeNull();
  });

  it("paid: next charge, cancel and update payment in the card", () => {
    const view = billingView(answer({ actions: actions({ cancel: true, updatePaymentUrl: "https://paypal" }) }), NOW);
    expect(view).toMatchObject({ status: "active", banner: null, nextChargeAt: NOW + 20 * DAY, showFreeBody: false, buttons: ["updatePayment", "cancel"] });
  });

  it("grace: the banner carries Update payment", () => {
    const view = billingView(
      answer({ subscription: sub({ paymentFailedAt: NOW - DAY, graceEndsAt: NOW + 6 * DAY }), actions: actions({ cancel: true, updatePaymentUrl: "https://paypal" }) }),
      NOW,
    );
    expect(view).toMatchObject({ status: "paymentFailed", banner: "grace", bannerAction: "updatePayment", buttons: ["cancel"] });
  });

  it("suspended after the grace: Reactivate in the banner, no 'No plan, subscribe' line", () => {
    const view = billingView(
      answer({
        billing: { plan: "free", provider: "paypal", subscriptionStatus: "suspended" },
        subscription: sub({ status: "suspended", paymentFailedAt: NOW - 9 * DAY, graceEndsAt: NOW - 2 * DAY, nextChargeAt: null }),
        actions: actions({ reactivate: true, cancel: true }),
      }),
      NOW,
    );
    expect(view).toMatchObject({ status: "suspended", banner: "suspended", bannerAction: "reactivate", showFreeBody: false, buttons: ["cancel"] });
  });

  it("reactivated and waiting for PayPal: no next charge, no subscribe pitch, its own badge", () => {
    const view = billingView(
      answer({
        billing: { plan: "free", provider: "paypal", subscriptionStatus: "active" },
        subscription: sub({ awaitingPayment: true, nextChargeAt: NOW + DAY }),
        actions: actions({ cancel: true }),
      }),
      NOW,
    );
    expect(view).toMatchObject({ status: "awaitingPayment", banner: "awaitingPayment", nextChargeAt: null, showFreeBody: false, bannerAction: null });
  });

  it("cancelled: access until and Resume", () => {
    const view = billingView(
      answer({
        billing: { ...paid, subscriptionStatus: "cancelled" },
        subscription: sub({ status: "cancelled", nextChargeAt: null, accessUntil: NOW + 20 * DAY, cancelledAt: NOW, resumeStartsAt: NOW + 20 * DAY }),
        actions: actions({ resume: true }),
      }),
      NOW,
    );
    expect(view).toMatchObject({ status: "cancelled", banner: "cancelled", accessUntil: NOW + 20 * DAY, resumesOn: null, nextChargeAt: null, buttons: ["resume"] });
  });

  it("queued resume: resumes on the server's date instead of a next charge", () => {
    for (const status of ["approved", "active"]) {
      const view = billingView(answer({ subscription: sub({ status, resumeStartsAt: NOW + 20 * DAY, nextChargeAt: NOW + 20 * DAY }), actions: actions({ cancel: true }) }), NOW);
      expect(view).toMatchObject({ banner: "queued", resumesOn: NOW + 20 * DAY, nextChargeAt: null, buttons: ["cancel"] });
    }
  });

  it("legacy Stripe: no actions, the contact note", () => {
    const view = billingView(
      answer({ billing: { plan: "subscription", subscriptionStatus: "active" }, subscription: sub({ provider: "stripe" }), actions: actions({ cancel: true }) }),
      NOW,
    );
    expect(view).toMatchObject({ legacy: true, buttons: [], bannerAction: null });
  });

  it("free: says so and offers Subscribe", () => {
    const view = billingView(answer({ billing: free, subscription: null, actions: actions({ subscribe: true }) }), NOW);
    expect(view).toMatchObject({ status: "none", showFreeBody: true, buttons: ["subscribe"] });
  });
});

describe("resumeDate and reactivateOutcome", () => {
  it("dates a resume from resumeStartsAt, else the paid month's end", () => {
    expect(resumeDate(sub({ resumeStartsAt: NOW + 3 * DAY, accessUntil: NOW + 2 * DAY }))).toBe(NOW + 3 * DAY);
    expect(resumeDate(sub({ accessUntil: NOW + 2 * DAY }))).toBe(NOW + 2 * DAY);
    expect(resumeDate(null)).toBeNull();
  });

  it("calls a reactivation done only when the server says active and paid", () => {
    expect(reactivateOutcome({ status: "active", billing: paid })).toBe("active");
    expect(reactivateOutcome({ status: "active", billing: free })).toBe("waiting");
    expect(reactivateOutcome({ status: "suspended", billing: free })).toBe("waiting");
  });
});
