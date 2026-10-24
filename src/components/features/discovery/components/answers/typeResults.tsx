"use client";

import type { ReactNode } from "react";
import { Badge, Icon } from "@/components/ui";
import { textIn } from "../../model/questionTypes";
import type { AnswerValue, ChoiceAnswer, FormQuestion, QuestionType, UploadedFile } from "../../types";

export type ResultProps = {
  question: FormQuestion;
  value: AnswerValue;
  /** The studio's reading language, for option labels. */
  lang: "en" | "ar";
  files: Record<string, UploadedFile>;
};

const list = (value: AnswerValue): string[] => (Array.isArray(value) ? value : []);

const optionLabel = (options: FormQuestion["config"]["options"], value: string, lang: "en" | "ar") =>
  textIn(options?.find((o) => o.value === value)?.label, lang) || value;

/*
 * The answers screen's half of the question type registry: how each type's
 * answer reads back to the studio. Same keys as the builder's editors and the
 * client's inputs.
 */
export const TYPE_RESULTS: Record<QuestionType, (props: ResultProps) => ReactNode> = {
  // Text is rendered by the answer row itself, so it can carry its own
  // direction and the translation toggle.
  text: ({ value }) => <p className="whitespace-pre-line text-body text-text">{String(value)}</p>,
  choice: ({ question, value, lang }) => {
    const answer = value as ChoiceAnswer;
    return (
      <div className="flex flex-wrap gap-space-3">
        {answer.selected.map((s) => (
          <Badge key={s} tone="accent" size="md">
            {optionLabel(question.config.options, s, lang)}
          </Badge>
        ))}
        {answer.other && (
          <Badge tone="neutral" size="md">
            <span dir="auto">{answer.other}</span>
          </Badge>
        )}
      </div>
    );
  },
  scale: ({ question, value, lang }) => {
    const low = question.config.min ?? 1;
    const high = question.config.max ?? 5;
    const n = Number(value);
    return (
      <div className="flex max-w-80 flex-col gap-space-2">
        <span className="text-h4 font-medium tabular-nums">
          {n} <span className="text-body font-normal text-text-muted">/ {high}</span>
        </span>
        <span className="h-1.5 overflow-hidden rounded-full bg-ink-soft">
          <span className="block h-full rounded-full bg-accent" style={{ width: `${((n - low) / (high - low)) * 100}%` }} />
        </span>
        <span className="flex justify-between gap-space-4 text-caption text-text-muted">
          <span>{textIn(question.config.minLabel, lang)}</span>
          <span className="text-end">{textIn(question.config.maxLabel, lang)}</span>
        </span>
      </div>
    );
  },
  ranking: ({ question, value, lang }) => (
    <ol className="flex flex-col gap-space-2">
      {list(value).map((v, i) => (
        <li key={v} className="flex items-center gap-space-4 text-body">
          <span className="w-5 text-caption font-medium tabular-nums text-text-muted">{i + 1}</span>
          {optionLabel(question.config.items, v, lang)}
        </li>
      ))}
    </ol>
  ),
  image_choice: ({ question, value, lang }) => (
    <div className="flex flex-wrap gap-space-3">
      {list(value).map((v) => (
        <Badge key={v} tone="accent" size="md" icon={<Icon name="image" size={16} />}>
          {optionLabel(question.config.options, v, lang)}
        </Badge>
      ))}
    </div>
  ),
  upload: ({ value, files, lang }) => (
    <ul className="flex flex-col gap-space-2">
      {list(value).map((id) => {
        const file = files[id];
        return (
          <li key={id} className="flex items-center gap-space-3 text-body">
            <Icon name="file-alt" size={18} className="text-text-muted" />
            {file?.url ? (
              <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-accent-text hover:underline" dir="auto">
                {file.name}
              </a>
            ) : (
              <span dir="auto">{file?.name ?? (lang === "ar" ? "ملف مرفوع" : "Uploaded file")}</span>
            )}
          </li>
        );
      })}
    </ul>
  ),
  link: ({ value }) => (
    <ul className="flex flex-col gap-space-2">
      {list(value).map((url) => (
        <li key={url}>
          <a href={url} target="_blank" rel="noopener noreferrer nofollow" dir="ltr" className="inline-flex items-center gap-space-2 text-body text-accent-text hover:underline">
            <Icon name="external-link-alt" size={16} />
            {url}
          </a>
        </li>
      ))}
    </ul>
  ),
};
