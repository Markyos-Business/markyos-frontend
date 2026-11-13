import { describe, expect, it } from "vitest";
import { blankLike, setAt, shownKeys } from "./editor";

describe("setAt", () => {
  it("writes deep without touching the original", () => {
    const before = { items: [{ name: "A", pros: ["x"] }] };
    const after = setAt(before, ["items", 0, "pros", 1], "y");
    expect(after.items[0].pros).toEqual(["x", "y"]);
    expect(before.items[0].pros).toEqual(["x"]);
  });
});

describe("blankLike", () => {
  it("empties text and lists, keeps choices and scores, and marks it inferred", () =>
    expect(
      blankLike({ id: "r1", name: "Desert", pros: ["a"], fit: 4, priority: "high", citations: [{ q: 1 }], basis: "cited", confidence: "high" })
    ).toEqual({ name: "", pros: [], fit: 4, priority: "high", citations: [], basis: "inferred", confidence: "medium" }));
});

describe("shownKeys", () => {
  it("hides ids and evidence", () => expect(shownKeys({ id: 1, name: 2, citations: 3, basis: 4, confidence: 5, text: 6 })).toEqual(["name", "text"]));
});
