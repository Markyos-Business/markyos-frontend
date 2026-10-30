"use client";

import { createContext, useContext, useEffect, useRef, type ReactNode } from "react";
import { Button, Drawer, Icon, Skeleton } from "@/components/ui";
import { useCallNote } from "@/components/features/callnotes";
import { useRequest } from "@/hooks/useRequest";
import { getFormAnswer } from "../../services/briefsService";
import type { Citation, Evidence, SourceRef } from "../../types";
import { answerText } from "../../utils/answers";

type CitationsContextValue = {
  index: Record<string, SourceRef>;
  open: (citation: Citation) => void;
  isAr: boolean;
};

const CitationsContext = createContext<CitationsContextValue>({ index: {}, open: () => {}, isAr: false });

export const CitationsProvider = ({ value, children }: { value: CitationsContextValue; children: ReactNode }) => (
  <CitationsContext.Provider value={value}>{children}</CitationsContext.Provider>
);

/** "Form · Q12", "Call · 14 Oct · Omar Aziz": each opens its source beside the report. */
export function CitationChips({ citations }: { citations: Citation[] }) {
  const { index, open, isAr } = useContext(CitationsContext);
  if (!citations?.length) return null;
  return (
    <ul className="flex flex-wrap gap-space-2" aria-label={isAr ? "المصادر" : "Sources"}>
      {citations.map((c, i) => {
        const source = index[c.sourceId];
        return (
          <li key={`${c.sourceId}-${i}`}>
            <button
              type="button"
              onClick={() => open(c)}
              disabled={!source}
              title={c.quote}
              className="mk-btn inline-flex h-badge items-center gap-space-1 rounded-md bg-surface-2 px-space-3 text-caption font-medium text-text-muted hover:text-accent-text disabled:cursor-default"
            >
              <Icon name={c.source === "form" ? "clipboard-list" : "phone"} size={16} />
              <span className="bidi-plain">{source?.label ?? c.sourceId}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/** A claim's evidence: its sources, or that it was inferred, and how surely. */
export function EvidenceLine({ evidence }: { evidence: Evidence }) {
  const { isAr } = useContext(CitationsContext);
  const confidence = { high: isAr ? "ثقة عالية" : "high confidence", medium: isAr ? "ثقة متوسطة" : "medium confidence", low: isAr ? "ثقة منخفضة" : "low confidence" }[evidence.confidence];
  // Cited, but every citation was a call note left out of a client's link:
  // say where it came from rather than calling it a guess.
  if (evidence.basis === "cited" && !evidence.citations?.length) {
    return (
      <span className="text-caption text-text-muted">
        {isAr ? "من محادثاتنا" : "From our conversations"} · {confidence}
      </span>
    );
  }
  if (evidence.basis === "inferred" || !evidence.citations?.length) {
    return (
      <span className="text-caption text-text-muted">
        {isAr ? "استنتاج" : "Inferred"} · {confidence}
      </span>
    );
  }
  return <CitationChips citations={evidence.citations} />;
}

/** Lights an element briefly (≤ 600ms, no movement) once it's on screen. */
function useHighlight<T extends HTMLElement>(ready: boolean) {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!ready || !el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ block: "center", behavior: reduced ? "auto" : "smooth" });
    el.classList.add("bg-accent-soft");
    const t = window.setTimeout(() => el.classList.remove("bg-accent-soft"), 380);
    return () => window.clearTimeout(t);
  }, [ready]);
  return ref;
}

const lit = "rounded-lg px-space-5 py-space-4 transition-colors duration-base ease-standard motion-reduce:transition-none";

function CallSource({ source, citation, slug, isAr }: { source: Extract<SourceRef, { ref: { type: "call" } }>; citation: Citation; slug: string; isAr: boolean }) {
  const { data: note } = useCallNote(source.ref.noteId);
  const targetRef = useHighlight<HTMLLIElement>(!!note);
  if (!note) return <Skeleton className="h-40 w-full rounded-lg" />;
  const turn = source.ref.turn;
  const para = source.ref.para;
  const lines = turn != null ? note.turns : note.body.split("\n").filter((l) => l.trim()).map((text) => ({ speaker: null, timestamp: null, text }));
  const at = turn ?? para ?? 0;
  const from = Math.max(0, at - 2);
  const window_ = lines.slice(from, at + 3);
  const who = (label: string | null) => note.participants.find((p) => p.label === label)?.name ?? label;
  return (
    <div className="flex flex-col gap-space-5">
      <div className="flex flex-col gap-space-1">
        <span className="bidi-plain text-body font-medium text-text">{note.title}</span>
        <span className="text-caption text-text-muted">{source.label}</span>
      </div>
      <ol className="flex flex-col gap-space-2">
        {window_.map((line, i) => {
          const index = from + i;
          const isTarget = index === at;
          return (
            <li key={index} ref={isTarget ? targetRef : undefined} className={`${lit} ${isTarget ? "text-text" : "text-text-muted"}`}>
              {line.speaker && <span className="bidi-plain block text-caption font-medium text-text-secondary">{who(line.speaker)}{line.timestamp ? ` · ${line.timestamp}` : ""}</span>}
              <p dir="auto" className="text-body leading-[1.7]">
                {line.text}
              </p>
            </li>
          );
        })}
      </ol>
      <Button variant="link" href={`/w/${slug}/discovery/calls/${note.id}${turn != null ? `?turn=${turn}` : para != null ? `?para=${para}` : ""}`}>
        <Icon name="phone" size={16} />
        {isAr ? "فتح المكالمة" : "Open the call"}
      </Button>
      <span className="sr-only">{citation.quote}</span>
    </div>
  );
}

function FormSource({ source, slug, isAr }: { source: Extract<SourceRef, { ref: { type: "form" } }>; slug: string; isAr: boolean }) {
  const { formId, questionId } = source.ref;
  const { data: question, loading } = useRequest(() => getFormAnswer(formId, questionId), `${formId}:${questionId}`);
  const targetRef = useHighlight<HTMLDivElement>(!!question);
  if (loading && !question) return <Skeleton className="h-32 w-full rounded-lg" />;
  if (!question) return <p className="text-caption text-text-muted">{isAr ? "لم يعد هذا السؤال موجودًا." : "That question is no longer there."}</p>;
  const lang = question.answer?.answeredLanguage ?? "en";
  return (
    <div className="flex flex-col gap-space-5">
      <div className="flex flex-col gap-space-1">
        <span className="bidi-plain text-body font-medium text-text">{source.ref.formName}</span>
        <span className="text-caption text-text-muted">{source.label}</span>
      </div>
      <div ref={targetRef} className={lit}>
        <h3 dir="auto" className="text-body font-medium text-text-secondary">
          {question.title[lang] ?? question.title.en ?? question.title.ar}
        </h3>
        <p dir="auto" lang={lang} className="mt-space-2 text-body leading-[1.7] text-text">
          {question.answer ? answerText(question.answer.value) : isAr ? "لا إجابة" : "Not answered"}
        </p>
      </div>
      <Button variant="link" href={`/w/${slug}/forms/${formId}/answers?q=${questionId}`}>
        <Icon name="clipboard-list" size={16} />
        {isAr ? "فتح الإجابات" : "Open the answers"}
      </Button>
    </div>
  );
}

/** The side panel a citation opens: the exact answer or call turn, highlighted. */
export function CitationPanel({ citation, source, slug, onClose, isAr }: { citation: Citation | null; source: SourceRef | null; slug: string; onClose: () => void; isAr: boolean }) {
  return (
    <Drawer open={!!citation && !!source} title={isAr ? "المصدر" : "Source"} closeLabel={isAr ? "إغلاق" : "Close"} onClose={onClose}>
      {citation && source && (
        <>
          <blockquote dir="auto" className="rounded-lg bg-surface-sunken px-space-5 py-space-4 text-body text-text-secondary shadow-edge-soft">
            {citation.quote}
          </blockquote>
          {source.ref.type === "call" ? (
            <CallSource key={citation.sourceId} source={source as Extract<SourceRef, { ref: { type: "call" } }>} citation={citation} slug={slug} isAr={isAr} />
          ) : (
            <FormSource key={citation.sourceId} source={source as Extract<SourceRef, { ref: { type: "form" } }>} slug={slug} isAr={isAr} />
          )}
        </>
      )}
    </Drawer>
  );
}
