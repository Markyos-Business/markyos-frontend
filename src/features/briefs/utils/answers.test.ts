import { describe, expect, it } from "vitest";
import { answerText } from "./answers";

describe("answerText", () => {
  it("reads every answer shape", () => {
    expect(answerText("قهوة")).toBe("قهوة");
    expect(answerText(4)).toBe("4");
    expect(answerText(["a", "b"])).toBe("a, b");
    expect(answerText({ selected: ["cafes"], other: "kiosks" })).toBe("cafes, kiosks");
    expect(answerText(null)).toBe("");
  });
});
