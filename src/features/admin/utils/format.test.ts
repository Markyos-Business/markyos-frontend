import { describe, expect, it } from "vitest";
import { initialsOf, relativeTime, shortDate } from "./format";

describe("initialsOf", () => {
  it("takes the first and last word", () => expect(initialsOf("Nadeen Al Haddad")).toBe("NH"));
  it("takes two letters of a single word", () => expect(initialsOf("omar")).toBe("OM"));
  it("copes with an empty name", () => expect(initialsOf("  ")).toBe("?"));
});

describe("relativeTime", () => {
  const now = new Date("2026-10-29T12:00:00Z");
  const ago = (minutes: number) => new Date(now.getTime() - minutes * 60_000).toISOString();

  it("says now under a minute", () => expect(relativeTime(ago(0), "en", now)).toBe("now"));
  it("counts minutes, hours and days", () => {
    expect(relativeTime(ago(10), "en", now)).toBe("10m");
    expect(relativeTime(ago(125), "en", now)).toBe("2h");
    expect(relativeTime(ago(3 * 24 * 60), "en", now)).toBe("3d");
  });
  it("uses Arabic units", () => expect(relativeTime(ago(10), "ar", now)).toBe("10د"));
  it("falls back to the date after a month", () => expect(relativeTime("2026-09-12T10:00:00Z", "en", now)).toBe("12 Sep"));
});

describe("shortDate", () => {
  const now = new Date("2026-10-29T12:00:00Z");
  it("drops this year", () => expect(shortDate("2026-09-12T10:00:00Z", "en", now)).toBe("12 Sep"));
  it("keeps another year", () => expect(shortDate("2025-12-31T10:00:00Z", "en", now)).toBe("31 Dec 2025"));
  it("keeps Western digits in Arabic", () => expect(shortDate("2026-09-12T10:00:00Z", "ar", now)).toMatch(/^12 /));
});
