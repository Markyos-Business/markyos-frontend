import { describe, expect, it } from "vitest";
import { trendOf } from "./trend";

describe("trendOf", () => {
  it("is flat when nothing changed", () => expect(trendOf(5, 5)).toEqual({ direction: "neutral", value: "0%" }));
  it("rounds the change", () => expect(trendOf(112, 100)).toEqual({ direction: "up", value: "12%" }));
  it("goes down", () => expect(trendOf(97, 100)).toEqual({ direction: "down", value: "3%" }));
  it("counts growth from zero as 100%", () => expect(trendOf(4, 0)).toEqual({ direction: "up", value: "100%" }));
});
