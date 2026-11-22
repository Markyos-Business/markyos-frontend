import { describe, expect, it } from "vitest";
import { checkOutcome } from "./check-score";
import type { LintFinding } from "./copy-lint";

const f = (severity: LintFinding["severity"], rule: string, arRule = `ar ${rule}`): LintFinding => ({
  id: rule + Math.random(),
  severity,
  rule,
  arRule,
  message: "",
  arMessage: "",
  start: 0,
  end: 1,
  excerpt: "",
});

describe("checkOutcome", () => {
  it("is 100 with nothing flagged, and says nothing", () => {
    expect(checkOutcome("Hello", "", [])).toEqual({ score: 100, topNote: "", topNoteAr: "", language: "en" });
  });

  it("takes 15 per error and 5 per warning, ignores suggestions, never below 0", () => {
    expect(checkOutcome("a", "ب", [f("error", "Banned"), f("warning", "Tatweel"), f("suggestion", "Tip")]).score).toBe(80);
    expect(checkOutcome("a", "", Array.from({ length: 8 }, () => f("error", "Banned"))).score).toBe(0);
  });

  it("names the rule that fired most, in both languages, and the languages checked", () => {
    const out = checkOutcome("", "نص", [f("warning", "Tatweel", "تطويل"), f("warning", "Tatweel", "تطويل"), f("error", "Banned", "محظور")]);
    expect(out).toMatchObject({ topNote: "Tatweel", topNoteAr: "تطويل", language: "ar" });
  });
});
