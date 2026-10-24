import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import typeCases from "./fixtures/question_type_cases.json";
import visibilityCases from "./fixtures/visibility_cases.json";
import { AnswerError, isEmptyAnswer, serialiseAnswer, validateAnswer } from "./questionTypes";
import { editRefusal, nextStatus } from "./status";
import { evaluateVisibility, visibilityErrors } from "./visibility";
import type { AnswerValue, QuestionConfig, QuestionType, Visibility } from "../types";

type TypeCase = { name: string; type: QuestionType; config: QuestionConfig; value: unknown; ok: boolean; clean?: unknown };
type VisibilityCase = { name: string; questions: { id: string; visibility: Visibility }[]; answers: Record<string, AnswerValue>; visible: string[] };
type ErrorCase = { name: string; questions: { id: string; visibility: Visibility }[]; invalid: string[] };

describe("question types (shared cases)", () => {
  it.each((typeCases.cases as TypeCase[]).map((c) => [c.name, c] as const))("%s", (_name, c) => {
    if (c.ok) expect(validateAnswer(c.type, c.config, c.value)).toEqual(c.clean);
    else expect(() => validateAnswer(c.type, c.config, c.value)).toThrow(AnswerError);
  });

  it.each(typeCases.empty.map((c) => [c.type, c] as const))("empty: %s", (_t, c) => {
    expect(isEmptyAnswer(c.type as QuestionType, c.value as AnswerValue)).toBe(c.empty);
  });

  it("serialises answers in the reading language", () => {
    const config: QuestionConfig = { multiple: true, allowOther: true, options: [{ value: "sa", label: { en: "Saudi Arabia", ar: "السعودية" } }] };
    expect(serialiseAnswer("choice", config, { selected: ["sa"], other: "Oman" }, "en")).toBe("Saudi Arabia, Oman");
    expect(serialiseAnswer("choice", config, { selected: ["sa"], other: "Oman" }, "ar")).toBe("السعودية, Oman");
    expect(serialiseAnswer("scale", { min: 1, max: 5, minLabel: { en: "Casual", ar: null }, maxLabel: { en: "Formal", ar: null } }, 4, "en")).toBe(
      "4 of 1–5 (Casual – Formal)"
    );
  });
});

describe("visibility (shared cases)", () => {
  it.each((visibilityCases.cases as VisibilityCase[]).map((c) => [c.name, c] as const))("%s", (_name, c) => {
    expect([...evaluateVisibility(c.questions, c.answers)].sort()).toEqual([...c.visible].sort());
  });

  it.each((visibilityCases.errors as ErrorCase[]).map((c) => [c.name, c] as const))("%s", (_name, c) => {
    expect(Object.keys(visibilityErrors(c.questions)).sort()).toEqual(c.invalid);
  });
});

describe("status", () => {
  it("follows the happy path and refuses the rest", () => {
    expect(nextStatus("draft", "send")).toBe("sent");
    expect(nextStatus("sent", "answer")).toBe("in_progress");
    expect(nextStatus("in_progress", "submit")).toBe("submitted");
    expect(nextStatus("submitted", "reopen")).toBe("in_progress");
    expect(nextStatus("submitted", "answer")).toBeNull();
    expect(nextStatus("draft", "submit")).toBeNull();
  });

  it("limits edits once sent", () => {
    expect(editRefusal("draft", "structure")).toBeNull();
    expect(editRefusal("sent", "wording")).toBeNull();
    expect(editRefusal("sent", "structure")).not.toBeNull();
    expect(editRefusal("submitted", "wording")).not.toBeNull();
    expect(editRefusal("submitted", "theme")).toBeNull();
  });
});

/*
 * The cases are copied from the backend; when both repos sit side by side
 * (as they do in the monorepo checkout), fail if the copies have drifted.
 */
const BACKEND = resolve(__dirname, "../../../../../../markyos-backend/apps/discovery/fixtures");
describe.skipIf(!existsSync(BACKEND))("fixtures match the backend's", () => {
  it.each(["question_type_cases.json", "visibility_cases.json"])("%s", (name) => {
    const ours = readFileSync(resolve(__dirname, "fixtures", name), "utf8");
    expect(ours).toBe(readFileSync(resolve(BACKEND, name), "utf8"));
  });
});
