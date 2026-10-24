"use client";

import { useRef, useState, type ReactNode } from "react";
import { Icon } from "@/components/ui";
import { textIn } from "../../model/questionTypes";
import type { AnswerValue, ChoiceAnswer, PublicQuestion, QuestionType, UploadedFile } from "../../types";

export type ClientInputProps = {
  question: PublicQuestion;
  value: AnswerValue;
  onChange: (value: AnswerValue) => void;
  lang: "en" | "ar";
  /** Uploads: send one file, get back what the answer stores. Absent in a preview. */
  onUpload?: (file: File) => Promise<UploadedFile>;
  files: Record<string, UploadedFile>;
  invalid: boolean;
  describedBy: string;
};

const t = (lang: "en" | "ar", en: string, ar: string) => (lang === "ar" ? ar : en);

/*
 * Client-form classes, in the form's own palette (--f-*, model/theme.ts):
 * the studio's colours, not Markyos's. Every target is at least 44px.
 */
const field =
  "w-full min-h-11 rounded-lg bg-[var(--f-raised)] px-space-5 py-space-3 text-body text-[var(--f-text)] shadow-[inset_0_0_0_1px_var(--f-line)] outline-none transition-shadow focus:shadow-[inset_0_0_0_2px_var(--f-accent)] placeholder:text-[var(--f-muted)]";

const tile = (on: boolean) =>
  `flex min-h-11 w-full items-center gap-space-4 rounded-lg px-space-5 py-space-3 text-start text-body transition-[background-color,box-shadow,color] ${
    on
      ? "bg-[var(--f-accent)] text-[var(--f-accent-ink)]"
      : "bg-[var(--f-raised)] text-[var(--f-text)] shadow-[inset_0_0_0_1px_var(--f-line)] hover:shadow-[inset_0_0_0_1px_var(--f-accent)]"
  }`;

const Mark = ({ on, round }: { on: boolean; round: boolean }) => (
  <span
    aria-hidden
    className={`grid size-5 shrink-0 place-items-center ${round ? "rounded-full" : "rounded-sm"} ${
      on ? "bg-[var(--f-accent-ink)] text-[var(--f-accent)]" : "shadow-[inset_0_0_0_1px_var(--f-muted)]"
    }`}
  >
    {on && <Icon name="check" size={16} />}
  </span>
);

const list = (value: AnswerValue): string[] => (Array.isArray(value) ? value : []);

function ChoiceInput({ question, value, onChange, lang, describedBy }: ClientInputProps) {
  const answer: ChoiceAnswer = value && typeof value === "object" && !Array.isArray(value) ? value : { selected: [], other: null };
  const multiple = !!question.config.multiple;
  const [otherOn, setOtherOn] = useState(!!answer.other);
  const toggle = (option: string) => {
    if (!multiple) return onChange({ selected: [option], other: null });
    const selected = answer.selected.includes(option) ? answer.selected.filter((s) => s !== option) : [...answer.selected, option];
    onChange({ ...answer, selected });
  };
  return (
    <div role={multiple ? "group" : "radiogroup"} aria-describedby={describedBy} className="flex flex-col gap-space-3">
      {(question.config.options ?? []).map((option) => {
        const on = answer.selected.includes(option.value);
        return (
          <button key={option.value} type="button" role={multiple ? "checkbox" : "radio"} aria-checked={on} onClick={() => toggle(option.value)} className={tile(on)}>
            <Mark on={on} round={!multiple} />
            <span dir="auto">{textIn(option.label, lang)}</span>
          </button>
        );
      })}
      {question.config.allowOther && (
        <>
          <button
            type="button"
            role={multiple ? "checkbox" : "radio"}
            aria-checked={otherOn}
            onClick={() => {
              const next = !otherOn;
              setOtherOn(next);
              if (!next) onChange({ ...answer, other: null });
              else if (!multiple) onChange({ selected: [], other: answer.other });
            }}
            className={tile(otherOn)}
          >
            <Mark on={otherOn} round={!multiple} />
            <span>{t(lang, "Something else", "شيء آخر")}</span>
          </button>
          {otherOn && (
            <input
              aria-label={t(lang, "Your answer", "إجابتك")}
              dir="auto"
              className={field}
              defaultValue={answer.other ?? ""}
              maxLength={200}
              onChange={(e) => onChange({ selected: multiple ? answer.selected : [], other: e.target.value })}
            />
          )}
        </>
      )}
    </div>
  );
}

