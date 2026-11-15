import { describe, expect, it } from "vitest";
import { stepSegment } from "./segment-input";

describe("segment stepping", () => {
  it("never steps minutes in fives past 55", () => {
    expect(stepSegment(55, 1, 0, 59, 5)).toBe(0);
    expect(stepSegment(0, -1, 0, 59, 5)).toBe(55);
    expect(stepSegment(50, 1, 0, 59, 5)).toBe(55);
  });

  it("walks every minute and wraps", () => {
    expect(stepSegment(59, 1, 0, 59, 1)).toBe(0);
    expect(stepSegment(0, -1, 0, 59, 1)).toBe(59);
  });

  it("wraps 12-hour hours 12 → 1 and 1 → 12", () => {
    expect(stepSegment(12, 1, 1, 12, 1)).toBe(1);
    expect(stepSegment(1, -1, 1, 12, 1)).toBe(12);
  });

  it("starts from empty at the ends of the grid", () => {
    expect(stepSegment(null, 1, 0, 59, 5)).toBe(0);
    expect(stepSegment(null, -1, 0, 59, 5)).toBe(55);
  });

  it("moves an off-grid value to the grid", () => {
    expect(stepSegment(7, 1, 0, 59, 5)).toBe(10);
    expect(stepSegment(7, -1, 0, 59, 5)).toBe(5);
  });
});
