"use client";

import { useEffect, useRef, useState } from "react";
import { AlertBanner, Badge, Button, EmptyState, Icon, PageHeader, Skeleton, useDialog, useToast } from "@/components/ui";
import { SelectField } from "@/components/form";
import { formatDay } from "@/components/features/discovery";
import { useBriefAnalysis } from "../hooks/useBriefAnalysis";
import { useBriefOverview } from "../hooks/useBriefOverview";
import { startAnalysis } from "../services/briefsService";
import { costLine, withCostConfirm } from "../utils/cost";
import { ReportView } from "./ReportView";
import { RunningView } from "./RunningView";
import { RunPanel } from "./RunPanel";

type AnalysisViewProps = { brandId: string; brandSlug: string; isAr: boolean };

/**
 * A brand's Analysis tab: run the first analysis, watch it run, and read the
 * report, version by version.
 */
export function AnalysisView({ brandId, brandSlug, isAr }: AnalysisViewProps) {
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const overview = useBriefOverview(brandId);
  const { confirm } = useDialog();
  const { showToast } = useToast();
  const [chosen, setChosen] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const versions = overview.data?.versions ?? [];
  const selectedId = chosen ?? versions[0]?.id ?? null;
  const { analysis, error, replaceSection } = useBriefAnalysis(selectedId);
  const running = !!analysis && (analysis.status === "queued" || analysis.status === "running");

  // Finished while open: say so, and refresh the versions.
  const wasRunning = useRef(false);
  useEffect(() => {
    if (wasRunning.current && analysis && !running) {
      showToast(analysis.status === "ready" ? t("The analysis is ready", "التحليل جاهز") : t("The analysis didn't finish", "لم يكتمل التحليل"), analysis.status === "ready" ? "success" : "danger");
      overview.reload();
    }
    wasRunning.current = running;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when the run's state changes
  }, [running, analysis?.status]);

  const run = async (language: "en" | "ar") => {
    setStarting(true);
    try {
      const started = await withCostConfirm(
        (confirmCost) => startAnalysis(brandId, language, confirmCost),
        (quote) =>
          confirm({
            title: t("Run a new analysis?", "تشغيل تحليل جديد؟"),
            body: costLine(quote, isAr),
            confirmLabel: t("Run analysis", "تشغيل التحليل"),
            isAr,
          })
      );
      if (started) {
        setChosen(started.id);
        overview.reload();
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : t("That didn't start.", "لم يبدأ ذلك."), "danger");
    }
    setStarting(false);
  };

  const data = overview.data;
  const header = analysis && data && (
    <div className="flex flex-wrap items-end justify-between gap-space-5">
      <div className="flex flex-wrap items-end gap-space-4">
        <div className="w-52">
          <SelectField
            label={t("Version", "الإصدار")}
            value={analysis.id}
            onChange={(e) => setChosen(e.target.value)}
            options={versions.map((v) => ({
              value: v.id,
              label: `${t("Version", "الإصدار")} ${v.version} · ${formatDay(v.createdAt, isAr)}`,
            }))}
          />
        </div>
        <Badge>{analysis.language === "ar" ? "العربية" : "English"}</Badge>
        {analysis.isFreeRun && <Badge tone="success">{t("Free run", "تشغيل مجاني")}</Badge>}
      </div>
      {data.canEdit && data.configured && (
        <Button variant="outline" onClick={() => void run(analysis.language)} disabled={starting || running} icon={<Icon name="history" size={18} />}>
          {t("Run again", "تشغيل مجددًا")}
        </Button>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={t("Analysis", "التحليل")}
        description={t(
          "A strategist's read of the brief: where the client contradicts itself, what's missing, and routes to take.",
          "قراءة استراتيجية للموجز: أين يناقض العميل نفسه، وما الذي ينقص، والمسارات الممكنة."
        )}
      />
      <AlertBanner message={overview.error ?? error} />
      {!data ? (
        overview.error ? (
          <EmptyState icon="exclamation-circle" title={t("Couldn't load the analysis", "تعذّر تحميل التحليل")} description={overview.error} />
        ) : (
          <Skeleton className="h-64 w-full rounded-card" />
        )
      ) : versions.length === 0 ? (
        <RunPanel overview={data} isAr={isAr} running={starting} onRun={(language) => void run(language)} />
      ) : !analysis ? (
        <Skeleton className="h-64 w-full rounded-card" />
      ) : running ? (
        <RunningView analysis={analysis} isAr={isAr} />
      ) : (
        <ReportView
          analysis={analysis}
          slug={brandSlug}
          canEdit={data.canEdit}
          isAr={isAr}
          onSection={replaceSection}
          header={header}
          onRerun={() => void run(analysis.language)}
        />
      )}
    </div>
  );
}