function ScaleInput({ question, value, onChange, lang, describedBy }: ClientInputProps) {
  const low = question.config.min ?? 1;
  const high = question.config.max ?? 5;
  return (
    <div className="flex flex-col gap-space-3">
      <div role="radiogroup" aria-describedby={describedBy} className="flex flex-wrap gap-space-3">
        {Array.from({ length: high - low + 1 }, (_, i) => low + i).map((n) => {
          const on = value === n;
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange(n)}
              className={`grid size-11 place-items-center rounded-lg text-body font-medium tabular-nums transition-[background-color,box-shadow,color] ${
                on ? "bg-[var(--f-accent)] text-[var(--f-accent-ink)]" : "bg-[var(--f-raised)] text-[var(--f-text)] shadow-[inset_0_0_0_1px_var(--f-line)]"
              }`}
            >
              {n}
            </button>
          );
        })}
      </div>
      <div className="flex justify-between gap-space-5 text-caption text-[var(--f-muted)]">
        <span>{textIn(question.config.minLabel, lang)}</span>
        <span className="text-end">{textIn(question.config.maxLabel, lang)}</span>
      </div>
    </div>
  );
}

function RankingInput({ question, value, onChange, lang, describedBy }: ClientInputProps) {
  const items = question.config.items ?? [];
  // Until the client moves something, the order is the studio's.
  const order = list(value).length === items.length ? list(value) : items.map((i) => i.value);
  const [dragging, setDragging] = useState<string | null>(null);
  const move = (from: number, to: number) => {
    if (to < 0 || to >= order.length) return;
    const next = [...order];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };
  return (
    <ol aria-describedby={describedBy} className="flex flex-col gap-space-3">
      {order.map((v, i) => {
        const item = items.find((x) => x.value === v);
        return (
          <li
            key={v}
            draggable
            onDragStart={() => setDragging(v)}
            onDragEnd={() => setDragging(null)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => dragging && move(order.indexOf(dragging), i)}
            className="flex min-h-11 items-center gap-space-3 rounded-lg bg-[var(--f-raised)] ps-space-4 pe-space-2 shadow-[inset_0_0_0_1px_var(--f-line)]"
          >
            <span className="w-5 text-caption font-medium tabular-nums text-[var(--f-muted)]">{i + 1}</span>
            <Icon name="grip-vertical" size={16} className="cursor-grab text-[var(--f-muted)]" />
            <span dir="auto" className="min-w-0 flex-1 text-body text-[var(--f-text)]">
              {item ? textIn(item.label, lang) : v}
            </span>
            {/* The keyboard (and thumb) twin of dragging. */}
            <button type="button" aria-label={t(lang, "Move up", "تحريك للأعلى")} disabled={i === 0} onClick={() => move(i, i - 1)} className="grid size-11 place-items-center rounded-lg text-[var(--f-text)] disabled:opacity-40">
              <Icon name="angle-up" size={18} />
            </button>
            <button type="button" aria-label={t(lang, "Move down", "تحريك للأسفل")} disabled={i === order.length - 1} onClick={() => move(i, i + 1)} className="grid size-11 place-items-center rounded-lg text-[var(--f-text)] disabled:opacity-40">
              <Icon name="angle-down" size={18} />
            </button>
          </li>
        );
      })}
    </ol>
  );
}

