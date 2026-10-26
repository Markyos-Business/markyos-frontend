"use client";

import { useCallback, useState, type ReactNode } from "react";
import { Badge } from "@/components/ui";
import { SECTION_META } from "../constants";
import type { BriefAnalysis, Citation, Section } from "../types";
import { CitationPanel, CitationsProvider } from "./citations";
import { SectionCard, sectionTag } from "./SectionCard";
import type { ItemAction } from "./sections/SectionBody";

type ReportViewProps = {
  analysis: BriefAnalysis;
  slug: string;
  canEdit: boolean;
  isAr: boolean;
  onSection: (section: Section) => void;
  header: ReactNode;
  /** Edit and Add to Strategy for a section (the editing phase). */
  sectionActions?: (section: Section) => ReactNode;
  sectionBody?: (section: Section) => ReactNode | undefined;
  itemAction?: (section: Section) => ItemAction | undefined;
  onRerun?: () => void;
};

/** The 10-part report: a sticky nav of the sections, and the sections as cards. */
export function ReportView({ analysis, slug, canEdit, isAr, onSection, header, sectionActions, sectionBody, itemAction, onRerun }: ReportViewProps) {
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const lang = isAr ? "ar" : "en";
  const [citation, setCitation] = useState<Citation | null>(null);
  const open = useCallback((c: Citation) => setCitation(c), []);
  const close = useCallback(() => setCitation(null), []);

  return (
    <CitationsProvider value={{ index: analysis.sourceIndex, open, isAr }}>
      <div className="flex flex-col gap-5">
        {header}

        {analysis.stale && (
          <div role="status" className="flex flex-wrap items-center justify-between gap-space-4 rounded-lg bg-info-soft px-space-6 py-space-4 text-body text-info">
            {t("Sources changed since this analysis.", "تغيّرت المصادر منذ هذا التحليل.")}
            {onRerun && canEdit && (
              <button type="button" onClick={onRerun} className="mk-linkbtn font-medium underline-offset-4 hover:underline">
                {t("Run it again", "شغّله مجددًا")}
              </button>
            )}
          </div>
        )}
        {analysis.truncation.map((cut) => (
          <p key={cut.noteId} className="rounded-lg bg-warning-soft px-space-6 py-space-4 text-body text-warning">
            <span className="bidi-plain font-medium">{cut.title}</span>
            {t(
              `: ${cut.wordsSent.toLocaleString("en")} of ${cut.wordsTotal.toLocaleString("en")} words were read. The rest didn't fit.`,
              `: قُرئت ${cut.wordsSent.toLocaleString("en")} من ${cut.wordsTotal.toLocaleString("en")} كلمة، ولم يتّسع الباقي.`
            )}
          </p>
        ))}
        {analysis.status === "failed" && <p className="rounded-lg bg-danger-soft px-space-6 py-space-4 text-body text-danger">{analysis.error}</p>}

        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
          <nav aria-label={t("Sections", "الأقسام")} className="mk-surface flex flex-col rounded-card bg-surface-1 p-space-3 lg:sticky lg:top-0">
            {analysis.sections.map((section) => {
              const tag = sectionTag(section, isAr);
              return (
                <a
                  key={section.key}
                  href={`#section-${section.key}`}
                  className="flex min-h-10 items-center justify-between gap-space-3 rounded-md px-space-4 text-body text-text-muted hover:bg-surface-2 hover:text-text"
                >
                  <span>{SECTION_META[section.key][lang]}</span>
                  <Badge tone={tag.tone} dot>
                    {tag.label}
                  </Badge>
                </a>
              );
            })}
          </nav>
          <div className="flex min-w-0 flex-col gap-5">
            {analysis.sections.map((section) => (
              <SectionCard
                key={section.key}
                analysisId={analysis.id}
                section={section}
                canEdit={canEdit}
                isAr={isAr}
                onChange={onSection}
                actions={sectionActions?.(section)}
                body={sectionBody?.(section)}
                itemAction={itemAction?.(section)}
              />
            ))}
          </div>
        </div>
      </div>
      <CitationPanel citation={citation} source={citation ? analysis.sourceIndex[citation.sourceId] ?? null : null} slug={slug} onClose={close} isAr={isAr} />
    </CitationsProvider>
  );
}
