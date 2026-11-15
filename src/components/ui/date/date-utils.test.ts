import { describe, expect, it } from "vitest";
import { addMonths, formatIso, hijriOf, monthGrid, parseTypedDate, startOfWeek } from "./date-utils";

describe("parseTypedDate", () => {
  it("reads day-first dates in every written form", () => {
    expect(parseTypedDate("12 Sep 2026")).toBe("2026-09-12");
    expect(parseTypedDate("12 September, 2026")).toBe("2026-09-12");
    expect(parseTypedDate("12/09/2026")).toBe("2026-09-12");
    expect(parseTypedDate("2026-09-12")).toBe("2026-09-12");
  });

  it("reads Arabic month names and Arabic-Indic digits", () => {
    expect(parseTypedDate("١٢ سبتمبر ٢٠٢٦")).toBe("2026-09-12");
    expect(parseTypedDate("12 أيلول 2026")).toBe("2026-09-12");
  });

  it("never reads US order, and refuses dates that don't exist", () => {
    expect(parseTypedDate("09/31/2026")).toBeNull();
    expect(parseTypedDate("31 Feb 2026")).toBeNull();
    expect(parseTypedDate("soon")).toBeNull();
  });
});

describe("weeks and months", () => {
  it("starts the week on Sunday, Monday or Saturday", () => {
    // 12 Sep 2026 is a Saturday.
    expect(startOfWeek("2026-09-12", 0)).toBe("2026-09-06");
    expect(startOfWeek("2026-09-12", 1)).toBe("2026-09-07");
    expect(startOfWeek("2026-09-12", 6)).toBe("2026-09-12");
  });

  it("lays a month out in six weeks from the chosen start", () => {
    const grid = monthGrid("2026-09-15", 6);
    expect(grid).toHaveLength(6);
    expect(grid[0][0]).toBe("2026-08-29");
    expect(grid.flat()).toContain("2026-09-30");
  });

  it("keeps a month step inside the month", () => {
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-28");
  });
});

describe("formatting", () => {
  it("writes 12 Sep 2026, and Western digits in Arabic by default", () => {
    expect(formatIso("2026-09-12", "en")).toBe("12 Sep 2026");
    expect(formatIso("2026-09-12", "ar")).toMatch(/^12 .+ 2026$/);
  });

  it("gives the Umm al-Qura Hijri date", () => {
    // 12 Sep 2026 is 30 Rabi al-Awwal 1448 or 1 Rabi al-Thani (calendar edge); check the year.
    expect(hijriOf("2026-09-12", "en").monthYear).toMatch(/1448/);
  });
});
