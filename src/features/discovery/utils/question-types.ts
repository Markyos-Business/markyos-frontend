import { plural } from "@/lib/i18n/plural";
import type { AnswerValue, ChoiceAnswer, LocalizedText, Option, QuestionConfig, QuestionType } from "../types";

/*
 * The question type registry: one entry per type, the client-side twin of the
 * backend's apps/discovery/question_types.py. Both run the same cases
 * (utils/fixtures/question_type_cases.json), so the builder, the client form
 * and the server agree on what a valid answer is.
 *
 * Each entry validates and cleans an answer, says when it counts as empty
 * (required questions), and writes it out as one line of text for the AI
 * analysis. The builder editor, client input and results renderer for each
 * type are keyed by the same `QuestionType`, so adding a type is one entry
 * here and one in each of those — the compiler lists what's missing.
 */

export const TEXT_SHORT_MAX = 500;
export const TEXT_LONG_MAX = 5000;
const OTHER_MAX = 200;
const LINK_MAX_LENGTH = 2000;
const URL_RE = /^https?:\/\/[^\s/$.?#][^\s]*$/i;

/**
 * A refused answer, worded for the person filling in the form in either of
 * its languages. `message` stays English for logs; show `in(lang)`.
 */
export class AnswerError extends Error {
  constructor(readonly en: string, readonly ar: string) {
    super(en);
    this.name = "AnswerError";
  }
  in(lang: "en" | "ar"): string {
    return lang === "ar" ? this.ar : this.en;
  }
}

const chars = (n: number) => ({
  en: plural("en", n, { one: "{n} character", other: "{n} characters" }),
  ar: plural("ar", n, { one: "حرف واحد", two: "حرفين", few: "{n} أحرف", many: "{n} حرفًا", other: "{n} حرف" }),
});
const items = (n: number) => ({
  en: plural("en", n, { one: "{n} item", other: "{n} items" }),
  ar: plural("ar", n, { one: "عنصرًا واحدًا", two: "عنصرين", few: "{n} عناصر", many: "{n} عنصرًا", other: "{n} عنصر" }),
});
const files = (n: number) => ({
  en: plural("en", n, { one: "{n} file", other: "{n} files" }),
  ar: plural("ar", n, { one: "ملفًا واحدًا", two: "ملفين", few: "{n} ملفات", many: "{n} ملفًا", other: "{n} ملف" }),
});
const linkCount = (n: number) => ({
  en: plural("en", n, { one: "{n} link", other: "{n} links" }),
  ar: plural("ar", n, { one: "رابطًا واحدًا", two: "رابطين", few: "{n} روابط", many: "{n} رابطًا", other: "{n} رابط" }),
});

/** Code points, as the server counts them, not UTF-16 units. */
const length = (text: string) => [...text].length;

/** Trim, normalise, drop control characters (keeping bidi marks and joiners), cap. */
export const cleanText = (value: unknown, limit: number): string => {
  if (typeof value !== "string") throw new AnswerError("Expected text.", "يُتوقع نص.");
  const text = value
    .normalize("NFC")
    .replace(/\p{Cc}/gu, (ch) => (ch === "\n" || ch === "\t" ? ch : ""))
    .trim();
  if (length(text) > limit) throw new AnswerError(`Keep it under ${chars(limit).en}.`, `اجعله أقل من ${chars(limit).ar}.`);
  return text;
};

/** One side of a LocalizedText, falling back to the other. */
export const textIn = (localized: LocalizedText | undefined | null, lang: "en" | "ar"): string =>
  (localized && (localized[lang] || localized[lang === "ar" ? "en" : "ar"])) || "";

const values = (options: Option[] | undefined) => (options ?? []).map((o) => o.value);

const labelOf = (options: Option[] | undefined, value: string, lang: "en" | "ar") =>
  textIn((options ?? []).find((o) => o.value === value)?.label, lang) || value;

const isStringList = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((v) => typeof v === "string");

const checkPicks = (count: number, config: QuestionConfig) => {
  if (config.minPicks != null && count > 0 && count < config.minPicks) throw new AnswerError(`Pick at least ${items(config.minPicks).en}.`, `اختر ${items(config.minPicks).ar} على الأقل.`);
  if (config.maxPicks != null && count > config.maxPicks) throw new AnswerError(`Pick at most ${items(config.maxPicks).en}.`, `اختر ${items(config.maxPicks).ar} على الأكثر.`);
};

const unique = (list: string[]) => new Set(list).size === list.length;

type Spec = {
  validate: (config: QuestionConfig, value: unknown) => AnswerValue;
  empty: (value: AnswerValue) => boolean;
  serialise: (config: QuestionConfig, value: AnswerValue, lang: "en" | "ar") => string;
};

const falsy = (value: AnswerValue) => value == null || value === "" || (Array.isArray(value) && value.length === 0);

export const QUESTION_TYPES: Record<QuestionType, Spec> = {
  text: {
    validate: (config, value) => cleanText(value, config.maxLength || (config.multiline ? TEXT_LONG_MAX : TEXT_SHORT_MAX)),
    empty: falsy,
    serialise: (_c, value) => String(value),
  },
  choice: {
    validate: (config, value) => {
      if (!value || typeof value !== "object" || Array.isArray(value)) throw new AnswerError("Choose an answer.", "اختر إجابة.");
      const raw = value as Partial<ChoiceAnswer>;
      const selected = raw.selected ?? [];
      if (!isStringList(selected)) throw new AnswerError("Choose from the list.", "اختر من القائمة.");
      if (!unique(selected)) throw new AnswerError("A choice was picked twice.", "اختيرت إجابة مرتين.");
      const allowed = new Set(values(config.options));
      if (selected.some((s) => !allowed.has(s))) throw new AnswerError("That isn't one of the choices.", "هذه ليست من الخيارات.");
      let other: string | null = null;
      if (raw.other != null && raw.other !== "") {
        if (!config.allowOther) throw new AnswerError("This question has no \"something else\" option.", "لا يتضمن هذا السؤال خيار «شيء آخر».");
        other = cleanText(raw.other, OTHER_MAX) || null;
      }
      const count = selected.length + (other ? 1 : 0);
      if (!config.multiple && count > 1) throw new AnswerError("Pick one.", "اختر إجابة واحدة.");
      checkPicks(count, config);
      return { selected, other };
    },
    empty: (value) => !value || (typeof value === "object" && !Array.isArray(value) && !value.selected.length && !value.other),
    serialise: (config, value, lang) => {
      const answer = value as ChoiceAnswer;
      return [...answer.selected.map((s) => labelOf(config.options, s, lang)), ...(answer.other ? [answer.other] : [])].join(", ");
    },
  },
  scale: {
    validate: (config, value) => {
      if (typeof value !== "number" || !Number.isInteger(value)) throw new AnswerError("Enter a whole number.", "أدخل رقمًا صحيحًا.");
      const low = config.min ?? 1;
      const high = config.max ?? 5;
      if (value < low || value > high) throw new AnswerError(`Pick a number from ${low} to ${high}.`, `اختر رقمًا من ${low} إلى ${high}.`);
      return value;
    },
    empty: falsy,
    serialise: (config, value, lang) =>
      `${value} of ${config.min ?? 1}–${config.max ?? 5} (${textIn(config.minLabel, lang)} – ${textIn(config.maxLabel, lang)})`,
  },
  ranking: {
    validate: (config, value) => {
      if (!isStringList(value)) throw new AnswerError("Put the items in order.", "رتّب العناصر.");
      const expected = values(config.items).sort();
      if ([...value].sort().join("\u0000") !== expected.join("\u0000")) throw new AnswerError("Rank every item exactly once.", "رتّب كل عنصر مرة واحدة فقط.");
      return value;
    },
    empty: falsy,
    serialise: (config, value, lang) => (value as string[]).map((v, i) => `${i + 1}. ${labelOf(config.items, v, lang)}`).join("; "),
  },
  image_choice: {
    validate: (config, value) => {
      if (!isStringList(value)) throw new AnswerError("Choose from the list.", "اختر من القائمة.");
      if (!unique(value)) throw new AnswerError("A choice was picked twice.", "اختيرت إجابة مرتين.");
      const allowed = new Set(values(config.options));
      if (value.some((v) => !allowed.has(v))) throw new AnswerError("That isn't one of the choices.", "هذه ليست من الخيارات.");
      checkPicks(value.length, config);
      return value;
    },
    empty: falsy,
    serialise: (config, value, lang) => (value as string[]).map((v) => labelOf(config.options, v, lang)).join(", "),
  },
  upload: {
    // Asset ids only; the server checks they're this response's own uploads.
    validate: (config, value) => {
      if (!isStringList(value) || value.some((v) => !v)) throw new AnswerError("Upload files.", "ارفع ملفات.");
      const max = config.maxFiles ?? 10;
      if (value.length > max) throw new AnswerError(`Upload at most ${files(max).en}.`, `ارفع ${files(max).ar} على الأكثر.`);
      return value;
    },
    empty: falsy,
    serialise: (_c, value, lang) => {
      const n = (value as string[]).length;
      return lang === "ar"
        ? plural("ar", n, { one: "رُفع ملف واحد", two: "رُفع ملفان", few: "رُفعت {n} ملفات", many: "رُفع {n} ملفًا", other: "رُفع {n} ملف" })
        : `${files(n).en} uploaded`;
    },
  },
  link: {
    validate: (config, value) => {
      if (!Array.isArray(value)) throw new AnswerError("Add links.", "أضف روابط.");
      const links = value.map((v) => cleanText(v, LINK_MAX_LENGTH)).filter(Boolean);
      if (links.some((v) => !URL_RE.test(v))) throw new AnswerError("Links start with http:// or https://.", "تبدأ الروابط بـ http:// أو https://.");
      const max = config.maxCount ?? 5;
      if (links.length > max) throw new AnswerError(`Share at most ${linkCount(max).en}.`, `شارك ${linkCount(max).ar} على الأكثر.`);
      return links;
    },
    empty: falsy,
    serialise: (_c, value) => (value as string[]).join(", "),
  },
};

/** The cleaned answer, or an AnswerError. `null` clears an answer. */
export const validateAnswer = (type: QuestionType, config: QuestionConfig, value: unknown): AnswerValue => {
  if (value === null || value === undefined) return null;
  return QUESTION_TYPES[type].validate(config ?? {}, value);
};

export const isEmptyAnswer = (type: QuestionType, value: AnswerValue): boolean => QUESTION_TYPES[type].empty(value);

/** The answer as one line of plain text, for the AI analysis. */
export const serialiseAnswer = (type: QuestionType, config: QuestionConfig, value: AnswerValue, lang: "en" | "ar"): string =>
  isEmptyAnswer(type, value) ? "" : QUESTION_TYPES[type].serialise(config ?? {}, value, lang);
