import type { Lang } from "@/types/lang";
import { formatNumber } from "./format";

/**
 * The forms a counted phrase can take. English needs `one` and `other`;
 * Arabic also has `zero`, `two` (the dual), `few` (3–10) and `many` (11–99),
 * and a `count === 1 ? … : …` ternary can't express those. A missing form
 * falls back to `other`.
 *
 * `{n}` in a form is replaced by the count, formatted for the language.
 */
type PluralForms = {
  zero?: string;
  one?: string;
  two?: string;
  few?: string;
  many?: string;
  other: string;
};

const rules: Partial<Record<Lang, Intl.PluralRules>> = {};
const rulesFor = (lang: Lang) => (rules[lang] ??= new Intl.PluralRules(lang));

/**
 * Pick the form for `count` and fill in `{n}`.
 *
 * `plural("ar", 2, { two: "ملفان", few: "{n} ملفات", other: "{n} ملف" })` → "ملفان".
 * A `zero` form is used for 0 in either language ("No files yet"); without
 * one, 0 takes the language's own rule (`other` in both: "0 files").
 */
const plural = (lang: Lang, count: number, forms: PluralForms): string => {
  const form = count === 0 && forms.zero !== undefined ? "zero" : rulesFor(lang).select(count);
  const text = forms[form as keyof PluralForms] ?? forms.other;
  return text.replaceAll("{n}", formatNumber(count, lang));
};

export { plural };
export type { PluralForms };
