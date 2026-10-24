"use client";

import type { ReactNode } from "react";
import type { FormQuestion, QuestionConfig, QuestionType } from "../../types";
import { LocalizedInput, type EditMode } from "./LocalizedInput";
import { OptionsEditor } from "./OptionsEditor";

export type TypeEditorProps = {
  question: FormQuestion;
  onConfig: (config: QuestionConfig) => void;
  mode: EditMode;
  languages: ("en" | "ar")[];
  locked: boolean;
  isAr: boolean;
};

const Limits = ({ children }: { children: ReactNode }) => <p className="text-caption text-text-muted">{children}</p>;

/*
 * The builder's half of the question type registry: what each type shows on
 * its card beyond the title and help. Settings that aren't text a client
 * reads (picks, limits, required) live in the settings panel.
 */
export const TYPE_EDITORS: Record<QuestionType, (props: TypeEditorProps) => ReactNode> = {
  text: ({ question, isAr }) => (
    <Limits>
      {question.config.multiline
        ? isAr
          ? "إجابة طويلة، حتى 5,000 حرف."
          : "A long answer, up to 5,000 characters."
        : isAr
          ? "إجابة قصيرة، حتى 500 حرف."
          : "A short answer, up to 500 characters."}
    </Limits>
  ),
  choice: ({ question, onConfig, mode, languages, locked, isAr }) => (
    <OptionsEditor
      options={question.config.options ?? []}
      onChange={(options) => onConfig({ ...question.config, options })}
      mode={mode}
      languages={languages}
      locked={locked}
      isAr={isAr}
      noun={{ en: "Option", ar: "الخيار" }}
    />
  ),
  image_choice: ({ question, onConfig, mode, languages, locked, isAr }) => (
    <OptionsEditor
      options={question.config.options ?? []}
      onChange={(options) => onConfig({ ...question.config, options })}
      mode={mode}
      languages={languages}
      locked={locked}
      isAr={isAr}
      noun={{ en: "Image", ar: "الصورة" }}
    />
  ),
  ranking: ({ question, onConfig, mode, languages, locked, isAr }) => (
    <OptionsEditor
      options={question.config.items ?? []}
      onChange={(items) => onConfig({ ...question.config, items })}
      mode={mode}
      languages={languages}
      locked={locked}
      isAr={isAr}
      noun={{ en: "Item", ar: "العنصر" }}
    />
  ),
  scale: ({ question, onConfig, mode, languages, isAr }) => (
    <div className="flex flex-col gap-space-5">
      <Limits>{isAr ? `من ${question.config.min ?? 1} إلى ${question.config.max ?? 5}` : `From ${question.config.min ?? 1} to ${question.config.max ?? 5}`}</Limits>
      <LocalizedInput
        label={{ en: "Low end", ar: "الطرف الأدنى" }}
        value={question.config.minLabel ?? { en: null, ar: null }}
        onCommit={(minLabel) => onConfig({ ...question.config, minLabel })}
        mode={mode}
        languages={languages}
        isAr={isAr}
      />
      <LocalizedInput
        label={{ en: "High end", ar: "الطرف الأعلى" }}
        value={question.config.maxLabel ?? { en: null, ar: null }}
        onCommit={(maxLabel) => onConfig({ ...question.config, maxLabel })}
        mode={mode}
        languages={languages}
        isAr={isAr}
      />
    </div>
  ),
  upload: ({ question, isAr }) => (
    <Limits>
      {isAr
        ? `حتى ${question.config.maxFiles ?? 10} ملفات، ${question.config.maxSizeMb ?? 20} ميغابايت لكل ملف · ${(question.config.accept ?? []).join("، ")}`
        : `Up to ${question.config.maxFiles ?? 10} files, ${question.config.maxSizeMb ?? 20} MB each · ${(question.config.accept ?? []).join(", ")}`}
    </Limits>
  ),
  link: ({ question, isAr }) => (
    <Limits>{isAr ? `حتى ${question.config.maxCount ?? 5} روابط.` : `Up to ${question.config.maxCount ?? 5} links.`}</Limits>
  ),
};
