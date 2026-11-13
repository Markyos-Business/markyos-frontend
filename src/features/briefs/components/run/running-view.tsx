"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui";
import { STAGE_META } from "../../constants";
import type { BriefAnalysis } from "../../types";

const elapsed = (from: string | null, now: number) => {
  if (!from) return "0:00";
  const s = Math.max(0, Math.round((now - Date.parse(from)) / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

/** A run in progress: the five stages, checked off as they finish. */
export function RunningView({ analysis, isAr }: { analysis: BriefAnalysis; isAr: boolean }) {
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const done = analysis.progress.filter((s) => s.status === "done" || s.status === "failed").length;
  const share = analysis.progress.length ? done / analysis.progress.length : 0;

  return (
    <section aria-live="polite" className="mk-surface mx-auto flex w-full max-w-160 flex-col gap-space-6 rounded-card bg-surface-1 p-space-10">
      <div className="flex items-center justify-between gap-space-4">
        <h2 className="text-h4 font-medium">{t("Analysing the brief", "تحليل الموجز")}</h2>
        <span className="tabular-nums text-caption text-text-muted">{elapsed(analysis.startedAt ?? analysis.createdAt, now)}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-ink-soft">
        <span className="block h-full origin-left rounded-full bg-accent transition-transform duration-base ease-standard rtl:origin-right" style={{ transform: `scaleX(${share})` }} />
      </div>
      <ol className="flex flex-col gap-space-4">
        {analysis.progress.map((stage) => (
          <li key={stage.key} className="flex items-start gap-space-4">
            <span
              className={`grid size-6 shrink-0 place-items-center rounded-full ${
                stage.status === "done" ? "bg-success-soft text-success" : stage.status === "failed" ? "bg-danger-soft text-danger" : stage.status === "running" ? "bg-accent-soft text-accent-on-soft" : "bg-surface-2 text-text-muted"
              }`}
            >
              <Icon name={stage.status === "done" ? "check" : stage.status === "failed" ? "times" : stage.status === "running" ? "history" : "clock"} size={16} />
            </span>
            <span className="flex flex-col">
              <span className={`text-body ${stage.status === "waiting" ? "text-text-muted" : "text-text"}`}>{STAGE_META[stage.key][isAr ? "ar" : "en"]}</span>
              {stage.status === "running" && stage.detail && <span className="text-caption text-text-muted">{stage.detail}</span>}
            </span>
          </li>
        ))}
      </ol>
      <p className="text-caption text-text-muted">
        {t("You can leave this page. The analysis keeps running and will be here when you come back.", "يمكنك مغادرة هذه الصفحة. يستمر التحليل وسيكون هنا عند عودتك.")}
      </p>
    </section>
  );
}
