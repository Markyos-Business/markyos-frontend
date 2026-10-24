"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/ui";
import type { Lang } from "@/types";
import { AnswerError, isEmptyAnswer, textIn, validateAnswer } from "../../model/questionTypes";
import { formPalette, paletteVars } from "../../model/theme";
import { evaluateVisibility } from "../../model/visibility";
import type { AnswerValue, PublicForm, PublicQuestion, UploadedFile } from "../../types";
import { CLIENT_INPUTS } from "./typeInputs";

export type SaveState = "idle" | "saving" | "saved" | "error";

type ClientFormProps = {
  form: PublicForm;
  answers: Record<string, AnswerValue>;
  onAnswer: (questionId: string, value: AnswerValue) => void;
  saveState?: SaveState;
  /** Resolves to an error message, or null once submitted. */
  onSubmit: () => Promise<string | null>;
  submitted: boolean;
  onUpload?: (questionId: string, file: File) => Promise<UploadedFile>;
  files: Record<string, UploadedFile>;
  lang: Lang;
  onLang: (lang: Lang) => void;
  /** The studio's preview: nothing saves, and it sits inside a frame. */
  preview?: boolean;
};

const COPY = {
  start: { en: "Start", ar: "ابدأ" },
  next: { en: "Next section", ar: "القسم التالي" },
  back: { en: "Back", ar: "رجوع" },
  submit: { en: "Submit answers", ar: "إرسال الإجابات" },
  submitting: { en: "Sending…", ar: "جارٍ الإرسال…" },
  required: { en: "Required", ar: "مطلوب" },
  answerThis: { en: "Answer this to continue.", ar: "أجب عن هذا للمتابعة." },
  saving: { en: "Saving…", ar: "جارٍ الحفظ…" },
  saved: { en: "Saved", ar: "تم الحفظ" },
  notSaved: { en: "Not saved — check your connection", ar: "لم يُحفظ — تحقّق من الاتصال" },
  resume: { en: "Your answers save as you go. Come back to this link any time to finish.", ar: "تُحفظ إجاباتك تلقائيًا. عُد إلى هذا الرابط متى شئت لإكمالها." },
  doneTitle: { en: "Thank you. Your answers are in.", ar: "شكرًا لكم، وصلت إجاباتكم." },
  doneBody: { en: "The studio has them now and will be in touch.", ar: "أصبحت لدى الاستوديو، وسيتواصل معكم قريبًا." },
  step: { en: "Section", ar: "القسم" },
  of: { en: "of", ar: "من" },
  madeWith: { en: "Made with Markyos", ar: "صُنع باستخدام ماركيوس" },
} as const;

/**
 * The questionnaire as the client sees it: the studio's brand, not Markyos's,
 * one section at a time, in the language they choose. Shared by the public
 * link and the studio's live preview.
 */
