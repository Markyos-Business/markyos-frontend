"use client";

import type { ReactNode } from "react";
import { formatDay } from "@/components/features/discovery";
import { SECTION_META } from "../../constants";
import type { Citation, SectionKey, SourceRef } from "../../types";
import { CitationsProvider } from "../report/citations";
import { SectionBody } from "../report/sections/SectionBody";

type ReportDocumentProps = {
  brandName: string;
  language: "en" | "ar";
  finishedAt: string | null;
  sections: { key: SectionKey; current: unknown }[];
  sourceIndex: Record<string, SourceRef>;
  onCitation: (c: Citation) => void;
  /** Above the title, hidden in print: e.g. a Print button. */
  toolbar?: ReactNode;
};

/**
 * The report as one document: title, then each section in full. What the
 * client reads at a share link, and what the print view turns into a PDF —
 * light, one section after another, nothing interactive in the way.
 */
export function ReportDocument({ brandName, language, finishedAt, sections, sourceIndex, onCitation, toolbar }: ReportDocumentProps) {
  const isAr = language === "ar";
  const t = (en: string, ar: string) => (isAr ? ar : en);
  return (
    <main dir={isAr ? "rtl" : "ltr"} lang={language} className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-5 bg-canvas px-space-6 py-space-10 text-text sm:px-space-10 print:max-w-none print:p-space-4">
      {toolbar && <div className="flex justify-end print:hidden">{toolbar}</div>}
      <header className="flex flex-col gap-space-2">
        <span className="text-overline uppercase text-text-faint">{t("Brief analysis", "تحليل الموجز")}</span>
        {/* The name keeps its own direction; the heading keeps the page's alignment. */}
        <h1 className="text-h1 font-medium">
          <span dir="auto">{brandName}</span>
        </h1>
        {finishedAt && <p className="text-caption text-text-muted">{formatDay(finishedAt, isAr)}</p>}
      </header>
      <CitationsProvider value={{ index: sourceIndex, open: onCitation, isAr }}>
        {sections.map((section) => (
          <section
            key={section.key}
            id={`section-${section.key}`}
            className="mk-surface flex flex-col gap-space-6 rounded-card bg-surface-1 p-space-8 print:break-inside-avoid-page print:shadow-none"
          >
            <h2 className="text-h3 font-medium">{SECTION_META[section.key][language]}</h2>
            <SectionBody sectionKey={section.key} content={section.current} isAr={isAr} />
          </section>
        ))}
      </CitationsProvider>
      <footer className="pt-space-6 text-caption text-text-faint">{t("Made with Markyos", "صُنع باستخدام ماركيوس")}</footer>
    </main>
  );
}
