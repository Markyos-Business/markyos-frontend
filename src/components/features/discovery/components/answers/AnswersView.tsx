"use client";

import { useState } from "react";
import { AlertBanner, Badge, Button, EmptyState, Icon, Skeleton, StatTile, useDialog, useToast } from "@/components/ui";
import { translateText } from "@/components/features/strategy";
import { STATUS_META } from "../../constants";
import { useResponses } from "../../hooks/useResponses";
import { textIn } from "../../model/questionTypes";
import { reopenForm } from "../../services/discoveryService";
import type { FormEventType, ResponsesView, UploadedFile } from "../../types";
import { formatDayTime, formatDuration } from "../../utils/format";
import { TYPE_RESULTS } from "./typeResults";

type AnswersViewProps = {
  formId: string;
  builderHref: string;
  sendHref: string;
  strategyHref: string;
  isAr: boolean;
  /** The AI analysis action, when the brand has one (phase 7). */
  analysis?: React.ReactNode;
};

const EVENT_LABELS: Record<FormEventType, { en: string; ar: string; icon: string }> = {
  created: { en: "Created", ar: "أُنشئ", icon: "plus" },
  sent: { en: "Sent", ar: "أُرسل", icon: "envelope" },
  opened: { en: "Opened", ar: "فُتح", icon: "eye" },
  first_answer: { en: "First answer", ar: "أول إجابة", icon: "pen" },
  section_completed: { en: "Section completed", ar: "اكتمل قسم", icon: "check" },
  submitted: { en: "Submitted", ar: "سُلِّم", icon: "check-circle" },
  reminded: { en: "Reminder sent", ar: "أُرسل تذكير", icon: "clock" },
  reopened: { en: "Reopened", ar: "أُعيد فتحه", icon: "undo" },
  analysed: { en: "Analysed", ar: "حُلِّل", icon: "chart-line" },
};

/**
 * What the client said: the timeline, the counters, and every answer by
 * section, each in the language it was written in.
 */
