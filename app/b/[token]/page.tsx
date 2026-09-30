"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useApp } from "@/lib/store";
import { LangToggle } from "@/components/LangToggle";
import { PillButton } from "@/components/PillButton";
import { AutoTextarea } from "@/components/AutoTextarea";
import { CenteredMessage } from "@/components/workspace/guideline/ViewerChrome";
import { QUESTION_BY_KEY } from "@/lib/briefQuestions";
import { BriefQuestion, Lang } from "@/lib/types";

/**
 * The discovery brief, as the client sees it.
 *
 * No account, no app navigation, no way to reach anything else in the
 * workspace. It is the client's first contact with Markyos and it happens on
 * day one of the project rather than at handover — which is also what makes the
 * ownership transfer later feel like continuity rather than a sales step.
 *
 * Rendered in the *studio's* theme on purpose: the client's brand does not
 * exist yet, so there is nothing of theirs to render it in. Dressing this page
 * in a palette nobody has agreed to would be inventing their brand for them.
 *
 * Answers save as they are typed. A brief someone half-finished on a phone and
 * came back to on a laptop should not be a brief they have to start again.
 */
export default function BriefPage() {
  const params = useParams<{ token: string }>();
  const { hydrated, getBriefByToken, answerBrief, submitBrief } = useApp();
  const [langOverride, setLangOverride] = useState<Lang | null>(null);
  const [justSubmitted, setJustSubmitted] = useState(false);

  const found = hydrated ? getBriefByToken(params.token) : undefined;
  const lang: Lang = langOverride ?? found?.brief.lang ?? "en";
  const isAr = lang === "ar";

  const questions = useMemo(
    () =>
      (found?.brief.questions ?? [])
        .map((k) => QUESTION_BY_KEY.get(k))
        .filter((q): q is BriefQuestion => !!q),
    [found?.brief.questions],
  );

  if (!hydrated) return null;

  if (!found) {
    return (
      <CenteredMessage
        icon="unlink"
        title="This brief doesn't exist"
        arTitle="هذا الموجز غير موجود"
        body="The link may have been mistyped, or it belongs to a studio working in a different browser. Ask whoever sent it for a fresh link."
        arBody="قد يكون الرابط غير صحيح، أو يخص استوديو يعمل في متصفح آخر. اطلب رابطًا جديدًا ممن أرسله."
        isAr={isAr}
      />
    );
  }

  const { brief, workspace } = found;

  if (brief.revokedAt) {
    return (
      <CenteredMessage
        icon="lock"
        title="This brief was closed"
        arTitle="تم إغلاق هذا الموجز"
        body="The studio switched the link off. Ask them to send a new one if you still need to fill it in."
        arBody="أوقف الاستوديو الرابط. اطلب منهم إرسال رابط جديد إن كنت بحاجة لتعبئته."
        isAr={isAr}
      />
    );
  }

  // A brief that was never sent has no business being readable from outside.
  if (brief.status === "draft") {
    return (
      <CenteredMessage
        icon="clock"
        title="This brief isn't ready yet"
        arTitle="هذا الموجز غير جاهز بعد"
        body="The studio is still putting it together. They'll send it when it's ready."
        arBody="لا يزال الاستوديو يعدّه. سيرسلونه عند جهوزه."
        isAr={isAr}
      />
    );
  }

  if (brief.status === "submitted" || justSubmitted) {
    return (
      <CenteredMessage
        icon="check-circle"
        title="Thank you — that's everything"
        arTitle="شكرًا لك — هذا كل شيء"
        body={`Your answers are with ${workspace.name}. Nothing else is needed from you right now.`}
        arBody={`وصلت إجاباتك إلى ${workspace.name}. لا حاجة لشيء آخر منك الآن.`}
        isAr={isAr}
      />
    );
  }

  const answerFor = (key: string) => brief.answers.find((a) => a.questionKey === key)?.value ?? "";
  const answered = questions.filter((q) => answerFor(q.key).trim()).length;

  // Grouped so a long form reads as a handful of short sections rather than one
  // intimidating scroll. Order follows the studio's question order, not the
  // library's, so a reordered brief still groups the way it was arranged.
  const groups: { category: string; items: BriefQuestion[] }[] = [];
  for (const q of questions) {
    const last = groups[groups.length - 1];
    if (last && last.category === q.category) last.items.push(q);
    else groups.push({ category: q.category, items: [q] });
  }

  return (
    <div dir={isAr ? "rtl" : "ltr"} className="min-h-screen" style={{ background: "var(--surface-0)" }}>
      <header
        className="sticky top-0 z-30 px-6 md:px-10 py-4 flex items-center gap-4 flex-wrap"
        style={{ background: "var(--surface-0)", boxShadow: "inset 0 -1px 0 var(--hairline)" }}
      >
        <span dir="auto" className="bidi-auto text-[15px] font-semibold" style={{ fontFamily: "var(--font-display)" }}>
          {workspace.name}
        </span>
        <span className="text-[12.5px]" style={{ color: "var(--text-faint)" }}>
          {isAr ? "موجز التعريف بالعلامة" : "Brand discovery brief"}
        </span>
        <div className="ms-auto flex items-center gap-3">
          <span className="text-[12px]" style={{ color: "var(--text-muted)" }}>
            {isAr ? `${answered} من ${questions.length}` : `${answered} of ${questions.length}`}
          </span>
          <LangToggle
            value={lang}
            onChange={setLangOverride}
            size="sm"
            label={isAr ? "لغة الإجابة" : "Language to answer in"}
          />
        </div>
      </header>

      <main className="px-6 md:px-10 py-9 max-w-[720px] mx-auto flex flex-col gap-9">
        <div className="flex flex-col gap-2.5">
          <h1 className="text-[28px] md:text-[34px] font-semibold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
            {isAr ? "لنبدأ من الأساس" : "Let's start with the basics"}
          </h1>
          <p className="text-[14.5px] leading-[1.65]" style={{ color: "var(--text-muted)" }}>
            {isAr
              ? "لا توجد إجابات خاطئة، ولا حاجة لإكمال كل شيء الآن — إجاباتك تُحفظ تلقائيًا ويمكنك العودة في أي وقت. اكتب بالعربية أو الإنجليزية، أيهما أسهل عليك."
              : "There are no wrong answers, and you don't have to finish in one sitting — everything saves as you type, so you can come back whenever. Write in Arabic or English, whichever is easier."}
          </p>
        </div>

        {groups.map((group) => (
          <section key={group.category} className="flex flex-col gap-5">
            <h2
              className="text-[11px] font-semibold uppercase"
              style={{ letterSpacing: ".1em", color: "var(--text-faint)" }}
            >
              {group.category}
            </h2>
            {group.items.map((q) => (
              <QuestionField
                key={q.key}
                question={q}
                isAr={isAr}
                value={answerFor(q.key)}
                onChange={(v) => answerBrief(brief.token, q.key, v)}
              />
            ))}
          </section>
        ))}

        <div
          className="rounded-2xl p-5 flex flex-col gap-3"
          style={{ background: "var(--surface-1)", boxShadow: "inset 0 0 0 1px var(--hairline-strong)" }}
        >
          <p className="text-[13px] leading-[1.6]" style={{ color: "var(--text-muted)" }}>
            {isAr
              ? "عند الإرسال سيراجع الاستوديو إجاباتك. لا شيء ينشر تلقائيًا."
              : "When you send this, the studio reads your answers and decides what to use. Nothing is published automatically."}
          </p>
          <div>
            <PillButton
              onClick={() => {
                submitBrief(brief.token);
                setJustSubmitted(true);
              }}
              disabled={answered === 0}
            >
              {isAr ? "إرسال الإجابات" : "Send my answers"}
            </PillButton>
          </div>
          {answered === 0 && (
            <span className="text-[12px]" style={{ color: "var(--text-faint)" }}>
              {isAr ? "أجب عن سؤال واحد على الأقل." : "Answer at least one question first."}
            </span>
          )}
        </div>
      </main>
    </div>
  );
}

