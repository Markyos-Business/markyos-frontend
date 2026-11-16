"use client";
import { CHART_BG, type ChartColor } from "../types";
import { safeCount } from "../shared/numbers";
export interface PipelineBarProps {
  stages: { id: string; label: string; count: number; color?: ChartColor }[];
  label: string;
  className?: string;
}
/** Proportional segments with a text summary, independent of feature stage maps. */
export default function PipelineBar({ stages, label, className }: PipelineBarProps) {
  const total = stages.reduce((sum, s) => sum + safeCount(s.count), 0);
  return <div className={className}>
    <div role="img" aria-label={`${label}: ${stages.map(s => `${s.label} ${safeCount(s.count)}`).join(", ")}`} className="flex h-3 overflow-hidden rounded-widget bg-ink-soft">
      {total > 0 && stages.map(s => <span key={s.id} className={CHART_BG[s.color ?? "cat-1"]} style={{ width: `${safeCount(s.count) / total * 100}%` }} />)}
    </div>
  </div>;
}
