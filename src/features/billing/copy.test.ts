import { describe, expect, it } from "vitest";
import { billingCopy } from "./copy";
import { CANCEL_REASONS } from "./types";

/** Every key in one language is in the other, so no Arabic screen falls back to nothing. */
function keys(value: unknown, prefix = ""): string[] {
  if (typeof value !== "object" || value === null) return [prefix];
  return Object.entries(value).flatMap(([k, v]) => keys(v, prefix ? `${prefix}.${k}` : k));
}

describe("billingCopy", () => {
  it("has the same words in English and Arabic", () => {
    expect(keys(billingCopy(true))).toEqual(keys(billingCopy(false)));
  });

  it("names every cancel reason", () => {
    for (const isAr of [false, true]) for (const r of CANCEL_REASONS) expect(billingCopy(isAr).cancelFlow.reasons[r]).toBeTruthy();
  });

  it("puts brand names in «» in Arabic and dates as given", () => {
    const ar = billingCopy(true);
    expect(ar.banner.failed("وادي رم", "29 نوفمبر 2026")).toContain("«وادي رم»");
    expect(ar.transfer.body("وادي رم")).toContain("«وادي رم»");
    expect(billingCopy(false).banner.failed("Wadi Rum", "29 Nov 2026")).toBe(
      "The last payment for Wadi Rum failed. Update the payment method by 29 Nov 2026 to keep the plan.",
    );
    expect(billingCopy(false).reason.resume.body("Wadi Rum", "18 Dec 2026")).toContain("The first charge is on 18 Dec 2026");
  });

  it("never promises the plan back before PayPal is paid", () => {
    for (const isAr of [false, true]) {
      const c = billingCopy(isAr);
      expect(c.tab.statuses.awaitingPayment).toBeTruthy();
      expect(c.tab.awaitingBody(isAr ? "وادي رم" : "Wadi Rum")).toContain(isAr ? "«وادي رم»" : "Wadi Rum");
    }
    const en = billingCopy(false);
    expect(en.tab.awaitingBody("Wadi Rum")).toBe("Reactivated. Wadi Rum returns to its plan once PayPal collects the payment.");
    expect(en.tab.suspendedBody("Wadi Rum")).not.toMatch(/restore/);
    expect(en.transfer.body("Wadi Rum")).not.toMatch(/active plan/);
    expect(en.cancelFlow.offerFree("Wadi Rum")).toBe("Cancelling stops PayPal from charging this subscription. Wadi Rum stays on Free.");
  });
});
