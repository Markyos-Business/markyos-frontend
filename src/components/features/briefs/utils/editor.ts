import { FIELD_CHOICES } from "../constants";

/**
 * The section editor's rules, kept apart from its markup: which keys are
 * shown, how a new list item is shaped, and how an edit lands in the draft.
 */

/** Kept as they are, never shown: ids, and the evidence the analysis cites. */
export const HIDDEN_KEYS = new Set(["id", "citations", "basis", "confidence", "leansOn"]);

/** 1–5 scores. */
export const SCALE_KEYS = new Set(["fit", "value"]);

export type Path = (string | number)[];

export const isChoice = (key: string) => key in FIELD_CHOICES;
export const isScale = (key: string, value: unknown) => SCALE_KEYS.has(key) && typeof value === "number";

/** `value` with `next` written at `path`, copying only what's on the way. */
export function setAt<T>(value: T, path: Path, next: unknown): T {
  if (path.length === 0) return next as T;
  const [head, ...rest] = path;
  if (Array.isArray(value)) {
    const copy = [...value];
    copy[head as number] = setAt(copy[head as number], rest, next);
    return copy as T;
  }
  const obj = (value ?? {}) as Record<string, unknown>;
  return { ...obj, [head]: setAt(obj[head as string], rest, next) } as T;
}

/**
 * A new, empty item shaped like `example`: text blank, lists empty, choices
 * and scores kept, no id (the server gives one), and inferred rather than
 * cited, since a person wrote it.
 */
export function blankLike(example: unknown): unknown {
  if (typeof example === "string") return "";
  if (typeof example === "number") return example;
  if (Array.isArray(example)) return [];
  if (example && typeof example === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(example)) {
      if (k === "id") continue;
      if (k === "citations") out[k] = [];
      else if (k === "basis") out[k] = "inferred";
      else if (k === "confidence") out[k] = "medium";
      else if (isChoice(k) && typeof v === "string") out[k] = v;
      else out[k] = blankLike(v);
    }
    return out;
  }
  return example;
}

/** The keys of an object the editor shows, in their stored order. */
export const shownKeys = (obj: Record<string, unknown>) => Object.keys(obj).filter((k) => !HIDDEN_KEYS.has(k));
