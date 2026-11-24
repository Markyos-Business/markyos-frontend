import { describe, expect, it } from "vitest";
import type { Plans } from "@/features/billing";
import { DEFAULT_GENERATE, discountLabel, discountedCents, previewLines, toGenerateRequest, usesLabel, validateGenerate, type GenerateForm } from "./promo";
import { endOfDay } from "./billing";

const plans = {
  currency: "usd",
  interval: "month",
  perBrand: true,
  free: { brands: 1, editors: 0 },
  freeRulesApply: true,
  types: {
    studio: { monthly: 2900, limits: { brands: null, editors: null } },
    freelancer: { monthly: 1500, limits: { brands: null, editors: null } },
    company: { monthly: 4900, limits: { brands: null, editors: null } },
  },
} as Plans;
const label = (t: string) => t[0].toUpperCase() + t.slice(1);
const form = (over: Partial<GenerateForm> = {}): GenerateForm => ({ ...DEFAULT_GENERATE, percentOff: 50, note: "Launch partners", ...over });
const plain = (lines: string[]) => lines.map((l) => l.replace(/\s/g, " "));
const today = new Date(2026, 10, 24);

describe("previewLines", () => {
  it("shows each type's price for the first months, then the full one", () => {
    expect(plain(previewLines(form({ accountTypes: ["studio"] }), plans, "en", label))).toEqual(["Studio: USD 14.50 a month for 3 months, then USD 29"]);
  });
  it("covers every type when none is ticked", () => {
    expect(previewLines(form(), plans, "en", label)).toHaveLength(3);
  });
  it("words once and forever", () => {
    expect(plain(previewLines(form({ duration: "once", accountTypes: ["studio"] }), plans, "en", label))).toEqual(["Studio: USD 14.50 for the first month, then USD 29"]);
    expect(plain(previewLines(form({ duration: "forever", accountTypes: ["studio"] }), plans, "en", label))).toEqual(["Studio: USD 14.50 a month"]);
  });
  it("takes an amount off in dollars", () => {
    expect(plain(previewLines(form({ kind: "amount", amountOff: 10, accountTypes: ["company"] }), plans, "en", label))).toEqual(["Company: USD 39 a month for 3 months, then USD 49"]);
  });
  it("is empty until the discount is valid", () => {
    expect(previewLines(form({ percentOff: null }), plans, "en", label)).toEqual([]);
    expect(previewLines(form({ months: 30 }), plans, "en", label)).toEqual([]);
  });
  it("words Arabic", () => {
    expect(previewLines(form({ accountTypes: ["studio"] }), plans, "ar", () => "استوديو")[0]).toContain("لمدة 3 أشهر");
  });
});

describe("validateGenerate", () => {
  it("accepts the defaults with a discount and a note", () => {
    expect(validateGenerate(form(), today, plans)).toEqual({});
  });
  it("checks the counts, the discount, the months, the date and the note", () => {
    expect(validateGenerate(form({ count: 0, usesPerCode: 0, percentOff: 100, months: 25, expiresOn: "2026-11-23", note: " " }), today)).toEqual({
      count: "range",
      usesPerCode: "range",
      discount: "percent",
      months: "range",
      expiresOn: "past",
      note: "required",
    });
    expect(validateGenerate(form({ count: 501 }), today).count).toBe("range");
    expect(validateGenerate(form({ kind: "amount", amountOff: 0 }), today).discount).toBe("amount");
  });
  it("allows unlimited uses and today as the last day", () => {
    expect(validateGenerate(form({ usesPerCode: null, expiresOn: "2026-11-24" }), today)).toEqual({});
  });
  it("refuses a discount that leaves a type under USD 1", () => {
    expect(validateGenerate(form({ kind: "amount", amountOff: 14.5 }), today, plans).discount).toEqual({ belowFloor: "freelancer" });
    expect(validateGenerate(form({ kind: "amount", amountOff: 14.5, accountTypes: ["studio"] }), today, plans).discount).toBeUndefined();
  });
});

describe("toGenerateRequest", () => {
  it("sends the plan's defaults with nested discount and duration", () => {
    expect(toGenerateRequest(form())).toEqual({
      count: 1,
      usesPerCode: 1,
      discount: { kind: "percent", value: 50 },
      duration: { kind: "repeating", months: 3 },
      firstPurchaseOnly: true,
      note: "Launch partners",
    });
  });
  it("sends cents, the end of the last day, and only some types", () => {
    const request = toGenerateRequest(form({ kind: "amount", amountOff: 5.5, duration: "forever", expiresOn: "2027-01-31", accountTypes: ["studio", "company"], usesPerCode: null }));
    expect(request).toMatchObject({
      discount: { kind: "amount", value: 550 },
      duration: { kind: "forever" },
      expiresAt: endOfDay("2027-01-31"),
      accountTypes: ["studio", "company"],
      usesPerCode: null,
    });
    expect(request.duration).not.toHaveProperty("months");
  });
  it("sends once without months", () => {
    expect(toGenerateRequest(form({ duration: "once" })).duration).toEqual({ kind: "once" });
  });
  it("leaves out account types when all are ticked", () => {
    expect(toGenerateRequest(form({ accountTypes: ["studio", "freelancer", "company"] }))).not.toHaveProperty("accountTypes");
  });
});

describe("discountedCents", () => {
  it("rounds a percent to the cent", () => {
    expect(discountedCents(2900, { kind: "percent", percentOff: 33, amountOff: null })).toBe(1943);
  });
});

describe("discountLabel", () => {
  it("words the discount from its fields in both languages", () => {
    const discount = { kind: "percent" as const, value: 50, duration: "repeating" as const, months: 3 };
    expect(discountLabel(discount, "en")).toBe("50% off for 3 months");
    expect(discountLabel(discount, "ar")).toBe("خصم 50٪ لمدة 3 أشهر");
    expect(discountLabel({ kind: "amount", value: 500, duration: "once", months: 1 }, "en").replace(/\s/g, " ")).toBe("USD 5 off the first month");
    expect(discountLabel({ kind: "percent", value: 20, duration: "forever", months: null }, "en")).toBe("20% off forever");
    expect(discountLabel({ kind: "percent", value: 20, duration: "forever", months: null }, "ar")).toBe("خصم 20٪ دائمًا");
  });
});

describe("usesLabel", () => {
  it("says used of the limit, with uses held by unpaid checkouts", () => {
    expect(usesLabel({ used: 1, reserved: 0, limit: 1 }, "en")).toBe("1 of 1");
    expect(usesLabel({ used: 2, reserved: 1, limit: 5 }, "en")).toBe("2 of 5 (1 reserved)");
    expect(usesLabel({ used: 3, reserved: 0, limit: null }, "en")).toBe("3 of no limit");
    expect(usesLabel({ used: 0, reserved: 1, limit: 1 }, "ar")).toBe("0 من 1 (1 محجوز)");
  });
});
