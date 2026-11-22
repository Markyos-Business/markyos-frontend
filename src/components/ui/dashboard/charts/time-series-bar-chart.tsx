"use client";

import { useDashboardLocale } from "../shared/locale";
import { safeCount } from "../shared/numbers";
import { useState } from "react";
import { cx as clsx } from "../shared/styles";
import WidgetStateView, { resolveWidgetState } from "../shared/widget-state-view";
import { compactNumber, type WidgetStateProps } from "../types";

export interface TimeSeriesBarDatum {
  label: string;
  value: number;
  /** pending / forecast bars are hatched instead of filled. */
  status?: "actual" | "pending";
}

export interface TimeSeriesBarChartProps extends WidgetStateProps {
  data: TimeSeriesBarDatum[];
  /** Index of the bar to highlight (accent + value bubble). Default: the last actual bar. */
  highlightIndex?: number;
  /** Tooltip / bubble text. Default compact number. */
  formatValue?: (value: number) => string;
  /** Noun for screen readers: "accounts". */
  unit?: string;
  /** Accessible name for the chart. */
  label: string;
  /** Plot height class. Default "h-44". */
  heightClass?: string;
  className?: string;
}

/** Pure: default highlight = last bar that isn't pending (or the last bar). */
export function defaultHighlight(data: TimeSeriesBarDatum[]): number {
  for (let i = data.length - 1; i >= 0; i--) if (data[i].status !== "pending") return i;
  return data.length - 1;
}

/**
 * Rounded bars on one baseline (≤24px wide, 2px gaps). The current bar is the
 * accent with a value bubble; others are muted; pending/forecast bars are
 * hatched. Hover or focus any bar for its value.
 */
export default function TimeSeriesBarChart({ data: inputData, highlightIndex, formatValue = compactNumber, unit = "", label, heightClass = "h-44", state, emptyMessage, errorMessage, onRetry, className }: TimeSeriesBarChartProps) {
  const { t } = useDashboardLocale();
  const data = inputData.map(d => ({ ...d, value: safeCount(d.value) }));
  const [hover, setHover] = useState<number | null>(null);
  const resolved = resolveWidgetState(state, data.length > 0);
  if (resolved !== "ready") return <WidgetStateView state={resolved} skeleton="chart" emptyMessage={emptyMessage} errorMessage={errorMessage} onRetry={onRetry} className={className} />;

  const max = Math.max(1, ...data.map((d) => d.value));
  const hi = highlightIndex ?? defaultHighlight(data);
  return (
    <div dir="ltr" className={className}>
      <ul aria-label={label} className={clsx("flex items-end gap-2", heightClass)}>
        {data.map((d, i) => {
          const active = i === hi;
          const show = hover === i || (hover === null && active);
          const text = `${formatValue(d.value)}${unit ? ` ${unit}` : ""}`;
          return (
            <li
              key={`${d.label}-${i}`}
              tabIndex={0}
              aria-label={`${d.label}: ${text}${d.status === "pending" ? t(" (pending)", " (قيد الانتظار)") : ""}`}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              className="group relative flex h-full flex-1 cursor-default flex-col items-center justify-end rounded-widget outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              {show && (
                <span aria-hidden="true" className="tabular-nums absolute z-10 -translate-y-full whitespace-nowrap rounded-lg bg-solid px-2 py-0.5 text-caption font-medium text-solid-ink" style={{ bottom: `${(d.value / max) * 100}%`, ...(i === 0 ? { insetInlineStart: 0 } : i === data.length - 1 ? { insetInlineEnd: 0 } : {}) }}>
                  {text}
                </span>
              )}
              <span
                aria-hidden="true"
                className={clsx(
                  "w-full max-w-6 rounded-full transition-[height,background-color] duration-slow ease-out motion-reduce:transition-none",
                  d.status === "pending" ? "bg-accent-soft border border-dashed border-accent-edge" : active ? "bg-accent" : hover === i ? "bg-accent-soft" : "bg-ink-soft",
                )}
                style={{ height: `${d.value === 0 ? 0 : Math.max(6, (d.value / max) * 100)}%` }}
              />
            </li>
          );
        })}
      </ul>
      <div aria-hidden="true" className="mt-2 flex gap-2">
        {data.map((d, i) => (
          <span key={`${d.label}-${i}`} className={clsx("min-w-0 flex-1 break-words text-center text-caption", i === hi ? "font-medium text-text" : "text-text-muted")}>
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}
