import { describe, expect, it } from "vitest";
import { AnswerError, serialiseAnswer, validateAnswer } from "./question-types";

const refusal = (fn: () => unknown) => {
  try { fn(); } catch (err) { if (err instanceof AnswerError) return err; }
  throw new Error("expected an AnswerError");
};

describe("answer messages", () => {
  it("speak the form's language with Arabic plural forms", () => {
    const tooLong = refusal(() => validateAnswer("text", { maxLength: 10 }, "x".repeat(11)));
    expect(tooLong.in("en")).toBe("Keep it under 10 characters.");
    expect(tooLong.in("ar")).toBe("اجعله أقل من 10 أحرف.");
    const links = refusal(() => validateAnswer("link", { maxCount: 2 }, ["https://a.sa", "https://b.sa", "https://c.sa"]));
    expect(links.in("en")).toBe("Share at most 2 links.");
    expect(links.in("ar")).toBe("شارك رابطين على الأكثر.");
    const picks = refusal(() => validateAnswer("image_choice", { options: [{ value: "a" }, { value: "b" }, { value: "c" }], maxPicks: 1 } as never, ["a", "b"]));
    expect(picks.in("ar")).toBe("اختر عنصرًا واحدًا على الأكثر.");
  });
  it("counts uploads in both languages", () => {
    expect(serialiseAnswer("upload", {}, ["f1"], "en")).toBe("1 file uploaded");
    expect(serialiseAnswer("upload", {}, ["f1", "f2", "f3"], "ar")).toBe("رُفعت 3 ملفات");
  });
});
