import { describe, expect, it } from "vitest";
import { blocksOf } from "./blocks";

describe("blocksOf", () => {
  it("numbers non-empty lines and remembers the gaps", () => {
    expect(blocksOf("One\n\n- two\n- three\n\n\nفقرة")).toEqual([
      { text: "One", gapBefore: false },
      { text: "- two", gapBefore: true },
      { text: "- three", gapBefore: false },
      { text: "فقرة", gapBefore: true },
    ]);
  });

  it("ignores leading blank lines", () => {
    expect(blocksOf("\n\nHello")).toEqual([{ text: "Hello", gapBefore: false }]);
  });
});
