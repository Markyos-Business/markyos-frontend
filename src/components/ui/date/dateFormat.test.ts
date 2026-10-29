import { describe, expect, it } from "vitest";
import { formatDate, formatDayMonth, parseDate } from "./dateFormat";

const d = new Date("2026-06-23T14:30:00Z");

describe("parseDate", () => {
  it("returns null for missing or invalid input", () => {
    expect(parseDate(null)).toBeNull();
    expect(parseDate("")).toBeNull();
    expect(parseDate("not a date")).toBeNull();
  });
  it("accepts strings and dates", () => {
    expect(parseDate("2026-06-23")?.getUTCFullYear()).toBe(2026);
    expect(parseDate(d)).toBe(d);
  });
});

describe("formatDate", () => {
  it("formats the absolute styles", () => {
    expect(formatDate(d, "short", "en-GB")).toBe("23 Jun 2026");
    expect(formatDate(d, "long", "en-GB")).toBe("23 June 2026");
  });
  it("capitalises am/pm", () => {
    expect(formatDate(d, "datetime", "en-GB")).toMatch(/PM|AM/);
  });
  it("formats relative time against a fixed now", () => {
    expect(formatDate(new Date(d.getTime() - 5 * 60_000), "relative", "en", d.getTime())).toBe("5 minutes ago");
    expect(formatDate(new Date(d.getTime() - 86_400_000), "relative", "en", d.getTime())).toBe("yesterday");
  });
});

describe("formatDayMonth", () => {
  const sep = new Date("2026-09-12T10:00:00Z");
  it("writes Sep, not Sept", () => expect(formatDayMonth(sep, "en")).toBe("12 Sep"));
  it("adds the year when asked", () => expect(formatDayMonth(sep, "en", true)).toBe("12 Sep 2026"));
  it("keeps Western digits in Arabic", () => expect(formatDayMonth(sep, "ar")).toMatch(/^12 \S+$/));
});