export function ClientForm({ form, answers, onAnswer, saveState = "idle", onSubmit, submitted, onUpload, files, lang, onLang, preview = false }: ClientFormProps) {
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const c = (key: keyof typeof COPY) => COPY[key][lang];
  const { palette } = formPalette(form.theme);
  const isAr = lang === "ar";

  const all = useMemo(() => form.sections.flatMap((s) => s.questions), [form]);
  const visible = useMemo(() => evaluateVisibility(all, answers), [all, answers]);
  const sections = form.sections;
  const section = step >= 1 ? sections[step - 1] : null;
  const last = step === sections.length;

  /** The visible required questions of `ids` that are still unanswered. */
  const missing = (questions: PublicQuestion[]) => {
    const found: Record<string, string> = {};
    for (const q of questions) {
      if (!visible.has(q.id)) continue;
      const value = answers[q.id] ?? null;
      if (q.required && isEmptyAnswer(q.type, value)) found[q.id] = c("answerThis");
      else if (!isEmptyAnswer(q.type, value)) {
        try {
          validateAnswer(q.type, q.config, value);
        } catch (err) {
          if (err instanceof AnswerError) found[q.id] = err.message;
        }
      }
    }
    return found;
  };

  const go = (to: number) => {
    setStep(to);
    setErrors({});
    if (!preview) window.scrollTo({ top: 0 });
  };

  const next = async () => {
    if (!section) return go(1);
    const found = missing(section.questions);
    setErrors(found);
    if (Object.keys(found).length) return;
    if (!last) return go(step + 1);
    // The whole form, in case an earlier section changed after it was left.
    for (let i = 0; i < sections.length; i++) {
      const earlier = missing(sections[i].questions);
      if (Object.keys(earlier).length) {
        setStep(i + 1);
        setErrors(earlier);
        return;
      }
    }
    setSubmitting(true);
    setSubmitError(await onSubmit());
    setSubmitting(false);
  };

  const change = (q: PublicQuestion, value: AnswerValue) => {
    // Typed text and links are checked when leaving the section; anything with
    // a limit (picks, files) is refused at once with the reason.
    if (q.type !== "text" && q.type !== "link") {
      try {
        validateAnswer(q.type, q.config, value);
      } catch (err) {
        if (err instanceof AnswerError) return setErrors((e) => ({ ...e, [q.id]: err.message }));
      }
    }
    setErrors((e) => {
      const rest = { ...e };
      delete rest[q.id];
      return rest;
    });
    onAnswer(q.id, value);
  };

  const progress = sections.length ? Math.min(step, sections.length) / sections.length : 0;

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      lang={lang}
      style={paletteVars(palette)}
      className={`flex flex-col bg-[var(--f-background)] text-[var(--f-text)] ${preview ? "min-h-full" : "min-h-screen"} ${isAr ? "font-arabic" : ""}`}
    >
      <header className="flex min-h-16 items-center justify-between gap-space-5 px-space-6">
        {form.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={form.logoUrl} alt={form.studioName} className="h-8 w-auto max-w-40 object-contain" />
        ) : (
          <span className="text-body font-medium">{form.studioName}</span>
        )}
        <div className="flex items-center gap-space-4">
          {!submitted && saveState !== "idle" && (
            <span role="status" aria-live="polite" className="text-caption text-[var(--f-muted)]">
              {saveState === "saving" ? c("saving") : saveState === "saved" ? c("saved") : c("notSaved")}
            </span>
          )}
          {form.languages.length > 1 && (
            <div role="radiogroup" aria-label={isAr ? "اللغة" : "Language"} className="flex rounded-lg bg-[var(--f-raised)] p-1 shadow-[inset_0_0_0_1px_var(--f-line)]">
              {(["en", "ar"] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  role="radio"
                  aria-checked={lang === l}
                  lang={l}
                  onClick={() => onLang(l)}
                  className={`grid h-9 min-w-11 place-items-center rounded-md px-space-4 text-caption font-medium ${
                    lang === l ? "bg-[var(--f-surface)] text-[var(--f-text)] shadow-[inset_0_0_0_1px_var(--f-line)]" : "text-[var(--f-muted)]"
                  }`}
                >
                  {l === "en" ? "EN" : "ع"}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {step >= 1 && !submitted && (
        <div className="px-space-6">
          <div className="mx-auto flex w-full max-w-160 flex-col gap-space-2">
            <span className="text-caption text-[var(--f-muted)]">
              {c("step")} {step} {c("of")} {sections.length}
            </span>
            <span className="h-1.5 overflow-hidden rounded-full bg-[var(--f-raised)]">
              <span
                className="block h-full origin-left rounded-full bg-[var(--f-accent)] transition-transform duration-base rtl:origin-right"
                style={{ transform: `scaleX(${progress})` }}
              />
            </span>
          </div>
        </div>
      )}

      <main className="flex-1 px-space-6 py-space-8">
        {/* Keyed by step, so a new section crossfades in (120ms; off under reduced motion). */}
        <div key={submitted ? "done" : step} className="mx-auto flex w-full max-w-160 animate-fade-in flex-col gap-space-8">
          {submitted ? (
            <div className="flex flex-col items-start gap-space-5 rounded-card bg-[var(--f-surface)] p-space-10 shadow-[inset_0_0_0_1px_var(--f-line)]">
              <span className="grid size-control place-items-center rounded-lg bg-[var(--f-accent)] text-[var(--f-accent-ink)]">
                <Icon name="check" size={22} />
              </span>
              <h1 className={`text-h3 font-medium ${isAr ? "leading-[1.3]" : ""}`}>{c("doneTitle")}</h1>
              <p className={`text-body text-[var(--f-muted)] ${isAr ? "leading-[1.7]" : ""}`}>{c("doneBody")}</p>
            </div>
          ) : step === 0 ? (
            <div className="flex flex-col gap-space-6 rounded-card bg-[var(--f-surface)] p-space-10 shadow-[inset_0_0_0_1px_var(--f-line)]">
              <h1 className={`text-h2 font-medium ${isAr ? "leading-[1.3]" : ""}`}>{form.name}</h1>
              {textIn(form.theme.welcome, lang) && (
                <p className={`whitespace-pre-line text-body text-[var(--f-muted)] ${isAr ? "leading-[1.7]" : ""}`}>{textIn(form.theme.welcome, lang)}</p>
              )}
              {form.allowSaveAndResume && <p className="text-caption text-[var(--f-muted)]">{c("resume")}</p>}
              <div>
                <button type="button" onClick={() => go(1)} className="flex h-11 items-center gap-space-3 rounded-lg bg-[var(--f-accent)] px-space-8 text-body font-medium text-[var(--f-accent-ink)]">
                  {c("start")}
                  <Icon name="arrow-right" size={18} className="rtl:-scale-x-100" />
                </button>
              </div>
            </div>
          ) : (
            section && (
              <>
                <h1 className={`text-h3 font-medium ${isAr ? "leading-[1.3]" : ""}`}>{textIn(section.title, lang)}</h1>
                {section.questions
                  .filter((q) => visible.has(q.id))
                  .map((q) => {
                    const Input = CLIENT_INPUTS[q.type];
                    const noteId = `q-${q.id}-note`;
                    const help = textIn(q.help, lang);
                    return (
                      <section key={q.id} aria-labelledby={`q-${q.id}`} className="flex flex-col gap-space-4 rounded-card bg-[var(--f-surface)] p-space-8 shadow-[inset_0_0_0_1px_var(--f-line)]">
                        <h2 id={`q-${q.id}`} className={`text-h5 font-medium ${isAr ? "leading-[1.6]" : ""}`}>
                          {textIn(q.title, lang)}
                          {q.required && (
                            <span className="ms-space-2 text-caption text-[var(--f-muted)]">
                              <span aria-hidden>*</span>
                              <span className="sr-only">{c("required")}</span>
                            </span>
                          )}
                        </h2>
                        {help && <p className={`text-body text-[var(--f-muted)] ${isAr ? "leading-[1.7]" : ""}`}>{help}</p>}
                        <Input
                          question={q}
                          value={answers[q.id] ?? null}
                          onChange={(value) => change(q, value)}
                          lang={lang}
                          onUpload={onUpload ? (file) => onUpload(q.id, file) : undefined}
                          files={files}
                          invalid={!!errors[q.id]}
                          describedBy={noteId}
                        />
                        <p id={noteId} role={errors[q.id] ? "alert" : undefined} className="text-caption font-medium text-[var(--f-text)]">
                          {errors[q.id] ?? ""}
                        </p>
                      </section>
                    );
                  })}
                {submitError && (
                  <p role="alert" className="rounded-lg bg-[var(--f-raised)] px-space-6 py-space-5 text-body shadow-[inset_0_0_0_1px_var(--f-line)]">
                    {submitError}
                  </p>
                )}
                <div className="flex flex-wrap justify-between gap-space-4">
                  <button
                    type="button"
                    onClick={() => go(step - 1)}
                    className="flex h-11 items-center gap-space-3 rounded-lg px-space-6 text-body font-medium text-[var(--f-text)] shadow-[inset_0_0_0_1px_var(--f-line)]"
                  >
                    <Icon name="arrow-left" size={18} className="rtl:-scale-x-100" />
                    {c("back")}
                  </button>
                  <button
                    type="button"
                    onClick={() => void next()}
                    disabled={submitting}
                    className="flex h-11 items-center gap-space-3 rounded-lg bg-[var(--f-accent)] px-space-8 text-body font-medium text-[var(--f-accent-ink)] disabled:opacity-70"
                  >
                    {last ? (submitting ? c("submitting") : c("submit")) : c("next")}
                    {!last && <Icon name="arrow-right" size={18} className="rtl:-scale-x-100" />}
                  </button>
                </div>
              </>
            )
          )}
        </div>
      </main>

      {form.theme.showMarkyosBadge && (
        <footer className="flex justify-center px-space-6 py-space-6">
          <span className="text-caption text-[var(--f-muted)]">{c("madeWith")}</span>
        </footer>
      )}
    </div>
  );
}
