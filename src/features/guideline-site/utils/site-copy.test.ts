import { describe, expect, it } from "vitest";
import type { Workspace } from "@/types";
import { siteCopy, updatedLabel } from "./site-copy";

function ws(over: { purpose?: string; purposeAr?: string; positioning?: string; tagline?: string; taglineAr?: string; publishedAt?: number | null; updatedAt?: number } = {}): Workspace {
  return {
    name: "Wadi Rum Coffee",
    tagline: over.tagline ?? "",
    taglineAr: over.taglineAr,
    publishedAt: over.publishedAt ?? null,
    updatedAt: over.updatedAt ?? Date.UTC(2026, 10, 20),
    strategy: {
      purpose: over.purpose ?? "",
      purposeAr: over.purposeAr ?? "",
      positioningStatement: over.positioning ?? "",
      positioningStatementAr: "",
    },
  } as unknown as Workspace;
}

describe("siteCopy", () => {
  it("opens on the purpose, with the tagline under it", () => {
    const c = siteCopy(ws({ purpose: "Coffee roasted where it grows.", tagline: "Roasted in Wadi Rum" }), "en");
    expect(c.heroTitle).toBe("Coffee roasted where it grows.");
    expect(c.openingLine).toBe("Roasted in Wadi Rum");
    expect(c.subtitle).toBe("Roasted in Wadi Rum");
  });

  it("falls back to the tagline, then the brand's name, never generic copy", () => {
    expect(siteCopy(ws({ tagline: "Roasted in Wadi Rum", positioning: "The desert roaster." }), "en")).toMatchObject({
      heroTitle: "Roasted in Wadi Rum",
      openingLine: "The desert roaster.",
    });
    const bare = siteCopy(ws(), "en");
    expect(bare.heroTitle).toBe("Wadi Rum Coffee");
    expect(bare.openingLine).toBe("");
    expect(bare.subtitle).toBe("Brand guidelines");
  });

  it("reads the Arabic copy in Arabic, and the English where there is none", () => {
    const c = siteCopy(ws({ purpose: "Coffee roasted where it grows.", purposeAr: "قهوة تُحمَّص حيث تُزرع.", tagline: "Roasted in Wadi Rum" }), "ar");
    expect(c.heroTitle).toBe("قهوة تُحمَّص حيث تُزرع.");
    expect(c.openingLine).toBe("Roasted in Wadi Rum");
    expect(siteCopy(ws(), "ar").subtitle).toBe("دليل الهوية");
  });
});

describe("updatedLabel", () => {
  it("dates the last publish, day first, and the last edit when never published", () => {
    expect(updatedLabel(ws({ publishedAt: Date.UTC(2026, 8, 12, 12) }), "en")).toBe("Updated 12 Sep 2026");
    expect(updatedLabel(ws({ updatedAt: Date.UTC(2026, 11, 31, 12) }), "en")).toBe("Updated 31 Dec 2026");
    expect(updatedLabel(ws({ publishedAt: Date.UTC(2026, 8, 12, 12) }), "ar")).toMatch(/^آخر تحديث 12 .+ 2026$/);
  });
});
