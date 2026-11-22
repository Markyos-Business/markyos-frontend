import { describe, expect, it } from "vitest";
import { ADMIN_BILLING_COPY } from "./billing-copy";
import { CHECKOUT_STATUSES } from "./utils/billing";

/** The six actions the server writes to the billing audit log. */
const AUDIT_ACTIONS = ["billing_synced", "comp_granted", "comp_ended", "limits_changed", "price_change", "type_changed"];

describe("admin billing copy", () => {
  for (const lang of ["en", "ar"] as const) {
    const b = ADMIN_BILLING_COPY[lang];

    it(`names every audit action in ${lang}`, () => {
      for (const action of AUDIT_ACTIONS) expect(b.audit.actions[action], action).toBeTruthy();
      expect(new Set(AUDIT_ACTIONS.map((a) => b.audit.actions[a])).size).toBe(AUDIT_ACTIONS.length);
    });

    it(`names every stored status once in the filter in ${lang}`, () => {
      const labels = CHECKOUT_STATUSES.map((s) => b.filterStatuses[s]);
      expect(labels.every(Boolean)).toBe(true);
      expect(new Set(labels).size).toBe(CHECKOUT_STATUSES.length);
    });
  }

  it("says how many renewals went unapproved", () => {
    expect(ADMIN_BILLING_COPY.en.pending.missed(1)).toBe("Not approved at 1 renewal.");
    expect(ADMIN_BILLING_COPY.en.pending.missed(3)).toBe("Not approved at 3 renewals.");
    expect(ADMIN_BILLING_COPY.ar.pending.missed(2)).toBe("لم تتم الموافقة في تجديدين.");
  });

  it("writes the price change with or without a date", () => {
    expect(ADMIN_BILLING_COPY.en.pending.body("Company", "USD 49", "18 Dec 2026")).toBe("Price change to Company (USD 49/month) from 18 Dec 2026.");
    expect(ADMIN_BILLING_COPY.ar.pending.body("شركة", "USD 49", null)).toContain("التجديد القادم");
  });
});
