import { describe, expect, it } from "vitest";
import { formatMoney, formatNumber, formatPercent } from "./format";
import { plural } from "./plural";

const files = { zero: "لا توجد ملفات", one: "ملف واحد", two: "ملفان", few: "{n} ملفات", many: "{n} ملفًا", other: "{n} ملف" };

describe("plural", () => {
  it("covers every Arabic form", () => {
    expect(plural("ar", 0, files)).toBe("لا توجد ملفات");
    expect(plural("ar", 1, files)).toBe("ملف واحد");
    expect(plural("ar", 2, files)).toBe("ملفان");
    expect(plural("ar", 3, files)).toBe("3 ملفات");
    expect(plural("ar", 11, files)).toBe("11 ملفًا");
    expect(plural("ar", 100, files)).toBe("100 ملف");
  });
  it("falls back to other and formats the count", () => {
    expect(plural("en", 1, { one: "{n} file", other: "{n} files" })).toBe("1 file");
    expect(plural("en", 0, { one: "{n} file", other: "{n} files" })).toBe("0 files");
    expect(plural("en", 1200, { one: "{n} file", other: "{n} files" })).toBe("1,200 files");
    expect(plural("ar", 5, { other: "{n} ملف" })).toBe("5 ملف");
  });
});

describe("format", () => {
  it("keeps Western digits in Arabic", () => {
    expect(formatNumber(84500, "ar")).toMatch(/^84[,٬]500$/);
    expect(formatNumber(84500, "en")).toBe("84,500");
  });
  it("formats percent and money by code", () => {
    expect(formatPercent(0.42, "en")).toBe("42%");
    expect(formatMoney(84500, "SAR", "en").replace(/\s/g, " ")).toBe("SAR 84,500");
    expect(formatMoney(19.5, "USD", "en").replace(/\s/g, " ")).toBe("USD 19.50");
    expect(formatMoney(29, "USD", "ar")).toMatch(/29/);
  });
});
