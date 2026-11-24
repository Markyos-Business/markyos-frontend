import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api/client";
import { billingCopy } from "../copy";
import { PROMO_REFUSALS } from "../types";
import { discountLine, normaliseCode, promoPriceLine, promoRefusal } from "./promo";

const terms = { code: "MRK-7KQ4-XP2M", label: "50% for 3 months", firstAmount: 1450, regularAmount: 2900, currency: "usd" };
const nbsp = (s: string) => s.replace(/\s/g, " ");

describe("normaliseCode", () => {
  it("upper-cases and drops spaces", () => {
    expect(normaliseCode("  mrk-7kq4-xp2m ")).toBe("MRK-7KQ4-XP2M");
    expect(normaliseCode("early 50")).toBe("EARLY50");
  });
  it("puts back the dashes of a generated code typed without them", () => {
    expect(normaliseCode("mrk7kq4xp2m")).toBe("MRK-7KQ4-XP2M");
  });
  it("leaves other codes as typed", () => {
    expect(normaliseCode("MRK-7KQ4")).toBe("MRK-7KQ4");
    expect(normaliseCode("")).toBe("");
  });
});

describe("promoRefusal", () => {
  it("reads each known reason from a 400", () => {
    for (const code of PROMO_REFUSALS) expect(promoRefusal(new ApiError("no", 400, {}, { code, detail: "x" }))).toBe(code);
  });
  it("calls an unnamed 400 unknown", () => {
    expect(promoRefusal(new ApiError("no", 400, {}, { code: "something_new" }))).toBe("unknown");
    expect(promoRefusal(new ApiError("no", 400, {}, null))).toBe("unknown");
  });
  it("leaves throttling, outages and other errors to errorText", () => {
    expect(promoRefusal(new ApiError("slow down", 429))).toBeNull();
    expect(promoRefusal(new ApiError("down", 0))).toBeNull();
    expect(promoRefusal(new Error("x"))).toBeNull();
  });
  it("has one sentence per reason in both languages", () => {
    for (const isAr of [false, true]) {
      const reasons = billingCopy(isAr).promo.reasons;
      const lines = PROMO_REFUSALS.map((r) => reasons[r]);
      expect(new Set(lines).size).toBe(PROMO_REFUSALS.length);
      for (const line of lines) expect(line).toMatch(/[.]$/);
    }
  });
});

describe("promoPriceLine", () => {
  it("words a discount for some months", () => {
    expect(nbsp(promoPriceLine({ ...terms, months: 3 }, "en"))).toBe("USD 14.50 a month for 3 months, then USD 29 a month");
  });
  it("words the first month only", () => {
    expect(nbsp(promoPriceLine({ ...terms, months: 1 }, "en"))).toBe("USD 14.50 for the first month, then USD 29 a month");
  });
  it("words a discount for as long as the plan runs", () => {
    expect(nbsp(promoPriceLine({ ...terms, months: null }, "en"))).toBe("USD 14.50 a month");
  });
  it("words Arabic with its plural forms", () => {
    expect(promoPriceLine({ ...terms, months: 2 }, "ar")).toContain("لمدة شهرين");
    expect(promoPriceLine({ ...terms, months: 3 }, "ar")).toContain("لمدة 3 أشهر");
    expect(promoPriceLine({ ...terms, months: 12 }, "ar")).toContain("لمدة 12 شهرًا");
  });
});

describe("discountLine", () => {
  const date = () => "22 Feb 2027";
  it("uses the discount's regular price when sent", () => {
    const line = discountLine({ code: "EARLY50", label: "", amount: 1450, until: 1, regularAmount: 2900 }, 1450, "usd", "en", date);
    expect(nbsp(line!)).toBe("Discount EARLY50: USD 14.50 until 22 Feb 2027, then USD 29 a month");
  });
  it("falls back to the subscription's amount", () => {
    const line = discountLine({ code: "EARLY50", label: "", amount: 1450, until: 1 }, 2900, "usd", "en", date);
    expect(nbsp(line!)).toContain("then USD 29 a month");
  });
  it("has no end for a discount that lasts", () => {
    expect(nbsp(discountLine({ code: "EARLY50", label: "", amount: 1450, until: null }, null, "usd", "en", date)!)).toBe("Discount EARLY50: USD 14.50 a month");
  });
  it("shows nothing rather than guess a regular price", () => {
    expect(discountLine({ code: "EARLY50", label: "", amount: 1450, until: 1 }, null, "usd", "en", date)).toBeNull();
  });
});