function ImageChoiceInput({ question, value, onChange, lang, describedBy }: ClientInputProps) {
  const picked = list(value);
  const max = question.config.maxPicks ?? 1;
  const toggle = (option: string) => {
    if (picked.includes(option)) return onChange(picked.filter((p) => p !== option));
    // A single pick swaps; over the limit, the oldest pick makes room.
    onChange(max === 1 ? [option] : [...picked, option].slice(-max));
  };
  return (
    <div role="group" aria-describedby={describedBy} className="grid grid-cols-2 gap-space-4">
      {(question.config.options ?? []).map((option) => {
        const on = picked.includes(option.value);
        return (
          <button
            key={option.value}
            type="button"
            role="checkbox"
            aria-checked={on}
            onClick={() => toggle(option.value)}
            className={`flex flex-col overflow-hidden rounded-lg text-start transition-shadow ${
              on ? "shadow-[inset_0_0_0_2px_var(--f-accent)]" : "shadow-[inset_0_0_0_1px_var(--f-line)]"
            }`}
          >
            <span className="grid aspect-[4/3] place-items-center bg-[var(--f-raised)]">
              {option.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={option.imageUrl} alt="" className="size-full object-cover" />
              ) : (
                <Icon name="image" size={22} className="text-[var(--f-muted)]" />
              )}
            </span>
            <span className={`flex min-h-11 items-center gap-space-3 px-space-4 py-space-3 text-body ${on ? "bg-[var(--f-accent)] text-[var(--f-accent-ink)]" : "text-[var(--f-text)]"}`}>
              <Mark on={on} round={false} />
              <span dir="auto">{textIn(option.label, lang)}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function UploadInput({ question, value, onChange, lang, onUpload, files, describedBy }: ClientInputProps) {
  const ids = list(value);
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const max = question.config.maxFiles ?? 10;
  const pick = async (chosen: FileList | null) => {
    if (!chosen || !onUpload) return;
    setError(null);
    setBusy(true);
    const next = [...ids];
    for (const file of Array.from(chosen).slice(0, max - ids.length)) {
      try {
        next.push((await onUpload(file)).assetId);
      } catch (err) {
        setError(err instanceof Error ? err.message : t(lang, "That file didn't upload.", "لم يُرفع الملف."));
      }
    }
    setBusy(false);
    onChange(next);
  };
  return (
    <div className="flex flex-col gap-space-3" aria-describedby={describedBy}>
      {ids.map((id) => (
        <div key={id} className="flex min-h-11 items-center gap-space-3 rounded-lg bg-[var(--f-raised)] ps-space-5 pe-space-2 shadow-[inset_0_0_0_1px_var(--f-line)]">
          <Icon name="file-alt" size={18} className="text-[var(--f-muted)]" />
          <span dir="auto" className="min-w-0 flex-1 truncate text-body text-[var(--f-text)]">
            {files[id]?.name ?? t(lang, "Uploaded file", "ملف مرفوع")}
          </span>
          <button type="button" aria-label={t(lang, "Remove file", "إزالة الملف")} onClick={() => onChange(ids.filter((x) => x !== id))} className="grid size-11 place-items-center rounded-lg text-[var(--f-text)]">
            <Icon name="times" size={18} />
          </button>
        </div>
      ))}
      {ids.length < max && (
        <button
          type="button"
          disabled={!onUpload || busy}
          onClick={() => input.current?.click()}
          className="flex min-h-11 items-center justify-center gap-space-3 rounded-lg border border-dashed border-[var(--f-line)] px-space-5 py-space-5 text-body font-medium text-[var(--f-accent-text)] disabled:opacity-60"
        >
          <Icon name="upload" size={18} />
          {busy ? t(lang, "Uploading…", "جارٍ الرفع…") : onUpload ? t(lang, "Choose files", "اختر ملفات") : t(lang, "Uploads work on the live form", "الرفع متاح في النموذج الفعلي")}
        </button>
      )}
      <input ref={input} type="file" multiple={max > 1} accept={(question.config.accept ?? []).join(",")} className="sr-only" onChange={(e) => void pick(e.target.files)} />
      <p className="text-caption text-[var(--f-muted)]">
        {t(lang, `Up to ${max} files, ${question.config.maxSizeMb ?? 20} MB each.`, `حتى ${max} ملفات، ${question.config.maxSizeMb ?? 20} ميغابايت لكل ملف.`)}
      </p>
      {error && <p role="alert" className="text-caption text-[var(--f-text)]">{error}</p>}
    </div>
  );
}

function LinkInput({ question, value, onChange, lang, describedBy }: ClientInputProps) {
  const links = list(value);
  const max = question.config.maxCount ?? 5;
  const rows = links.length ? links : [""];
  return (
    <div className="flex flex-col gap-space-3" aria-describedby={describedBy}>
      {rows.map((link, i) => (
        <input
          key={i}
          type="url"
          inputMode="url"
          dir="ltr"
          aria-label={t(lang, `Link ${i + 1}`, `الرابط ${i + 1}`)}
          placeholder="https://"
          className={field}
          value={link}
          onChange={(e) => onChange(rows.map((r, j) => (j === i ? e.target.value : r)))}
        />
      ))}
      {rows.length < max && (
        <button type="button" onClick={() => onChange([...rows, ""])} className="flex min-h-11 items-center gap-space-3 self-start text-body font-medium text-[var(--f-accent-text)]">
          <Icon name="plus" size={18} />
          {t(lang, "Add another link", "إضافة رابط آخر")}
        </button>
      )}
    </div>
  );
}

/*
 * The client form's half of the question type registry: how each type is
 * answered. Same keys as the builder's editors and the answers renderers.
 */
export const CLIENT_INPUTS: Record<QuestionType, (props: ClientInputProps) => ReactNode> = {
  text: ({ question, value, onChange, describedBy, invalid, lang }) => {
    const props = {
      dir: "auto" as const,
      className: `${field} ${lang === "ar" ? "leading-[1.7]" : ""}`,
      value: typeof value === "string" ? value : "",
      "aria-describedby": describedBy,
      "aria-invalid": invalid || undefined,
      maxLength: question.config.maxLength ?? (question.config.multiline ? 5000 : 500),
    };
    return question.config.multiline ? (
      <textarea {...props} rows={4} onChange={(e) => onChange(e.target.value)} />
    ) : (
      <input {...props} onChange={(e) => onChange(e.target.value)} />
    );
  },
  choice: (props) => <ChoiceInput {...props} />,
  scale: (props) => <ScaleInput {...props} />,
  ranking: (props) => <RankingInput {...props} />,
  image_choice: (props) => <ImageChoiceInput {...props} />,
  upload: (props) => <UploadInput {...props} />,
  link: (props) => <LinkInput {...props} />,
};
