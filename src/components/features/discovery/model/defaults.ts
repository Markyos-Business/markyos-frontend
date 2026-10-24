import type { LocalizedText, Option, QuestionConfig, QuestionType } from "../types";

const blank = (): LocalizedText => ({ en: null, ar: null });

/** A value for a new option that doesn't clash with the ones already there. */
export const newOptionValue = (existing: Option[] | undefined): string => {
  const taken = new Set((existing ?? []).map((o) => o.value));
  let n = (existing?.length ?? 0) + 1;
  while (taken.has(`option-${n}`)) n++;
  return `option-${n}`;
};

const options = (count: number): Option[] => Array.from({ length: count }, (_, i) => ({ value: `option-${i + 1}`, label: blank() }));

/** What a question of each type starts with when written from scratch. */
export const defaultConfig = (type: QuestionType): QuestionConfig => {
  switch (type) {
    case "text":
      return { multiline: true };
    case "choice":
      return { multiple: false, allowOther: false, options: options(2) };
    case "scale":
      return { min: 1, max: 5, minLabel: blank(), maxLabel: blank() };
    case "ranking":
      return { items: options(3) };
    case "image_choice":
      return { minPicks: 1, maxPicks: 1, options: options(2).map((o) => ({ ...o, assetId: null })) };
    case "upload":
      return { accept: ["image/*", "application/pdf"], maxSizeMb: 20, maxFiles: 5 };
    case "link":
      return { maxCount: 3 };
  }
};
