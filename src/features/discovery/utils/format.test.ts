import { describe, expect, it } from "vitest";
import { formatAgo, formatDay, formatDuration } from "./format";

const now = Date.parse("2026-09-20T12:00:00Z");
const ago = (ms: number) => new Date(now - ms).toISOString();

describe("discovery dates", () => {
  it("writes relative times as 10m / 2hr / 2d", () => {
    expect(formatAgo(ago(10 * 60_000), false, now)).toBe("10m");
    expect(formatAgo(ago(2 * 3_600_000), false, now)).toBe("2hr");
    expect(formatAgo(ago(2 * 86_400_000), false, now)).toBe("2d");
    expect(formatAgo(ago(10 * 60_000), true, now)).toBe("10 د");
  });

  it("writes dates day first, with the year only when it differs", () => {
    expect(formatDay("2026-09-12T10:00:00Z", false, now)).toBe("12 Sep");
    expect(formatDay("2025-12-31T10:00:00Z", false, now)).toBe("31 Dec 2025");
  });

  it("uses Western numerals and the Gregorian calendar in Arabic", () => {
    const arabic = formatDay("2026-09-12T10:00:00Z", true, now);
    expect(arabic).toMatch(/12/);
    expect(arabic).not.toMatch(/[٠-٩]/);
  });

  it("writes durations compactly", () => {
    expect(formatDuration(35 * 60, false)).toBe("35m");
    expect(formatDuration(2 * 86400 + 4 * 3600, false)).toBe("2d 4hr");
    expect(formatDuration(null, false)).toBe("—");
  });
});
