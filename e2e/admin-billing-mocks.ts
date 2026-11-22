import type { Page, Route } from "@playwright/test";
import { DAY, NOW } from "./billing-mocks";

/* The admin billing endpoints (billing epic 4.3), mocked with page.route until the backend lands. */

export function checkoutRow(n: number, over: Record<string, unknown> = {}) {
  return {
    id: `co-${n}`,
    brand: { id: `b-${n}`, name: n === 1 ? "Wadi Rum Coffee" : `Brand ${n}`, slug: `brand-${n}` },
    owner: { id: `u-${n}`, email: `owner${n}@studio.sa`, name: n === 1 ? "Layla Haddad" : `Owner ${n}` },
    provider: "paypal",
    plan: "subscription",
    status: "active",
    amount: 2900,
    currency: "usd",
    subscriptionId: `I-SUB${n}`,
    paidAt: NOW - 40 * DAY,
    currentPeriodEnd: NOW + 20 * DAY,
    paymentFailedAt: null,
    refused: false,
    createdAt: NOW - 40 * DAY,
    ...over,
  };
}

export function checkoutDetail(row: ReturnType<typeof checkoutRow>, over: Record<string, unknown> = {}) {
  return {
    ...row,
    payments: [
      { id: "s2", kind: "sale", amount: 2900, currency: "usd", state: "completed", occurredAt: NOW - 10 * DAY },
      { id: "s1", kind: "sale", amount: 2900, currency: "usd", state: "completed", occurredAt: NOW - 40 * DAY },
    ],
    cancelReason: null,
    cancelNote: null,
    paypal: { status: "suspended", nextBillingAt: NOW + 20 * DAY, lastPaymentAt: NOW - 10 * DAY, lastPaymentAmount: 2900, failedPayments: 1 },
    mismatch: true,
    ...over,
  };
}

export const compRow = checkoutRow(2, {
  id: "co-comp",
  brand: { id: "b-comp", name: "Nakheel Studio", slug: "nakheel" },
  provider: "comp",
  amount: null,
  subscriptionId: null,
  currentPeriodEnd: NOW + 60 * DAY,
});

export type Sent = { method: string; path: string; search: URLSearchParams; body: unknown };

/** Serves every /admin/billing/ call from `rows` (and `details`), recording what was sent. */
export async function mockAdminBilling(page: Page, { rows, count, details = {} }: { rows: ReturnType<typeof checkoutRow>[]; count?: number; details?: Record<string, unknown> }) {
  const sent: Sent[] = [];
  await page.route(/\/api\/v1\/admin\/billing\//, async (route: Route) => {
    const req = route.request();
    const url = new URL(req.url());
    const path = url.pathname.replace(/^.*\/api\/v1/, "");
    const body = req.method() === "POST" ? req.postDataJSON() : null;
    sent.push({ method: req.method(), path, search: url.searchParams, body });
    if (path === "/admin/billing/checkouts/") return route.fulfill({ json: { count: count ?? rows.length, results: rows } });
    const one = path.match(/^\/admin\/billing\/checkouts\/([^/]+)\/(sync\/)?$/);
    if (one) {
      const row = rows.find((r) => r.id === one[1]);
      if (!row) return route.fulfill({ status: 404, json: { detail: "Not found." } });
      const detail = details[row.id] ?? checkoutDetail(row);
      return route.fulfill({ json: one[2] ? { ...(detail as object), mismatch: false, status: "suspended" } : detail });
    }
    if (path === "/admin/billing/orphans/") {
      return route.fulfill({
        json: [
          { subscriptionId: "I-ORPHAN1", checkout: null, workspaceId: "b-9", paypalStatus: "active", moneyTaken: true, firstSeenAt: NOW - 2 * DAY, alertedAt: NOW - 2 * DAY, cancelledAt: null },
          { subscriptionId: "I-ORPHAN2", checkout: "co-1", workspaceId: "b-1", paypalStatus: "cancelled", moneyTaken: false, firstSeenAt: NOW - 5 * DAY, alertedAt: null, cancelledAt: NOW - 4 * DAY },
        ],
      });
    }
    if (path === "/admin/billing/audit/") {
      return route.fulfill({
        json: {
          count: 1,
          results: [
            { id: "a1", actor: { email: "admin@markyos.com" }, action: "limits_changed", target: "owner1@studio.sa", reason: "Agency deal, signed 20 Nov", createdAt: NOW - DAY, before: { brands: 3 }, after: { brands: 10 } },
          ],
        },
      });
    }
    if (path === "/admin/billing/comps/" || /^\/admin\/billing\/comps\/[^/]+\/end\/$/.test(path)) return route.fulfill({ json: { ok: true } });
    return route.fallback();
  });
  return sent;
}
