import type { Page, Route } from "@playwright/test";
import { DAY, NOW } from "./billing-mocks";

/* Promo codes (docs/promo-codes-plan.md §4), mocked with page.route while the backend is built. */

export type Sent = { method: string; path: string; search: URLSearchParams; body: unknown };

export const DISCOUNT = { kind: "percent", value: 50, duration: "repeating", months: 3 };

export function batchRow(id = "6f1c2a90-0000-4000-8000-000000000001", over: Record<string, unknown> = {}) {
  return {
    id,
    note: "Launch partners, one each",
    label: "50% off for 3 months",
    discount: DISCOUNT,
    usesPerCode: 1,
    expiresAt: NOW + 60 * DAY,
    accountTypes: ["studio", "freelancer", "company"],
    firstPurchaseOnly: true,
    codes: 4,
    createdAt: NOW - 2 * DAY,
    createdBy: { id: "u-admin", email: "admin@markyos.com", name: "Nour Haddad" },
    disabledAt: null,
    ...over,
  };
}

/** A code as admin/billing/codes/ lists it (apps/brands/admin_promo.code_row). */
export function codeRow(n: number, over: Record<string, unknown> = {}) {
  return {
    id: `pc-${n}`,
    code: `MRK-7KQ${n}-XP2M`,
    batchId: "6f1c2a90-0000-4000-8000-000000000001",
    label: "50% off for 3 months",
    discount: DISCOUNT,
    uses: { used: n === 1 ? 1 : 0, reserved: 0, limit: 1 },
    status: n === 1 ? "used_up" : "active",
    expiresAt: NOW + 60 * DAY,
    createdAt: NOW - 2 * DAY,
    disabledAt: null,
    ...over,
  };
}

type Row = ReturnType<typeof codeRow>;

export function codeDetail(row: Row) {
  return {
    ...row,
    batch: batchRow(row.batchId),
    redemptions:
      row.uses.used > 0
        ? [
            {
              id: "r-1",
              status: "active",
              brand: { id: "b-1", name: "Wadi Rum Coffee", slug: "wadi-rum-coffee" },
              owner: { id: "u-1", email: "layla@studio.sa", name: "Layla Haddad" },
              checkoutId: "co-1",
              subscriptionStatus: "active",
              reservedAt: NOW - DAY,
              activatedAt: NOW - DAY,
              releasedAt: null,
              endedAt: null,
              endReason: null,
              paysNow: { amount: 1450, currency: "usd", until: NOW + 80 * DAY },
            },
          ]
        : [],
    audit: [
      {
        id: "a1",
        action: "promo_generated",
        actor: { id: "u-admin", email: "admin@markyos.com", name: "Nour Haddad" },
        target: { accountId: null, email: null, subject: `promo_batch:${row.batchId}` },
        reason: "Launch partners, one each",
        before: null,
        after: null,
        createdAt: NOW - 2 * DAY,
      },
    ],
  };
}

export const NEW_BATCH = "9a2d4e10-0000-4000-8000-000000000002";
const newCodes = (count: number) =>
  Array.from({ length: count }, (_, i) => codeRow(100 + i, { id: `pc-new-${i + 1}`, code: `MRK-NEW${i + 1}-QW${i + 1}Z`, batchId: NEW_BATCH, status: "active", createdAt: NOW }));

/** Serves the admin promo endpoints from `rows`; Generate adds its codes to them. Records what was sent. */
export async function mockPromoAdmin(page: Page, rows: Row[]) {
  const sent: Sent[] = [];
  await page.route(/\/api\/v1\/admin\/billing\/(codes|batches)/, async (route: Route) => {
    const req = route.request();
    const url = new URL(req.url());
    const path = url.pathname.replace(/^.*\/api\/v1/, "");
    const body = req.method() === "POST" ? req.postDataJSON() : null;
    sent.push({ method: req.method(), path, search: url.searchParams, body });
    if (path === "/admin/billing/codes/" && req.method() === "GET") {
      const batch = url.searchParams.get("batch");
      const status = url.searchParams.get("status");
      const results = rows.filter((r) => (!batch || r.batchId === batch) && (!status || r.status === status));
      return route.fulfill({ json: { count: results.length, results } });
    }
    if (path === "/admin/billing/codes/generate/") {
      const request = body as { count: number };
      const codes = newCodes(request.count);
      rows.unshift(...codes);
      return route.fulfill({ status: 201, json: { batch: batchRow(NEW_BATCH, { codes: codes.length, createdAt: NOW }), codes } });
    }
    if (path === "/admin/billing/codes.csv") {
      const batch = url.searchParams.get("batch");
      const csv = ["code,discount,used,reserved,limit,batch,expires,status,created", ...rows.filter((r) => r.batchId === batch).map((r) => `${r.code},${r.label},${r.uses.used},${r.uses.reserved},${r.uses.limit ?? ""},${r.batchId},,${r.status},`)].join("\n");
      return route.fulfill({ status: 200, contentType: "text/csv", body: csv });
    }
    const disable = path.match(/^\/admin\/billing\/codes\/([^/]+)\/disable\/$/);
    if (disable) {
      const row = rows.find((r) => r.id === disable[1]);
      if (!row) return route.fulfill({ status: 404, json: { detail: "Not found." } });
      row.status = "disabled";
      return route.fulfill({ json: codeDetail(row) });
    }
    const batchOff = path.match(/^\/admin\/billing\/batches\/([^/]+)\/disable\/$/);
    if (batchOff) {
      const hit = rows.filter((r) => r.batchId === batchOff[1] && r.status !== "disabled");
      hit.forEach((r) => (r.status = "disabled"));
      return route.fulfill({ json: { batch: batchRow(batchOff[1], { disabledAt: NOW }), disabled: hit.length } });
    }
    const one = path.match(/^\/admin\/billing\/codes\/([^/]+)\/$/);
    if (one) {
      const row = rows.find((r) => r.id === one[1]);
      return row ? route.fulfill({ json: codeDetail(row) }) : route.fulfill({ status: 404, json: { detail: "Not found." } });
    }
    return route.fallback();
  });
  return sent;
}

/** The server's terms for a code: USD 14.50 for 3 months, then USD 29. */
export const VALID = {
  valid: true,
  code: "MRK-7KQ4-XP2M",
  label: "50% off for 3 months",
  terms: { discount: DISCOUNT, currency: "usd", amount: 1450, regularAmount: 2900, months: 3 },
};

/** Serves POST /billing/codes/check/: always 200, the terms or `{valid: false, reason}`. */
export async function mockCodeCheck(page: Page, answer: (code: string) => { reason?: string }) {
  const sent: { brandId: string; code: string }[] = [];
  await page.route("**/api/v1/billing/codes/check/", (route: Route) => {
    const body = route.request().postDataJSON() as { brandId: string; code: string };
    sent.push(body);
    const { reason } = answer(body.code);
    return route.fulfill({ json: reason ? { valid: false, reason } : VALID });
  });
  return sent;
}