function QuestionField({
  question,
  isAr,
  value,
  onChange,
}: {
  question: BriefQuestion;
  isAr: boolean;
  value: string;
  onChange: (value: string) => void;
}) {
  const prompt = isAr ? question.promptAr : question.promptEn;
  const help = isAr ? question.helpAr : question.helpEn;
  const id = `bq-${question.key}`;
  /*
   * A group of radios has no single control for `htmlFor` to point at, so the
   * prompt has to *be* the element `aria-labelledby` names. Using `htmlFor`
   * there left both the label and the group pointing at an id that did not
   * exist, which reads as an unlabelled group.
   */
  const isGroup = question.type === "choice" || question.type === "scale";

  return (
    <div className="flex flex-col gap-2">
      <label
        {...(isGroup ? { id } : { htmlFor: id })}
        dir="auto"
        className="bidi-auto text-[15px] font-medium leading-[1.5]"
      >
        {prompt}
      </label>
      {help && (
        <span
          id={`${id}-help`}
          dir="auto"
          className="bidi-auto text-[12.5px] leading-[1.55]"
          style={{ color: "var(--text-faint)" }}
        >
          {help}
        </span>
      )}

      {question.type === "choice" && question.choices ? (
        <div
          role="radiogroup"
          aria-labelledby={id}
          aria-describedby={help ? `${id}-help` : undefined}
          className="flex flex-wrap gap-2 mt-0.5"
        >
          {question.choices.map((c) => {
            const active = value === c.value;
            return (
              <button
                key={c.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onChange(c.value)}
                className="h-9 px-3.5 rounded-full text-[12.5px] font-medium cursor-pointer"
                style={{
                  background: active ? "var(--accent-soft)" : "var(--surface-1)",
                  color: active ? "var(--accent-on-soft)" : "var(--text-muted)",
                  boxShadow: active ? "inset 0 0 0 1px var(--accent-ring)" : "inset 0 0 0 1px var(--hairline)",
                }}
              >
                {isAr ? c.labelAr : c.labelEn}
              </button>
            );
          })}
        </div>
      ) : question.type === "scale" ? (
        <div
          role="radiogroup"
          aria-labelledby={id}
          aria-describedby={help ? `${id}-help` : undefined}
          className="flex items-center gap-2 mt-0.5"
        >
          {[1, 2, 3, 4, 5].map((n) => {
            const active = value === String(n);
            return (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={active}
                aria-label={String(n)}
                onClick={() => onChange(String(n))}
                className="w-10 h-10 rounded-xl text-[13px] font-semibold cursor-pointer"
                style={{
                  background: active ? "var(--accent-soft)" : "var(--surface-1)",
                  color: active ? "var(--accent-on-soft)" : "var(--text-muted)",
                  boxShadow: active ? "inset 0 0 0 1px var(--accent-ring)" : "inset 0 0 0 1px var(--hairline)",
                }}
              >
                {n}
              </button>
            );
          })}
        </div>
      ) : (
        <AutoTextarea
          id={id}
          aria-describedby={help ? `${id}-help` : undefined}
          dir="auto"
          value={value}
          onChange={onChange}
          minRows={question.type === "long" ? 3 : 1}
          placeholder={isAr ? "اكتب إجابتك…" : "Your answer…"}
          className="bidi-auto w-full rounded-xl px-3.5 py-3 text-[14px] outline-none resize-none"
          style={{
            background: "var(--surface-1)",
            color: "var(--text)",
            boxShadow: "inset 0 0 0 1px var(--hairline-strong)",
            lineHeight: 1.6,
          }}
        />
      )}
    </div>
  );
}
