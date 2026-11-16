"use client";

import { percent } from "../shared/numbers";
import type { ReactNode } from "react";
import { cx as clsx } from "../shared/styles";
import WidgetStateView, { resolveWidgetState } from "../shared/widget-state-view";
import { CHART_STROKE, type ChartColor, type WidgetStateProps } from "../types";

export interface GaugeSegment {
  label: string;
  /** Percentage of the whole (segments should sum to ≤ 100). */
  value: number;
  color: Exclude<ChartColor, "hatch">;
}

export interface GaugeChartProps extends WidgetStateProps {
  /** One value (0–100) on a track, or segments (stacked around the arc). */
  value?: number;
  segments?: GaugeSegment[];
  /** Big centre text. Default the value as a percentage. */
  centerLabel?: ReactNode;
  /** Small line under it, e.g. "brands ready for review". */
  centerCaption?: ReactNode;
  /** Accessible summary, e.g. "Placement rate". */
  label: string;
  className?: string;
}

const GAP = 1; // surface gap between segments, in pathLength units (of 100)

/** Pure: dash pattern + offset per segment along a 0–100 arc, with a gap between neighbours. */
export function gaugeDashes(segments: { value: number }[]): { dash: string; offset: number }[] {
  let start = 0;
  return segments.map((s, i) => {
    const value = Math.min(100 - start, percent(s.value));
    const len = Math.max(0, value - (i < segments.length - 1 && value > GAP ? GAP : 0));
    const out = { dash: `${len} ${100 - len}`, offset: -start };
    start += value;
    return out;
  });
}

const ARC = "M 8 50 A 42 42 0 0 1 92 50";

/**
 * Half-donut gauge for a percentage or a split (placed / in progress / lost),
 * with a centre label. Fills from the start side (mirrored in RTL).
 */
export default function GaugeChart({ value, segments, centerLabel, centerCaption, label, state, emptyMessage, errorMessage, onRetry, className }: GaugeChartProps) {
  const raw: GaugeSegment[] = segments ?? (typeof value === "number" ? [{ label, value, color: "cat-1" }] : []);
  const segs = raw.map((s, i) => ({
    ...s, value: Math.min(percent(s.value), Math.max(0, 100 - raw.slice(0, i).reduce((sum, segment) => sum + percent(segment.value), 0))),
  }));
  const resolved = resolveWidgetState(state, segs.length > 0);
  if (resolved !== "ready") return <WidgetStateView state={resolved} skeleton="stat" emptyMessage={emptyMessage} errorMessage={errorMessage} onRetry={onRetry} className={className} />;
  const dashes = gaugeDashes(segs);
  const summary = segments ? `${label}: ${segs.map((s) => `${s.label} ${s.value}%`).join(", ")}` : `${label}: ${segs[0].value}%`;
  return (
    <div className={clsx("relative mx-auto w-full max-w-72", className)}>
      <svg role="img" aria-label={summary} viewBox="0 0 100 54" className="w-full overflow-visible rtl:-scale-x-100">
        <path d={ARC} fill="none" strokeWidth={10} strokeLinecap="round" pathLength={100} className="stroke-ink-soft" />
        {segs.map((s, i) => (
          <path key={s.label} d={ARC} fill="none" strokeWidth={10} strokeLinecap={segs.length === 1 ? "round" : "butt"} pathLength={100} strokeDasharray={dashes[i].dash} strokeDashoffset={dashes[i].offset} className={clsx(CHART_STROKE[s.color], "transition-[stroke-dasharray] duration-slow ease-out motion-reduce:transition-none")} />
        ))}
      </svg>
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 text-center">
        <p className="tabular-nums text-h2 text-text">{centerLabel ?? `${segs[0].value}%`}</p>
        {centerCaption && <p className="text-caption text-text-muted">{centerCaption}</p>}
      </div>
    </div>
  );
}
