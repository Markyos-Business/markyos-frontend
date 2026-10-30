"use client";

import { Button, ErrorState, Icon, Skeleton } from "@/components/ui";
import { usePrintReport } from "../../hooks/print/usePrintReport";
import { ReportDocument } from "../shared/ReportDocument";

/** /print/analysis/[id]: the whole report as a light document, ready for "Save as PDF". */
export function PrintReportView({ id }: { id: string }) {
  const { analysis, brandName, sections, open } = usePrintReport(id);
  const data = analysis.data;
  const isAr = data?.language === "ar";
  const t = (en: string, ar: string) => (isAr ? ar : en);

  if (analysis.error) {
    return (
      <main className="mx-auto max-w-4xl p-space-10">
        <ErrorState message={analysis.error} onRetry={analysis.reload} />
      </main>
    );
  }
  if (!data) {
    return (
      <main className="mx-auto flex max-w-4xl flex-col gap-5 p-space-10" aria-busy="true">
        <Skeleton className="h-10 w-72 rounded-lg" />
        <Skeleton className="h-96 w-full rounded-card" />
      </main>
    );
  }
  return (
    <ReportDocument
      brandName={brandName}
      language={data.language}
      finishedAt={data.finishedAt}
      sections={sections}
      sourceIndex={data.sourceIndex}
      onCitation={open}
      toolbar={
        <Button variant="outline" size="sm" icon={<Icon name="file-export" size={16} />} onClick={() => window.print()}>
          {t("Print / save as PDF", "طباعة / حفظ PDF")}
        </Button>
      }
    />
  );
}
