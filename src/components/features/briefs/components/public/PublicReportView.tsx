"use client";

import { Button, Drawer, EmptyState, ErrorState, Icon, Skeleton } from "@/components/ui";
import { usePublicReport } from "../../hooks/public/usePublicReport";
import { ReportDocument } from "../shared/ReportDocument";

/**
 * The client's read-only report at /a/<token>: the shared sections in the
 * analysis's language. A citation opens its quote from the client's own form.
 */
export function PublicReportView({ token }: { token: string }) {
  const { report, citation, open, close } = usePublicReport(token);
  const shared = report.data?.data;
  const isAr = shared?.language === "ar";
  const t = (en: string, ar: string) => (isAr ? ar : en);

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
    <>
      <ReportDocument
        brandName={shared.brand.name}
        language={shared.language}
        finishedAt={shared.finishedAt}
        sections={shared.sections}
        sourceIndex={shared.sourceIndex}
        onCitation={open}
        toolbar={
          <Button variant="outline" size="sm" icon={<Icon name="file-export" size={16} />} onClick={() => window.print()}>
            {t("Print / PDF", "طباعة / PDF")}
          </Button>
        }
      />
      <Drawer open={!!citation} title={t("From your form", "من نموذجك")} closeLabel={t("Close", "إغلاق")} onClose={close}>
        <blockquote dir="auto" className="text-body text-text">
          “{citation?.quote}”
        </blockquote>
        {citation && shared.sourceIndex[citation.sourceId] && (
          <p className="text-caption text-text-muted">{shared.sourceIndex[citation.sourceId].label}</p>
        )}
      </Drawer>
    </>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-5 bg-canvas px-space-6 py-space-10 text-text sm:px-space-10">{children}</main>;
}
