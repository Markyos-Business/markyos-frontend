"use client";

import { useDashboardLocale } from "../shared/locale";
import type { ReactNode } from "react";
import { cx as clsx } from "../shared/styles";

import MetricDelta from "../shared/metric-delta";
import WidgetStateView, { resolveWidgetState } from "../shared/widget-state-view";
import type { WidgetStateProps } from "../types";

export interface BreakdownRow {
  key: string;
  /** First column, e.g. an account type or brand stage. */
  label: ReactNode;
  /** Second line under the label. */
  meta?: ReactNode;
  /** Main figure: Amount or Numeral. */
  value: ReactNode;
  /** Change in percent → growth pill. */
  growth?: number;
  /** Whether a rise is good. Default "up". */
  goodWhen?: "up" | "down";
}

export interface BreakdownTableProps extends WidgetStateProps {
  rows: BreakdownRow[];
  caption: string;
  labelHeader?: string;
  valueHeader?: string;
  growthHeader?: string;
  /** Defaults to showing growth only when at least one row supplies it. */
  showGrowth?: boolean;
  /** Period for growth, read by screen readers: "vs last month". */
  comparedTo?: string;
  className?: string;
}

/** Compact breakdown (44px rows): label, right-aligned tabular value, growth pill. */
export default function BreakdownTable({ rows, caption, labelHeader, valueHeader, growthHeader, showGrowth = rows.some(row => typeof row.growth === "number"), comparedTo, state, emptyMessage, errorMessage, onRetry, className }: BreakdownTableProps) {
  const { t } = useDashboardLocale();
  const resolved = resolveWidgetState(state, rows.length > 0);
  if (resolved !== "ready") return <WidgetStateView state={resolved} skeleton="list" emptyMessage={emptyMessage} errorMessage={errorMessage} onRetry={onRetry} className={className} />;
  return (
    <div className={clsx("min-w-0", className)}>
      <div className="overflow-x-auto rounded-widget border border-hairline">
        <table className={clsx("w-full text-start text-caption", showGrowth ? "min-w-80 table-fixed" : "table-auto")}>
          <caption className="sr-only">{caption}</caption>
          <thead className="bg-surface-2 text-text-muted">
            <tr>
              <th scope="col" className={clsx("h-11 px-3 text-start font-medium", showGrowth && "w-1/2")}>{labelHeader ?? t("Name", "الاسم")}</th>
              <th scope="col" className="h-11 px-3 text-end font-medium">{valueHeader ?? t("Total", "الإجمالي")}</th>
              {showGrowth && <th scope="col" className="h-11 px-3 text-end font-medium">{growthHeader ?? t("Growth", "النمو")}</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key} className="border-t border-hairline">
                <th scope="row" className="h-11 px-3 text-start font-normal">
                  <span className="block break-words text-caption font-medium text-text">{r.label}</span>
                  {r.meta && <span className="block truncate text-caption text-text-muted">{r.meta}</span>}
                </th>
                <td className="tabular-nums h-11 px-3 text-end text-text">{r.value}</td>
                {showGrowth && <td className="h-11 px-3 text-end">{typeof r.growth === "number" ? <MetricDelta value={r.growth} goodWhen={r.goodWhen} comparedTo={comparedTo} /> : <span className="text-text-muted">—</span>}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
