import type { Page, Route } from "@playwright/test";
import { djangoShell } from "./fixtures";

/* Phase 3 billing answers, mocked until the backend lands (billing-tab.spec.ts). */

export const DAY = 86_400_000;
export const NOW = Date.now();
export const NEXT = NOW + 20 * DAY;

/** "18 Dec 2026", as the app writes it (kit formatDayMonth). */
export function day(ms: number) {
  const parts = new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short", year: "numeric" }).formatToParts(new Date(ms));
  const part = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${part("day")} ${part("month")} ${part("year")}`;
}

const paidBilling = { plan: "subscription", subscriptionStatus: "active", provider: "paypal", purchasedAt: NOW - 10 * DAY, currentPeriodEnd: NEXT, paidUntil: NEXT };

export function paidAnswer() {
  return {
    billing: paidBilling,
    subscription: {
      provider: "paypal",
      status: "active",
      amount: 2900,
      currency: "usd",
      nextChargeAt: NEXT,
      accessUntil: null,
      payerEmail: "l***@studio.com",
      paymentFailedAt: null,
      graceEndsAt: null,
      cancelledAt: null,
      cancelReason: null,
      resumeStartsAt: null,
    },
    actions: { subscribe: false, cancel: true, resume: false, reactivate: false, updatePaymentUrl: "https://www.sandbox.paypal.com/myaccount/autopay/" },
    history: [
      { id: "s2", kind: "sale", amount: 2900, currency: "usd", state: "completed", occurredAt: NOW - 10 * DAY },
      { id: "s1", kind: "sale", amount: 2900, currency: "usd", state: "completed", occurredAt: NOW - 40 * DAY },
      { id: "r1", kind: "refund", amount: 2900, currency: "usd", state: "completed", occurredAt: NOW - 38 * DAY },
    ],
  };
}

export function cancelledAnswer() {
  const paid = paidAnswer();
  return {
    ...paid,
    billing: { ...paidBilling, subscriptionStatus: "cancelled" },
    // The backend fills resumeStartsAt whenever resume is allowed: the first charge of a resumed plan.
    subscription: { ...paid.subscription, status: "cancelled", nextChargeAt: null, accessUntil: NEXT, cancelledAt: NOW, cancelReason: "too_expensive", resumeStartsAt: NEXT },
    actions: { subscribe: false, cancel: false, resume: true, reactivate: false, updatePaymentUrl: null },
  };
}

export function failedAnswer() {
  const paid = paidAnswer();
  const failedAt = NOW - DAY;
  return {
    ...paid,
    billing: { ...paidBilling, paymentFailedAt: failedAt, graceEndsAt: failedAt + 7 * DAY },
    subscription: { ...paid.subscription, paymentFailedAt: failedAt, graceEndsAt: failedAt + 7 * DAY },
  };
}

/** Suspended after the grace: on Free, PayPal can still collect; Reactivate is offered. */
export function suspendedAnswer() {
  const paid = paidAnswer();
  const failedAt = NOW - 9 * DAY;
  return {
    ...paid,
    billing: { plan: "free", provider: "paypal", subscriptionStatus: "suspended", currentPeriodEnd: NOW - 2 * DAY, paymentFailedAt: failedAt },
    subscription: { ...paid.subscription, status: "suspended", nextChargeAt: null, paymentFailedAt: failedAt, graceEndsAt: failedAt + 7 * DAY },
    actions: { subscribe: false, cancel: true, resume: false, reactivate: true, updatePaymentUrl: "https://www.sandbox.paypal.com/myaccount/autopay/" },
  };
}

/** Reactivated, PayPal hasn't collected yet (money first): still on Free. */
export function awaitingAnswer() {
  const suspended = suspendedAnswer();
  return {
    ...suspended,
    billing: { ...suspended.billing, subscriptionStatus: "active" },
    subscription: { ...suspended.subscription, status: "active", awaitingPayment: true },
    actions: { ...suspended.actions, reactivate: false },
  };
}

/** A resume queued after a cancel: a new subscription that starts when the paid month ends. */
export function queuedResumeAnswer() {
  const paid = paidAnswer();
  return {
    ...paid,
    subscription: { ...paid.subscription, status: "approved", resumeStartsAt: NEXT, nextChargeAt: NEXT },
  };
}

/** A retired Stripe plan, honoured to the end of 2026: shown, never managed here. */
export function stripeAnswer() {
  const paid = paidAnswer();
  return {
    billing: { plan: "subscription", subscriptionStatus: "active", purchasedAt: NOW - 60 * DAY },
    subscription: { ...paid.subscription, provider: "stripe", payerEmail: null },
    actions: { subscribe: false, cancel: false, resume: false, reactivate: false, updatePaymentUrl: null },
    history: [],
  };
}

export const freeAnswer = {
  billing: { plan: "free" },
  subscription: null,
  actions: { subscribe: true, cancel: false, resume: false, reactivate: false, updatePaymentUrl: null },
  history: [],
};

/** Serves GET /billing/brands/<id>/ from `answer()`, read at each request. */
export async function mockBrandBilling(page: Page, answer: () => unknown) {
  await page.route("**/api/v1/billing/brands/*/", (route: Route) =>
    route.request().method() === "GET" ? route.fulfill({ json: answer() }) : route.fallback(),
  );
}

/** A PayPal renewal that failed a day ago, as the webhook records it (D6 grace still running). */
export function failedPayment(brandId: string) {
  djangoShell(
    `from datetime import timedelta; from django.utils import timezone; from apps.brands.models import Checkout, Workspace; w=Workspace.objects.get(pk=${JSON.stringify(brandId)}); now=timezone.now(); Checkout.objects.create(workspace=w, buyer=w.owner, provider="paypal", plan="subscription", account_type="studio", plan_key="paypal_plan", amount=2900, status="active", paid_at=now-timedelta(days=30), current_period_end=now, payment_failed_at=now-timedelta(days=1), session_id=${JSON.stringify(`pp_${brandId}`)}, subscription_id=${JSON.stringify(`I-${brandId}`)})`,
  );
}

