import { describe, expect, it } from "vitest";
import { nextEnabled, tabStop } from "./calendar";
import { allowedRange } from "./date-range-picker";

const days = Array.from({ length: 35 }, (_, i) => `2026-09-${String(i + 1).padStart(2, "0")}`).slice(0, 30);
const inMonth = () => true;

describe("calendar keyboard", () => {
  it("puts the Tab stop on an enabled day when the preferred one is blocked", () => {
    const min = "2026-09-15";
    expect(tabStop(days, "2026-09-01", (d) => d < min, inMonth)).toBe("2026-09-15");
  });

  it("keeps the preferred day when it can be chosen", () => {
    expect(tabStop(days, "2026-09-10", () => false, inMonth)).toBe("2026-09-10");
  });

  it("has no Tab stop when nothing can be chosen", () => {
    expect(tabStop(days, "2026-09-10", () => true, inMonth)).toBeNull();
  });

  it("skips disabled days (Fridays) in the direction of travel", () => {
    const friday = (d: string) => new Date(`${d}T00:00:00Z`).getUTCDay() === 5;
    expect(nextEnabled("2026-09-04", 1, friday)).toBe("2026-09-05");
    expect(nextEnabled("2026-09-04", -1, friday)).toBe("2026-09-03");
  });

  it("stops at max instead of landing past it", () => {
    expect(nextEnabled("2026-10-01", 1, (d) => d > "2026-09-30", 60)).toBeNull();
  });
});

describe("range presets within limits", () => {
  const none = () => false;
  it("clips a preset to min and max", () => {
    expect(allowedRange({ from: "2026-09-01", to: "2026-09-30" }, "2026-09-10", "2026-09-20", (d) => d < "2026-09-10" || d > "2026-09-20")).toEqual({ from: "2026-09-10", to: "2026-09-20" });
  });
  it("moves ends past disabled days", () => {
    const blocked = (d: string) => d === "2026-09-01" || d === "2026-09-07";
    expect(allowedRange({ from: "2026-09-01", to: "2026-09-07" }, undefined, undefined, blocked)).toEqual({ from: "2026-09-02", to: "2026-09-06" });
  });
  it("is null when nothing of it is allowed", () => {
    expect(allowedRange({ from: "2026-09-01", to: "2026-09-07" }, "2026-10-01", undefined, (d) => d < "2026-10-01")).toBeNull();
    expect(allowedRange({ from: "2026-09-01", to: "2026-09-01" }, undefined, undefined, none)).toEqual({ from: "2026-09-01", to: "2026-09-01" });
  });
});
