import { describe, expect, it } from "vitest";
import { compactNumber } from "../types";
import { formatDelta, deltaTone } from "../shared/metric-delta";
import { countdownParts } from "../cards/countdown-card";
import { gaugeDashes } from "../charts/gauge-chart";
import { heatLevel } from "../charts/activity-heatmap";
import { defaultHighlight } from "../charts/time-series-bar-chart";
import { sparkPoints } from "../charts/sparkline";
import { resolveWidgetState } from "../shared/widget-state-view";
import { safeCount } from "../shared/numbers";

describe("dashboard data contracts", () => {
  it("keeps delta magnitude separate from whether a rise is good", () => {
    expect(formatDelta(-4.5)).toBe("−4.5%");
    expect(formatDelta(3, "")).toBe("+3");
    expect(deltaTone(5, "down")).toBe("danger");
    expect(deltaTone(-5, "down")).toBe("success");
    expect(deltaTone(0)).toBe("neutral");
  });
  it("formats counts with Western digits", () => {
    expect(compactNumber(1284)).toBe("1,284");
    expect(compactNumber(12900)).toBe("12.9K");
    expect(compactNumber(4200000)).toBe("4.2M");
  });
  it("does not let invalid counts enter chart CSS or SVG", () => {
    expect([NaN, Infinity, -3, 0, 7].map(safeCount)).toEqual([0, 0, 0, 0, 7]);
  });
  it("highlights actual data before forecasts and handles no data", () => {
    expect(defaultHighlight([{ label: "a", value: 2 }, { label: "b", value: 3, status: "pending" }])).toBe(0);
    expect(defaultHighlight([])).toBe(-1);
  });
  it("never draws a gauge beyond its circumference", () => {
    expect(gaugeDashes([{ value: 62 }, { value: 27 }, { value: 11 }])).toEqual([
      { dash: "61 39", offset: -0 }, { dash: "26 74", offset: -62 }, { dash: "11 89", offset: -89 },
    ]);
    expect(gaugeDashes([{ value: -5 }, { value: 150 }, { value: 20 }])).toEqual([
      { dash: "0 100", offset: -0 }, { dash: "99 1", offset: -0 }, { dash: "0 100", offset: -100 },
    ]);
  });
  it("buckets zero and positive heat values", () => {
    expect([0, 1, 3, 6, 12].map(v => heatLevel(v, 12))).toEqual([0, 1, 1, 2, 4]);
  });
  it("counts down, stops at zero and rejects invalid dates", () => {
    expect(countdownParts(new Date("2026-11-05T12:30:00Z"), new Date("2026-11-03T09:00:00Z"))).toEqual({ days: 2, hours: 3, minutes: 30, done: false });
    expect(countdownParts(new Date("2026-11-01"), new Date("2026-11-03"))?.done).toBe(true);
    expect(countdownParts(new Date("invalid"), new Date())).toBeNull();
  });
  it("keeps explicit error/loading states and derives empty data", () => {
    expect(resolveWidgetState(undefined, false)).toBe("empty");
    expect(resolveWidgetState("ready", false)).toBe("empty");
    expect(resolveWidgetState("loading", true)).toBe("loading");
    expect(resolveWidgetState("error", true)).toBe("error");
    expect(sparkPoints([0, 10], 100, 32)).toBe("0,30 100,2");
    expect(sparkPoints([])).toBe("");
  });
});
