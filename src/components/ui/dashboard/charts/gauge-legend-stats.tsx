"use client";

import { cx as clsx } from "../shared/styles";
import { CHART_BG, type ChartColor } from "../types";

export interface GaugeLegendStat {
  label: string;
  /** Percentage (0–100). */
  value: number;
  color: ChartColor;
}

export interface GaugeLegendStatsProps {
  items: GaugeLegendStat[];
  className?: string;
}

/** Row of percentage + label pairs under a gauge; the dot ties each to its segment. */
export default function GaugeLegendStats({ items, className }: GaugeLegendStatsProps) {
  return (
    <dl className={clsx("grid gap-3", items.length >= 3 ? "grid-cols-3" : "grid-cols-2", className)}>
      {items.map((item) => (
        <div key={item.label} className="min-w-0">
          <dt className="flex items-center gap-1.5 truncate text-caption text-text-muted">
            <span aria-hidden="true" className={clsx("h-2 w-2 shrink-0 rounded-full", CHART_BG[item.color])} />
            {item.label}
          </dt>
          <dd className="tabular-nums mt-0.5 text-title-sm text-text">{item.value}%</dd>
        </div>
      ))}
    </dl>
  );
}
