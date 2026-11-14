import { describe, expect, it } from "vitest";
import { fitTabs, activeRoute } from "./tab-layout";
describe("overflow fitting", () => {
  it("keeps every item when the full list fits", () => expect(fitTabs([80, 90, 100], 300, 80, 1)).toEqual([0, 1, 2]));
  it("reserves the menu and pins an active item outside the leading prefix", () => expect(fitTabs([80, 90, 100, 110], 300, 80, 3)).toEqual([0, 3]));
  it("keeps the active tab even at the narrowest size", () => expect(fitTabs([80, 90], 50, 80, 1)).toEqual([1]));
  it("handles empty lists", () => expect(fitTabs([], 300, 80, -1)).toEqual([]));
});
describe("route tab matching", () => {
  it("matches nested records and ignores query/hash", () => {
    expect(activeRoute("/assets/42/rights", "/assets")).toBe(true);
    expect(activeRoute("/assets/42/rights", "/assets/42/rights?preview=1#license")).toBe(true);
  });
  it("does not match a shared prefix or treat root as every page", () => {
    expect(activeRoute("/assets-old", "/assets")).toBe(false);
    expect(activeRoute("/assets", "/")).toBe(false);
  });
});
