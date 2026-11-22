import { describe, expect, it } from "vitest";
import {
  checkoutStatus,
  compBounds,
  compRunning,
  diffSummary,
  endOfDay,
  humanize,
  limitDraft,
  limitInput,
  validateComp,
  validateLimits,
} from "./billing";

const NOW = new Date(2026, 10, 22, 15, 30);

describe("checkoutStatus", () => {
  it("names each status with a tone", () => {
    expect(checkoutStatus("active")).toEqual({ key: "active", tone: "success" });
    expect(checkoutStatus("APPROVAL_PENDING")).toEqual({ key: "pending", tone: "warning" });
    expect(checkoutStatus("approved").key).toBe("pending");
    expect(checkoutStatus("suspended")).toEqual({ key: "suspended", tone: "danger" });
    expect(checkoutStatus("cancelled").key).toBe("cancelled");
    expect(checkoutStatus("canceled").key).toBe("cancelled");
    expect(checkoutStatus("expired").key).toBe("expired");
    expect(checkoutStatus("paid").key).toBe("paid");
    expect(checkoutStatus("refunded").key).toBe("refunded");
    expect(checkoutStatus("ended").key).toBe("ended");
    expect(checkoutStatus("something_new").key).toBe("other");
    expect(checkoutStatus(null).key).toBe("other");
  });

  it("a refused checkout is refused whatever its status", () => {
    expect(checkoutStatus("active", true)).toEqual({ key: "refused", tone: "danger" });
  });
});

describe("compRunning", () => {
  it("is true only for an active comp", () => {
    expect(compRunning({ provider: "comp", status: "active" })).toBe(true);
    expect(compRunning({ provider: "comp", status: "ended" })).toBe(false);
    expect(compRunning({ provider: "paypal", status: "active" })).toBe(false);
  });
});

describe("comp dates", () => {
  it("runs from tomorrow to two years out", () => {
    expect(compBounds(NOW)).toEqual({ min: "2026-11-23", max: "2028-11-22" });
  });

  it("ends at the end of the chosen day", () => {
    const end = new Date(endOfDay("2026-12-18"));
    expect([end.getFullYear(), end.getMonth(), end.getDate(), end.getHours(), end.getMinutes()]).toEqual([2026, 11, 18, 23, 59]);
  });
});

describe("validateComp", () => {
  it("needs a reason and an end date", () => {
    expect(validateComp({ reason: "  ", expiresOn: null }, NOW)).toEqual({ reason: "required", expiresOn: "required" });
  });

  it("refuses today, the past, and over two years", () => {
    expect(validateComp({ reason: "Partner", expiresOn: "2026-11-22" }, NOW)).toEqual({ expiresOn: "past" });
    expect(validateComp({ reason: "Partner", expiresOn: "2028-11-23" }, NOW)).toEqual({ expiresOn: "tooFar" });
  });

  it("takes tomorrow and exactly two years", () => {
    expect(validateComp({ reason: "Partner", expiresOn: "2026-11-23" }, NOW)).toEqual({});
    expect(validateComp({ reason: "Partner", expiresOn: "2028-11-22" }, NOW)).toEqual({});
  });

  it("refuses a reason over 500 characters", () => {
    expect(validateComp({ reason: "x".repeat(501), expiresOn: "2027-01-01" }, NOW)).toEqual({ reason: "tooLong" });
  });
});

describe("limits", () => {
  it("starts from the override, or the default", () => {
    expect(limitDraft(undefined, "brands")).toEqual({ choice: "default", value: null });
    expect(limitDraft({ brands: 3, editors: null, override: false }, "brands")).toEqual({ choice: "default", value: null });
    expect(limitDraft({ brands: 5, editors: null, override: true }, "brands")).toEqual({ choice: "number", value: 5 });
    expect(limitDraft({ brands: 5, editors: null, override: true }, "editors")).toEqual({ choice: "unlimited", value: null });
  });

  it("sends a number, null for unlimited, or default", () => {
    expect(limitInput({ choice: "default", value: 4 })).toBe("default");
    expect(limitInput({ choice: "unlimited", value: 4 })).toBeNull();
    expect(limitInput({ choice: "number", value: 0 })).toBe(0);
    expect(limitInput({ choice: "number", value: 7 })).toBe(7);
    expect(limitInput({ choice: "number", value: null })).toBeUndefined();
    expect(limitInput({ choice: "number", value: -1 })).toBeUndefined();
    expect(limitInput({ choice: "number", value: 1.5 })).toBeUndefined();
  });

  it("needs a reason and a number when a number is chosen", () => {
    expect(validateLimits({ brands: { choice: "number", value: null }, editors: { choice: "default", value: null }, reason: "" })).toEqual({
      brands: "number",
      reason: "required",
    });
    expect(validateLimits({ brands: { choice: "number", value: 5 }, editors: { choice: "unlimited", value: null }, reason: "Agency deal" })).toEqual({});
  });
});

describe("diffSummary", () => {
  it("lists only what changed, in name order", () => {
    expect(diffSummary({ brands: 3, editors: 0, note: "x" }, { brands: null, editors: 0, note: "x", status: "active" })).toEqual([
      { key: "brands", from: "3", to: "—" },
      { key: "status", from: "—", to: "active" },
    ]);
  });

  it("copes with a missing side", () => {
    expect(diffSummary(null, { plan: "subscription" })).toEqual([{ key: "plan", from: "—", to: "subscription" }]);
    expect(diffSummary(null, null)).toEqual([]);
  });
});

describe("humanize", () => {
  it("turns a code into a sentence-case phrase", () => {
    expect(humanize("comp_created")).toBe("Comp created");
    expect(humanize("checkout.sync")).toBe("Checkout sync");
    expect(humanize("")).toBe("");
  });
});
