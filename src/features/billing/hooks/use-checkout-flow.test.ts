import { describe, expect, it } from "vitest";
import type { Billing } from "@/types";
import { outcomeOf } from "./use-checkout-flow";

const free = { plan: "free" } as Billing;
const paid = { plan: "subscription" } as Billing;

describe("outcomeOf", () => {
  it("is active only when the server says active and the brand is paid", () => {
    expect(outcomeOf({ status: "active", billing: paid })).toBe("active");
    expect(outcomeOf({ status: "active", billing: free })).toBeNull();
  });

  it("stops on refusals and endings", () => {
    expect(outcomeOf({ status: "refused", billing: free })).toBe("refused");
    expect(outcomeOf({ status: "cancelled", billing: free })).toBe("cancelled");
    expect(outcomeOf({ status: "expired", billing: free })).toBe("cancelled");
    for (const status of ["suspended", "refunded", "reversed"]) expect(outcomeOf({ status, billing: free })).toBe("failed");
  });

  it("keeps waiting while PayPal or the webhook is on its way", () => {
    for (const status of ["approval_pending", "approved", "none"]) expect(outcomeOf({ status, billing: free })).toBeNull();
  });
});