export function AnswersView({ formId, builderHref, sendHref, strategyHref, isAr, analysis }: AnswersViewProps) {
  const { data, error, loading, reload } = useResponses(formId);
  const { confirm } = useDialog();
  const { showToast } = useToast();
  const [sectionId, setSectionId] = useState<string | null>(null);
  const lang = isAr ? "ar" : "en";
  const t = (en: string, ar: string) => (isAr ? ar : en);

  if (error && !data) return <EmptyState icon="exclamation-circle" title={t("Couldn't load the answers", "تعذّر تحميل الإجابات")} description={error} />;
  if (loading && !data) return <Skeleton className="h-96 w-full rounded-card" />;
  if (!data) return null;

  const { form, counters } = data;
  const status = STATUS_META[form.status];
  const files = data.files;
  const shown = data.sections.filter((s) => !sectionId || s.id === sectionId);

  const reopen = async () => {
    const ok = await confirm({
      title: t("Reopen this form?", "إعادة فتح النموذج؟"),
      body: t("Your client can change their answers and submit again.", "يمكن لعميلك تعديل إجاباته وإرسالها من جديد."),
      confirmLabel: t("Reopen", "إعادة الفتح"),
      isAr,
    });
    if (!ok) return;
    try {
      await reopenForm(formId);
      showToast(t("Reopened", "أُعيد فتحه"), "success");
      reload();
    } catch (err) {
      showToast(err instanceof Error ? err.message : t("That didn't work.", "لم ينجح ذلك."), "danger");
    }
  };

  return (
    <div className="flex flex-col gap-5 print:gap-space-6">
      <div className="flex flex-wrap items-center gap-space-5">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-h3 font-medium">{form.name}</h1>
          <div className="flex flex-wrap items-center gap-space-4 text-caption text-text-muted">
            <Badge tone={status.tone} dot>
              {status[lang]}
            </Badge>
            <span>
              {form.recipientName || t("No client named", "لم يُحدَّد العميل")} · {form.workspaceName}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-space-3 print:hidden">
          <Button variant="outline" size="sm" href={builderHref}>
            {t("Questions", "الأسئلة")}
          </Button>
          <Button variant="outline" size="sm" href={sendHref}>
            {t("Theme and link", "التصميم والرابط")}
          </Button>
          {form.status === "submitted" && (
            <Button variant="outline" size="sm" onClick={() => void reopen()} icon={<Icon name="undo" size={16} />}>
              {t("Reopen", "إعادة الفتح")}
            </Button>
          )}
          {/* The browser's print-to-PDF keeps Arabic shaping and direction intact. */}
          <Button variant="outline" size="sm" onClick={() => window.print()} icon={<Icon name="download" size={16} />}>
            {t("Export PDF", "تصدير PDF")}
          </Button>
          <Button variant="outline" size="sm" href={strategyHref} icon={<Icon name="bullseye" size={16} />}>
            {t("Open in Strategy Hub", "فتح في مركز الاستراتيجية")}
          </Button>
          {analysis}
        </div>
      </div>

      <AlertBanner message={error} />

      <div className="grid grid-cols-2 gap-space-4 sm:grid-cols-4">
        <StatTile value={`${counters.answered}/${counters.total}`} label={t("Answered", "أُجيب عنها")} />
        <StatTile value={formatDuration(counters.timeToSubmitSeconds, isAr)} label={t("Time to submit", "مدة الإجابة")} />
        <StatTile value={counters.respondents} label={t("Respondents", "المجيبون")} />
        <StatTile value={counters.files} label={t("Files", "الملفات")} />
      </div>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
        <div className="flex flex-col gap-5 lg:sticky lg:top-0 print:hidden">
          <nav aria-label={t("Sections", "الأقسام")} className="mk-surface flex flex-col rounded-card bg-surface-1 p-space-3">
            <button
              type="button"
              aria-current={!sectionId ? "true" : undefined}
              onClick={() => setSectionId(null)}
              className={`flex min-h-10 items-center rounded-md px-space-4 text-start text-body ${!sectionId ? "bg-surface-2 font-medium text-text shadow-edge" : "text-text-muted hover:text-text"}`}
            >
              {t("All sections", "كل الأقسام")}
            </button>
            {data.sections.map((s) => {
              const answered = s.questions.filter((q) => q.answer).length;
              const visible = s.questions.filter((q) => q.visible).length;
              return (
                <button
                  key={s.id}
                  type="button"
                  aria-current={sectionId === s.id ? "true" : undefined}
                  onClick={() => setSectionId(s.id)}
                  className={`flex min-h-10 items-center justify-between gap-space-3 rounded-md px-space-4 text-start text-body ${
                    sectionId === s.id ? "bg-surface-2 font-medium text-text shadow-edge" : "text-text-muted hover:text-text"
                  }`}
                >
                  <span className="truncate" dir="auto">
                    {textIn(s.title, lang)}
                  </span>
                  <span className="text-caption tabular-nums">
                    {answered}/{visible}
                  </span>
                </button>
              );
            })}
          </nav>

          <section aria-label={t("Timeline", "الخط الزمني")} className="mk-surface flex flex-col gap-space-5 rounded-card bg-surface-1 p-space-8">
            <h2 className="text-h5 font-medium">{t("Timeline", "الخط الزمني")}</h2>
            <ol className="flex flex-col gap-space-5">
              {data.events.map((e, i) => {
                const meta = EVENT_LABELS[e.type];
                return (
                  <li key={i} className="flex gap-space-4">
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent-on-soft">
                      <Icon name={meta.icon} size={16} />
                    </span>
                    <span className="flex flex-col">
                      <span className="text-body font-medium">{meta[lang]}</span>
                      <span className="text-caption text-text-muted">
                        {formatDayTime(e.at, isAr)}
                        {e.actor ? ` · ${e.actor}` : ""}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ol>
          </section>
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          {!data.response && (
            <EmptyState
              icon="inbox"
              title={t("No answers yet", "لا إجابات بعد")}
              description={
                form.status === "draft"
                  ? t("Send the form and answers appear here as your client saves them.", "أرسل النموذج، وستظهر الإجابات هنا فور حفظها.")
                  : t("Answers appear here as your client saves them.", "ستظهر الإجابات هنا فور حفظ عميلك لها.")
              }
            />
          )}
          {data.response &&
            shown.map((s) => (
              <section key={s.id} className="mk-surface flex flex-col rounded-card bg-surface-1 print:shadow-none">
                <h2 className="px-space-8 py-space-6 text-h5 font-medium shadow-rule-b" dir="auto">
                  {textIn(s.title, lang)}
                </h2>
                {s.questions.map((q) => (
                  <AnswerRow key={q.id} question={q} lang={lang} isAr={isAr} files={files} />
                ))}
              </section>
            ))}
        </div>
      </div>
    </div>
  );
}

type Row = ResponsesView["sections"][number]["questions"][number];

/** One answer: the question, then what was said, in the language it was said in. */
function AnswerRow({ question, lang, isAr, files }: { question: Row; lang: "en" | "ar"; isAr: boolean; files: Record<string, UploadedFile> }) {
  const [translation, setTranslation] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const Result = TYPE_RESULTS[question.type];
  const answer = question.answer;
  const foreign = answer && question.type === "text" && answer.answeredLanguage !== lang;

  const translate = async () => {
    if (translation) return setTranslation(null);
    setTranslating(true);
    try {
      setTranslation(await translateText(String(answer!.value), answer!.answeredLanguage === "ar" ? "ar-en" : "en-ar"));
    } catch {
      setTranslation(t("The translation service didn't answer. Try again in a minute.", "لم تستجب خدمة الترجمة. حاول بعد دقيقة."));
    }
    setTranslating(false);
  };

  return (
    <div className={`flex flex-col gap-space-3 px-space-8 py-space-6 shadow-rule-t first:shadow-none ${question.visible ? "" : "opacity-60"}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-space-3">
        <h3 className="text-body font-medium text-text-secondary" dir="auto">
          {textIn(question.title, lang)}
        </h3>
        {!question.visible && <span className="text-caption text-text-muted">{t("Hidden by the client's answers", "مخفي بحسب إجابات العميل")}</span>}
      </div>
      {answer ? (
        <>
          {/* Arabic answers read natively: their own direction and leading. */}
          <div dir={answer.answeredLanguage === "ar" ? "rtl" : "ltr"} lang={answer.answeredLanguage} className={answer.answeredLanguage === "ar" ? "leading-[1.7]" : ""}>
            <Result question={question} value={answer.value} lang={lang} files={files} />
          </div>
          {foreign && (
            <div className="flex flex-col gap-space-2 print:hidden">
              <Button variant="link" onClick={() => void translate()} disabled={translating}>
                <Icon name="language" size={16} />
                {translating ? t("Translating…", "جارٍ الترجمة…") : translation ? t("Hide translation", "إخفاء الترجمة") : t("Show machine translation", "عرض ترجمة آلية")}
              </Button>
              {translation && (
                <p dir={lang === "ar" ? "rtl" : "ltr"} className="rounded-lg bg-surface-sunken px-space-5 py-space-4 text-body text-text-muted shadow-edge-soft">
                  <span className="mb-space-1 block text-caption">{t("Machine translation", "ترجمة آلية")}</span>
                  {translation}
                </p>
              )}
            </div>
          )}
        </>
      ) : (
        <p className="text-caption text-text-muted">{question.visible ? t("Not answered", "لم يُجَب عنه") : ""}</p>
      )}
    </div>
  );
}
