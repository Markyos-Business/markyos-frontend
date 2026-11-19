import { describe, expect, it } from "vitest";
import type { BrandStrategy } from "@/types";
import { resolveStrategy } from "./strategy-lang";

const strategy = {
  purpose: "", purposeAr: "نصمم بالعربية أولًا.",
  mission: "Ship bilingual guides.", missionAr: "",
  vision: "", visionAr: "", targetAudienceSummary: "", targetAudienceSummaryAr: "",
  positioningStatement: "", positioningStatementAr: "", uvp: "", uvpAr: "",
  coreValues: [{ id: "v1", title: "", titleAr: "العربية أصل لا ترجمة", description: "", descriptionAr: "الإنجليزية شريكة." }],
  personas: [], voiceTraits: [], competitorColumns: [], competitors: [],
} as unknown as BrandStrategy;

describe("resolveStrategy", () => {
  it("shows Arabic-only text to an English reader instead of a blank", () => {
    const en = resolveStrategy(strategy, "en");
    expect(en.purpose).toBe("نصمم بالعربية أولًا.");
    expect(en.coreValues[0]).toMatchObject({ title: "العربية أصل لا ترجمة", description: "الإنجليزية شريكة." });
    expect(en.mission).toBe("Ship bilingual guides.");
  });
  it("shows English-only text to an Arabic reader", () => {
    expect(resolveStrategy(strategy, "ar").mission).toBe("Ship bilingual guides.");
  });
});
