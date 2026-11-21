"use client";

import { useDashboardLocale } from "../shared/locale";
import { safeCount } from "../shared/numbers";
import { cx as clsx } from "../shared/styles";

export interface SparklineProps {
  values: number[];
  /** line (default) or mini bars. */
  variant?: "line" | "bars";
  /** Accessible summary, e.g. "Applications, last 12 weeks". The first, last and peak values are appended. */
  label: string;
  /** On a brand-filled card. */
  onBrand?: boolean;
  /** Size via className (e.g. "h-10 w-32"). */
  className?: string;
}

/** Pure: SVG polyline points in a 100×32 box (y inverted, 2px padding for the stroke). */
export function sparkPoints(values: number[], w = 100, h = 32): string {
  values = values.map(safeCount);
  if (!values.length) return "";
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  const step = values.length > 1 ? w / (values.length - 1) : 0;
  return values.map((v, i) => `${+(i * step).toFixed(2)},${+(h - 2 - ((v - min) / span) * (h - 4)).toFixed(2)}`).join(" ");
}

/**
 * Tiny trend: a 2px line with an end dot, or mini bars with the latest in the
 * accent and the rest muted. Decorative detail is aria-hidden; the summary is the label.
 */
export default function Sparkline({ values: inputValues, variant = "line", label, onBrand = false, className }: SparklineProps) {
  const { t } = useDashboardLocale();
  const values = inputValues.map(safeCount);
  const summary = values.length ? t(`${label}: from ${values[0]} to ${values[values.length - 1]}, peak ${Math.max(...values)}`, `${label}: من ${values[0]} إلى ${values[values.length - 1]}، الأعلى ${Math.max(...values)}`) : t(`${label}: no data`, `${label}: لا توجد بيانات`);
  if (variant === "bars") {
    const max = Math.max(1, ...values);
    return (
      <div dir="ltr" role="img" aria-label={summary} className={clsx("flex items-end gap-0.5", className)}>
        {values.map((v, i) => (
          <span
            key={i}
            className={clsx("min-h-1 flex-1 rounded-t-sm", i === values.length - 1 ? (onBrand ? "bg-accent-ink" : "bg-accent") : onBrand ? "bg-accent-deep" : "bg-ink-soft")}
            style={{ height: `${Math.max(8, (v / max) * 100)}%` }}
          />
        ))}
      </div>
    );
  }
  const pts = sparkPoints(values);
  const last = pts ? pts.split(" ").pop()?.split(",").map(Number) : undefined;
  return (
    <svg role="img" aria-label={summary} viewBox="0 0 100 32" preserveAspectRatio="none" className={clsx("overflow-visible", className)}>
      <polyline points={pts} fill="none" vectorEffect="non-scaling-stroke" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={onBrand ? "stroke-accent-ink" : "stroke-accent"} />
      {last && <circle cx={last[0]} cy={last[1]} r={3} vectorEffect="non-scaling-stroke" strokeWidth={2} className={onBrand ? "fill-accent-ink stroke-accent" : "fill-accent stroke-surface-1"} />}
    </svg>
  );
}
