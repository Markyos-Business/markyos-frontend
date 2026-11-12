import { describe, expect, it } from "vitest";
import { nextTabKey } from "./tabNavigation";

const tabs = [{ key: "first" }, { key: "unavailable", disabled: true }, { key: "middle" }, { key: "last" }];

describe("tab keyboard navigation", () => {
  it.each([
    ["first", "ArrowRight", "ltr", "middle"],
    ["middle", "ArrowLeft", "ltr", "first"],
    ["last", "ArrowRight", "ltr", "first"],
    ["first", "ArrowLeft", "ltr", "last"],
    ["first", "ArrowLeft", "rtl", "middle"],
    ["middle", "ArrowRight", "rtl", "first"],
    ["last", "ArrowLeft", "rtl", "first"],
    ["first", "ArrowRight", "rtl", "last"],
  ] as const)("moves from %s with %s in %s", (current, key, direction, expected) => {
    expect(nextTabKey(tabs, current, key, direction)).toBe(expected);
  });

  it.each(["ltr", "rtl"] as const)("uses vertical arrows independently of %s direction", (direction) => {
    expect(nextTabKey(tabs, "first", "ArrowDown", direction, "vertical")).toBe("middle");
    expect(nextTabKey(tabs, "first", "ArrowUp", direction, "vertical")).toBe("last");
    expect(nextTabKey(tabs, "last", "ArrowDown", direction, "vertical")).toBe("first");
  });

  it.each(["horizontal", "vertical"] as const)("uses Home/End at the enabled ends in %s tabs", (orientation) => {
    const disabledEnds = [{ key: "before", disabled: true }, ...tabs, { key: "after", disabled: true }];
    expect(nextTabKey(disabledEnds, "middle", "Home", "rtl", orientation)).toBe("first");
    expect(nextTabKey(disabledEnds, "middle", "End", "rtl", orientation)).toBe("last");
  });

  it("leaves Tab, activation keys and irrelevant arrows to the browser", () => {
    for (const key of ["Tab", "Enter", " ", "ArrowUp", "ArrowDown", "Escape"])
      expect(nextTabKey(tabs, "first", key)).toBeNull();
    for (const key of ["ArrowLeft", "ArrowRight"])
      expect(nextTabKey(tabs, "first", key, "ltr", "vertical")).toBeNull();
  });

  it("handles empty, all-disabled and single-enabled lists", () => {
    expect(nextTabKey([], "first", "ArrowRight")).toBeNull();
    expect(nextTabKey([{ key: "first", disabled: true }], "first", "Home")).toBeNull();
    expect(nextTabKey([{ key: "first" }], "first", "ArrowRight")).toBe("first");
  });

  it("recovers to an enabled end when the focused key is missing", () => {
    expect(nextTabKey(tabs, "removed", "ArrowRight")).toBe("first");
    expect(nextTabKey(tabs, "removed", "ArrowLeft")).toBe("last");
  });

  it("preserves numeric builder setting keys", () => {
    expect(nextTabKey([{ key: 0 }, { key: 1, disabled: true }, { key: 2 }], 0, "ArrowRight")).toBe(2);
  });
});
