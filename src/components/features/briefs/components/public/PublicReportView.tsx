"use client";

import { Drawer, EmptyState, ErrorState, Skeleton } from "@/components/ui";
import { formatDay } from "@/components/features/discovery";
import { SECTION_META } from "../../constants";
import { usePublicReport } from "../../hooks/public/usePublicReport";
import { CitationsProvider } from "../report/citations";
import { SectionBody } from "../report/sections/SectionBody";

/**
 * The client's read-only report at /a/<token>: the shared sections in the
 * analysis's language. A citation opens its quote from the client's own form.
 */
export function PublicReportView({ token }: { token: string }) {
  const { report, citation, open, close } = usePublicReport(token);
  const shared = report.data?.data;
  const isAr = shared?.language === "ar";
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const lang = isAr ? "ar" : "en";

  if (report.error) {
    return (
      <Shell>
        <ErrorState message={report.error} onRetry={report.reload} />
      </Shell>
    );
  }
  if (report.data?.gone) {
    return (
      <Shell>
        <EmptyState icon="unlink" title="This link isn't available any more." description="Ask the studio that sent it for a new one." />
      </Shell>
    );
  }
  if (!shared) {
    return (
      <Shell>
        <Skeleton className="h-10 w-72 rounded-lg" />
        <Skeleton className="h-64 w-full rounded-card" />
      </Shell>
    );
  }

  return (
    <div dir={isAr ? "rtl" : "ltr"} lang={lang}>
      <Shell>
        <header className="flex flex-col gap-space-2">
          <span className="text-overline uppercase text-text-faint">{t("Brief analysis", "تحليل الموجز")}</span>
          <h1 dir="auto" className="text-h1 font-medium">
            {shared.brand.name}
          </h1>
          {shared.finishedAt && <p className="text-caption text-text-muted">{formatDay(shared.finishedAt, isAr)}</p>}
        </header>
        <CitationsProvider value={{ index: shared.sourceIndex, open, isAr }}>
          {shared.sections.map((section) => (
            <section key={section.key} id={`section-${section.key}`} className="mk-surface flex flex-col gap-space-6 rounded-card bg-surface-1 p-space-8 print:break-inside-avoid-page">
              <h2 className="text-h3 font-medium">{SECTION_META[section.key][lang]}</h2>
              <SectionBody sectionKey={section.key} content={section.current} isAr={isAr} />
            </section>
          ))}
        </CitationsProvider>
        <footer className="pt-space-6 text-caption text-text-faint">{t("Shared from Markyos", "مُشارك من ماركيوس")}</footer>
      </Shell>
      <Drawer open={!!citation} title={t("From your form", "من نموذجك")} closeLabel={t("Close", "إغلاق")} onClose={close}>
        <blockquote dir="auto" className="text-body text-text">
          “{citation?.quote}”
        </blockquote>
        {citation && shared.sourceIndex[citation.sourceId] && (
          <p className="text-caption text-text-muted">{shared.sourceIndex[citation.sourceId].label}</p>
        )}
      </Drawer>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-5 bg-canvas px-space-6 py-space-10 text-text sm:px-space-10">{children}</main>;
}
