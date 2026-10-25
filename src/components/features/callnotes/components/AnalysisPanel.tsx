"use client";

import Link from "next/link";
import { Badge, Button, Icon, Skeleton } from "@/components/ui";
import { formatAgo } from "@/components/features/discovery";
import { CONFIDENCE_META, FIELD_META, NOTE_TARGET_META } from "../constants";
import { useAnalysis } from "../hooks/useAnalysis";
import type { Citation } from "../types";
import { citationHref } from "../utils/citations";

type AnalysisPanelProps = { brandId: string; brandSlug: string; canRun: boolean; isAr: boolean };

const FIELD_ORDER = ["purpose", "mission", "vision", "targetAudienceSummary", "positioningStatement", "uvp"];

function Citations({ citations, slug }: { citations: Citation[]; slug: string }) {
  if (!citations.length) return null;
  return (
    <ul className="flex flex-wrap gap-space-2">
      {citations.map((c) => (
        <li key={c.id}>
          <Link
            href={citationHref(slug, c)}
            className="mk-btn inline-flex h-badge items-center gap-space-1 rounded-md bg-surface-2 px-space-3 text-caption font-medium text-text-muted hover:text-accent-text"
          >
            <Icon name={c.ref.type === "form" ? "clipboard-list" : "phone"} size={16} />
            <span className="bidi-plain">{c.label}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/**
 * The analysis of everything the client said: what it proposes for the
 * strategy, each claim with its sources, and whether the inputs changed
 * since it ran.
 */
export function AnalysisPanel({ brandId, brandSlug, canRun, isAr }: AnalysisPanelProps) {
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const lang = isAr ? "ar" : "en";
  const { state, loading, error, running, runError, run } = useAnalysis(brandId);
  const analysis = state?.analysis ?? null;

  const runButton = canRun && state?.configured && (
    <Button
      variant={analysis ? "outline" : "primary"}
      size="sm"
      onClick={() => void run()}
      disabled={running}
      icon={<Icon name={analysis ? "history" : "chart-line"} size={16} />}
    >
      {running ? t("Analysing…", "جارٍ التحليل…") : analysis ? t("Re-run", "إعادة التشغيل") : t("Run analysis", "تشغيل التحليل")}
    </Button>
  );

  return (
    <section id="analysis" aria-label={t("Analysis", "التحليل")} className="mk-surface flex scroll-mt-space-10 flex-col gap-space-6 rounded-card bg-surface-1 p-space-8 sm:p-space-10">
      <div className="flex flex-wrap items-start justify-between gap-space-5">
        <div className="flex flex-col gap-space-1">
          <h2 className="text-h5 font-medium">{t("Analysis", "التحليل")}</h2>
          <p className="text-caption text-text-muted">
            {analysis
              ? `${t("Updated", "حُدِّث")} ${formatAgo(analysis.at, isAr)}${analysis.by ? ` · ${analysis.by}` : ""} · ${analysis.inputs.forms} ${t(
                  analysis.inputs.forms === 1 ? "form" : "forms",
                  "نموذج"
                )}, ${analysis.inputs.calls} ${t(analysis.inputs.calls === 1 ? "call" : "calls", "مكالمة")}`
              : t("Reads submitted form answers and included call notes, and cites every claim.", "يقرأ إجابات النماذج المرسلة وملاحظات المكالمات المضمّنة، ويستشهد بمصدر كل فكرة.")}
          </p>
        </div>
        {runButton}
      </div>

      {loading && <Skeleton className="h-24 w-full rounded-lg" />}
      {(error || runError) && <p className="text-caption text-danger">{runError ?? error}</p>}
      {running && <p role="status" className="text-caption text-text-muted">{t("Reading everything the client said. This can take a minute.", "يقرأ كل ما قاله العميل. قد يستغرق ذلك دقيقة.")}</p>}
      {state && !state.configured && (
        <p className="text-caption text-text-muted">{t("The analysis isn't set up on this server.", "التحليل غير مُعدّ على هذا الخادم.")}</p>
      )}

      {state?.stale && analysis && (
        <div role="status" className="flex flex-wrap items-center justify-between gap-space-4 rounded-lg bg-info-soft px-space-6 py-space-4 text-body text-info">
          {t("Notes changed since last analysis.", "تغيّرت الملاحظات منذ آخر تحليل.")}
          {runButton}
        </div>
      )}

      {analysis?.inputs.cut.map((cut) => (
        <p key={cut.noteId} className="rounded-lg bg-warning-soft px-space-6 py-space-4 text-body text-warning">
          <span className="bidi-plain font-medium">{cut.title}</span>
          {t(
            `: ${cut.wordsSent.toLocaleString("en")} of ${cut.wordsTotal.toLocaleString("en")} words were read. The rest didn't fit.`,
            `: قُرئت ${cut.wordsSent.toLocaleString("en")} من ${cut.wordsTotal.toLocaleString("en")} كلمة، ولم يتّسع الباقي.`
          )}
        </p>
      ))}

      {analysis && (
        <>
          <p dir="auto" className={`text-body text-text ${isAr ? "leading-[1.7]" : ""}`}>
            {analysis.summary[lang]}
          </p>

          <ul className="flex flex-col">
            {FIELD_ORDER.map((name) => {
              const field = analysis.fields[name];
              if (!field) return null;
              const confidence = CONFIDENCE_META[field.confidence];
              return (
                <li key={name} className="flex flex-col gap-space-3 py-space-5 shadow-rule-t first:shadow-none">
                  <div className="flex items-center justify-between gap-space-3">
                    <h3 className="text-body font-medium text-text-secondary">{FIELD_META[name]?.[lang] ?? name}</h3>
                    <Badge tone={confidence.tone} dot>
                      {confidence[lang]}
                    </Badge>
                  </div>
                  {field[lang] && (
                    <p dir="auto" className={`text-body text-text ${isAr ? "leading-[1.7]" : ""}`}>
                      {field[lang]}
                    </p>
                  )}
                  <Citations citations={field.citations} slug={brandSlug} />
                </li>
              );
            })}
          </ul>

          {analysis.notes.length > 0 && (
            <div className="flex flex-col gap-space-4">
              <h3 className="text-caption text-text-muted">{t("Notes", "ملاحظات")}</h3>
              {analysis.notes.map((note, i) => (
                <div key={i} className="flex flex-col gap-space-2">
                  <span className="text-body font-medium text-text-secondary">{NOTE_TARGET_META[note.target][lang]}</span>
                  <p dir="auto" className="text-body text-text">
                    {note[lang]}
                  </p>
                  <Citations citations={note.citations} slug={brandSlug} />
                </div>
              ))}
            </div>
          )}

          {analysis.followUps.length > 0 && (
            <div className="flex flex-col gap-space-3">
              <h3 className="text-caption text-text-muted">{t("Ask next", "اسأل بعد ذلك")}</h3>
              <ul className="flex flex-col gap-space-3">
                {analysis.followUps.map((f, i) => (
                  <li key={i} className="flex flex-col gap-space-2">
                    <p dir="auto" className="text-body text-text">
                      {f[lang]}
                    </p>
                    <Citations citations={f.citations} slug={brandSlug} />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {analysis.drafts > 0 && (
            <Button variant="link" href={`/w/${brandSlug}/drafts`}>
              <Icon name="inbox" size={16} />
              {t(`${analysis.drafts} proposals waiting in Drafts`, `${analysis.drafts} مقترحات بانتظارك في المسودات`)}
            </Button>
          )}
        </>
      )}
    </section>
  );
}
