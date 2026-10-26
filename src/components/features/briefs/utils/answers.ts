/** A form answer as one line of text, whatever its question type. */
export function answerText(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(answerText).filter(Boolean).join(", ");
  if (typeof value === "object") {
    const v = value as { selected?: unknown; other?: unknown };
    if ("selected" in v) return [answerText(v.selected), answerText(v.other)].filter(Boolean).join(", ");
  }
  return JSON.stringify(value);
}
