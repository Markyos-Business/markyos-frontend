import { describe, expect, it } from "vitest";
import type { BrandStrategy } from "@/types";
import { missingIn, strategyParity } from "./strategy-lang";

/** A strategy with nothing in it; tests fill in only what they check. */
const blank = (over: Partial<BrandStrategy> = {}): BrandStrategy =>
  ({
    purpose: "",
    mission: "",
    vision: "",
    targetAudienceSummary: "",
    positioningStatement: "",
    uvp: "",
    objectives: [],
    coreValues: [],
    personas: [],
    competitors: [],
    competitorColumns: [],
    positioningOptions: [],
    voiceTraits: [],
    ...over,
  }) as unknown as BrandStrategy;

describe("strategyParity", () => {
  it("counts a field written in one language against the other", () => {
    const p = strategyParity(blank({ purpose: "<p>Coffee from Wadi Rum</p>", visionAr: "رؤيتنا" }));
    expect(p.purpose).toEqual({ en: 0, ar: 1 });
    expect(p["vision-mission"]).toEqual({ en: 1, ar: 0 });
  });

  it("does not count a field blank in both, or empty rich text", () => {
    const p = strategyParity(blank({ purpose: "<p></p>", purposeAr: "<p>&nbsp;</p>" }));
    expect(p.purpose).toEqual({ en: 0, ar: 0 });
  });

  it("counts list items field by field, which an item count never could", () => {
    const p = strategyParity(
      blank({
        coreValues: [
          { id: "v1", title: "Craft", description: "We roast by hand.", titleAr: "الحرفة" },
          { id: "v2", title: "Origin", description: "", titleAr: "الأصل", descriptionAr: "" },
        ] as BrandStrategy["coreValues"],
      }),
    );
    // v1's description has no Arabic; every title does.
    expect(p["core-values"]).toEqual({ en: 0, ar: 1 });
  });

  it("checks competitor cells key by key", () => {
    const p = strategyParity(
      blank({
        competitors: [{ id: "c1", name: "Bean Co", nameAr: "بين كو", notes: "", cells: { price: "High", tone: "Formal" }, cellsAr: { price: "مرتفع" } }],
      } as Partial<BrandStrategy>),
    );
    expect(p.competitive).toEqual({ en: 0, ar: 1 });
  });

  it("totals what is still to write in one language", () => {
    const p = strategyParity(blank({ purpose: "Why", uvp: "What", missionAr: "الرسالة" }));
    expect(missingIn(p, "ar")).toBe(2);
    expect(missingIn(p, "en")).toBe(1);
  });
});
