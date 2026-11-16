"use client";

import { useDashboardLocale } from "../shared/locale";
import { cx as clsx } from "../shared/styles";
import { CHART_BG, type ChartColor } from "../types";

export interface ChartLegendItem {
  label: string;
  color: ChartColor;
  /** Optional value after the label, e.g. "42%". */
  value?: string;
}

export interface ChartLegendProps {
  items: ChartLegendItem[];
  /** dot (default) or square swatch (better for hatched fills). */
  marker?: "dot" | "square";
  className?: string;
}

/** Dot + label legend. Labels use text tokens; only the marker carries the series colour. */
export default function ChartLegend({ items, marker = "dot", className }: ChartLegendProps) {
  const { t } = useDashboardLocale();
  return (
    <ul className={clsx("flex flex-wrap items-center gap-x-4 gap-y-2", className)} aria-label={t("Legend", "مفتاح الرسم")}>
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-2 text-caption text-text-muted">
          <span aria-hidden="true" className={clsx("shrink-0", marker === "dot" ? "h-2.5 w-2.5 rounded-full" : "h-3 w-3 rounded-sm", CHART_BG[item.color])} />
          {item.label}
          {item.value && <span className="tabular-nums font-medium text-text">{item.value}</span>}
        </li>
      ))}
    </ul>
  );
}
