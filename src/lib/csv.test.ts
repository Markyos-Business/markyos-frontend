import { describe, expect, it } from "vitest";
import { csvCell, toCsv } from "./csv";

describe("csv", () => {
  it("quotes commas, quotes and line breaks", () => {
    expect(csvCell('say "hi", then\nleave')).toBe('"say ""hi"", then\nleave"');
  });
  it("defuses spreadsheet formulas", () => {
    expect(csvCell("=SUM(A1)")).toBe("'=SUM(A1)");
    expect(csvCell("@cmd")).toBe("'@cmd");
  });
  it("keeps Arabic and numbers as they are, empty for null", () => {
    expect(toCsv([["الدخول", 12, null]])).toBe("الدخول,12,");
  });
});
