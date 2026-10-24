import type { AnswerValue, Condition, ConditionOperator, Visibility } from "../types";

/*
 * Show/hide logic, the client-side twin of the backend's
 * apps/discovery/visibility.py. Both run model/fixtures/visibility_cases.json.
 *
 * - A question hidden by its conditions hides its answer too, so anything
 *   depending on it sees it as unanswered.
 * - An unanswered question satisfies no condition, `not_equals` included.
 * - `equals` on a multi-answer question means exactly that one value was
 *   picked; `includes` means it was among them (or, for text, appears in it).
 * - `gte` / `lte` compare numbers and are false for anything else.
 * - A condition may only point at an earlier question, which rules out
 *   cycles; `visibilityErrors` says when one doesn't.
 */

export const OPERATORS: ConditionOperator[] = ["equals", "not_equals", "includes", "gte", "lte"];

type VisibilityQuestion = { id: string; visibility: Visibility };

const answered = (value: AnswerValue | undefined): boolean => {
  if (value == null || value === "") return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return value.selected.length > 0 || !!value.other;
  return true;
};

/** The answer as a list of comparable values, or a scalar. */
const atoms = (value: AnswerValue): string | number | string[] => {
  if (value && typeof value === "object" && !Array.isArray(value)) return [...value.selected, ...(value.other ? [value.other] : [])];
  return value as string | number | string[];
};

const fold = (text: string) => text.trim().toLocaleLowerCase();

const holds = (condition: Condition, value: AnswerValue | undefined): boolean => {
  if (!answered(value)) return false;
  const { operator, value: target } = condition;
  const a = atoms(value as AnswerValue);
  if (operator === "equals" || operator === "not_equals") {
    let equal: boolean;
    if (Array.isArray(a)) equal = a.length === 1 && a[0] === target;
    else if (typeof a === "string" && typeof target === "string") equal = fold(a) === fold(target);
    else equal = a === target;
    return operator === "equals" ? equal : !equal;
  }
  if (operator === "includes") {
    if (Array.isArray(a)) return a.includes(target as string);
    if (typeof a === "string" && typeof target === "string") return a.toLocaleLowerCase().includes(fold(target));
    return false;
  }
  if (operator === "gte" || operator === "lte") {
    if (typeof a !== "number" || typeof target !== "number") return false;
    return operator === "gte" ? a >= target : a <= target;
  }
  return false;
};

/** The ids of the visible questions, given every question in display order and the answers so far. */
export const evaluateVisibility = (questions: VisibilityQuestion[], answers: Record<string, AnswerValue>): Set<string> => {
  const visible = new Set<string>();
  for (const question of questions) {
    const conditions = question.visibility?.conditions ?? [];
    if (conditions.length === 0) {
      visible.add(question.id);
      continue;
    }
    const results = conditions.map((c) => holds(c, visible.has(c.questionId) ? answers[c.questionId] : undefined));
    const shown = question.visibility?.match === "any" ? results.some(Boolean) : results.every(Boolean);
    if (shown) visible.add(question.id);
  }
  return visible;
};

/** Why each question's conditions are invalid, keyed by question id. */
export const visibilityErrors = (questions: VisibilityQuestion[]): Record<string, string[]> => {
  const errors: Record<string, string[]> = {};
  const seen = new Set<string>();
  for (const question of questions) {
    const problems: string[] = [];
    const rule = question.visibility;
    if (rule) {
      if (!["all", "any"].includes(rule.match ?? "all")) problems.push("Match must be all or any.");
      for (const condition of rule.conditions ?? []) {
        if (condition.questionId === question.id) problems.push("A question can't depend on itself.");
        else if (!seen.has(condition.questionId)) problems.push("A condition can only depend on an earlier question.");
        if (!OPERATORS.includes(condition.operator)) problems.push("Unknown operator.");
      }
    }
    if (problems.length) errors[question.id] = problems;
    seen.add(question.id);
  }
  return errors;
};
