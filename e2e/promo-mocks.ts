import type { Page, Route } from "@playwright/test";
import { DAY, NOW } from "./billing-mocks";

/* Promo codes (docs/promo-codes-plan.md §4), mocked with page.route while the backend is built. */

export type Sent = { method: string; path: string; search: URLSearchParams; body: unknown };

export function codeRow(n: number, over: Record<string, unknown> = {}) {
  return {
    id: `pc-${n}`,
    code: `MRK-7KQ${n}-XP2M`,
    batchId: "batch-launch-0001",
    label: "50% for 3 months",
    uses: n === 1 ? 1 : 0,
    maxUses: 1,
    status: n === 1 ? "used_up" : "active",
    expiresAt: NOW + 60 * DAY,
    createdAt: NOW - 2 * DAY,
    percentOff: 50,
    amountOff: null,
    duration: "repeating",
    months: 3,
    currency: "usd",
    ...over,
  };
}

export function codeDetail(row: ReturnType<typeof codeRow>) {
  return {
    ...row,
    note: "Launch partners, one each",
    firstPurchaseOnly: true,
    accountTypes: null,
    redemptions:
      row.uses > 0
        ? [{ brand: { id: "b-1", name: "Wadi Rum Coffee" }, owner: { id: "u-1", email: "layla@studio.sa", name: "Layla Haddad" }, createdAt: NOW - DAY, status: "active", payingNow: 1450, currency: "usd" }]
        : [],
    audit: [{ id: "a1", action: "codes_generated", reason: "Launch partners, one each", createdAt: NOW - 2 * DAY, actor: { email: "admin@markyos.com", name: "Nour Haddad" } }],
  };
}

const NEW_BATCH = "batch-new-0002";
const newCodes = (count: number) => Array.from({ length: count }, (_, i) => ({ id: `pc-new-${i + 1}`, code: `MRK-NEW${i + 1}-QW${i + 1}Z` }));

/** Serves the admin promo endpoints from `rows`; Generate adds its codes to them. Records what was sent. */
export async function mockPromoAdmin(page: Page, rows: ReturnType<typeof codeRow>[]) {
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
      codes.forEach((c, i) => rows.unshift(codeRow(100 + i, { id: c.id, code: c.code, batchId: NEW_BATCH, uses: 0, status: "active", createdAt: NOW })));
      return route.fulfill({ json: { batch: { id: NEW_BATCH, note: "x", createdAt: NOW }, codes } });
    }
    if (path === "/admin/billing/codes.csv") {
      const batch = url.searchParams.get("batch");
      const csv = ["code,discount,uses", ...rows.filter((r) => r.batchId === batch).map((r) => `${r.code},${r.label},${r.uses} of ${r.maxUses}`)].join("\n");
      return route.fulfill({ status: 200, contentType: "text/csv", body: csv });
    }
    const disable = path.match(/^\/admin\/billing\/codes\/([^/]+)\/disable\/$/);
    if (disable) {
      const row = rows.find((r) => r.id === disable[1]);
      if (row) row.status = "disabled";
      return route.fulfill({ json: { ok: true } });
    }
    const batchOff = path.match(/^\/admin\/billing\/batches\/([^/]+)\/disable\/$/);
    if (batchOff) {
      rows.filter((r) => r.batchId === batchOff[1] && r.uses === 0).forEach((r) => (r.status = "disabled"));
      return route.fulfill({ json: { ok: true } });
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
export const TERMS = { code: "MRK-7KQ4-XP2M", label: "50% for 3 months", firstAmount: 1450, regularAmount: 2900, months: 3, currency: "usd" };

/** Serves POST /billing/codes/check/: the terms, or a 400 with `refuse` as its reason. */
export async function mockCodeCheck(page: Page, answer: (code: string) => { refuse?: string; terms?: typeof TERMS }) {
  const sent: { brandId: string; code: string }[] = [];
  await page.route("**/api/v1/billing/codes/check/", (route: Route) => {
    const body = route.request().postDataJSON() as { brandId: string; code: string };
    sent.push(body);
    const out = answer(body.code);
    if (out.refuse) return route.fulfill({ status: 400, json: { code: out.refuse, detail: "Refused." } });
    return route.fulfill({ json: out.terms ?? TERMS });
  });
  return sent;
}
