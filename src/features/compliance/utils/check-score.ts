import type { LintFinding, ParityFinding } from "./copy-lint";

/** A per-language finding names its rule; a parity finding (EN against AR) only has its message. */
type Finding = Pick<LintFinding, "severity" | "message" | "arMessage"> & Partial<Pick<LintFinding, "rule" | "arRule">>;

/**
 * A content check's outcome, the part that may be saved (Overview "Voice this
 * month", 22 Nov 2026). The text itself is never part of it.
 *
 * Score: 100, less 15 for each error and 5 for each warning; suggestions
 * don't count. Never below 0. The top note is the rule that fired most,
 * in both languages; empty when nothing was flagged.
 */
export const ERROR_COST = 15;
export const WARNING_COST = 5;

export type CheckOutcome = {
  score: number;
  topNote: string;
  topNoteAr: string;
  language: "en" | "ar" | "both";
};

export function checkOutcome(en: string, ar: string, findings: (LintFinding | ParityFinding)[]): CheckOutcome {
  const errors = findings.filter((f) => f.severity === "error").length;
  const warnings = findings.filter((f) => f.severity === "warning").length;
  const score = Math.max(0, 100 - ERROR_COST * errors - WARNING_COST * warnings);
  const counts = new Map<string, { n: number; rule: string; arRule: string }>();
  for (const f of findings as Finding[]) {
    const rule = f.rule ?? f.message;
    const arRule = f.arRule ?? f.arMessage;
    const seen = counts.get(rule) ?? { n: 0, rule, arRule };
    seen.n += 1;
    counts.set(rule, seen);
  }
  const top = [...counts.values()].sort((a, b) => b.n - a.n)[0];
  const hasEn = en.trim().length > 0;
  const hasAr = ar.trim().length > 0;
  return {
    score,
    topNote: top?.rule ?? "",
    topNoteAr: top?.arRule ?? "",
    language: hasEn && hasAr ? "both" : hasAr ? "ar" : "en",
  };
}
