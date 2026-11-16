"use client";

import { cx as clsx } from "../shared/styles";
import type { CSSProperties } from "react";

import { focusRing } from "../shared/styles";
import type { TagTone } from "../../badge/variants";
import type { ChartColor } from "../types";
import { safeCount } from "../shared/numbers";
import { useDashboardLocale } from "../shared/locale";
import { Tag } from "../../badge/tag";

export interface PipelineFlowStage {
  /** Your id for the stage, returned by onSelect. */
  id: string;
  label: string;
  count: number;
  /** Stage tag id in the calling feature; the calling feature supplies the chart colour. */
  color?: Exclude<ChartColor, "hatch">;
  /** Short call-out above the station, e.g. { label: "Your move", tone: "attention" }. */
  badge?: { label: string; tone: TagTone };
  /** Pulses the station: something here is waiting on the viewer. */
  attention?: boolean;
}

export interface PipelineFlowProps {
  stages: PipelineFlowStage[];
  /** Makes each station a toggle button, e.g. to filter a table by stage. */
  onSelect?: (id: string | null) => void;
  selectedId?: string | null;
  /** Accessible name for the group. */
  label?: string;
  className?: string;
}

const stageColor = (color?: Exclude<ChartColor, "hatch">) => ({
  "cat-1": "var(--accent)", "cat-2": "var(--indigo)", "cat-3": "var(--info)", muted: "var(--text-muted)",
})[color ?? "cat-1"];

// Station diameter grows with the stage's share: 44px (tap target) to 64px.
const MIN = 44;
const MAX = 64;

/**
 * Brand workflow stages as a journey line. Each stage is a
 * station whose size follows its volume; the track between stations takes the
 * stage colour from the calling feature and drifts toward the end.
 * With onSelect, pressing a station filters and pressing it again clears.
 */
export default function PipelineFlow({ stages: inputStages, onSelect, selectedId = null, label, className }: PipelineFlowProps) {
  const { t } = useDashboardLocale();
  label ??= t("Brands by stage", "العلامات حسب المرحلة");
  const stages = inputStages.map(s => ({ ...s, count: safeCount(s.count) }));
  const total = stages.reduce((sum, s) => sum + s.count, 0);
  const peak = Math.max(1, ...stages.map((s) => s.count));

  return (
    <div role="region" aria-label={label} tabIndex={0} className={clsx("-mx-1 overflow-x-auto rounded-lg px-1 pb-1", focusRing, className)}>
      <ol aria-label={label} className="grid" style={{ minWidth: `${inputStages.length * 5}rem`, gridTemplateColumns: `repeat(${Math.max(1, stages.length)}, minmax(0, 1fr))` }}>
        {stages.map((s, i) => {
          const color = stageColor(s.color);
          const prev = i > 0 ? stageColor(stages[i - 1].color) : null;
          const share = total > 0 ? Math.round((s.count / total) * 100) : 0;
          const size = Math.round(MIN + (MAX - MIN) * (s.count / peak));
          const selected = selectedId === s.id;
          const empty = s.count === 0;

          const nodeStyle: CSSProperties = {
            width: size,
            height: size,
            borderColor: color,
            boxShadow: selected ? `0 0 0 4px var(--surface-1), 0 0 0 7px ${color}` : undefined,
          };
          const node = (
            <>
              {s.attention && (
                <span aria-hidden="true" className="absolute -end-0.5 -top-0.5 flex h-3 w-3">
                  <span className="absolute inset-0 rounded-full motion-safe:animate-ping" style={{ background: color, opacity: 0.6 }} />
                  <span className="relative h-3 w-3 rounded-full border-2 border-surface-1" style={{ background: color }} />
                </span>
              )}
              <span className={clsx("tabular-nums text-body font-medium font-semibold", empty ? "text-text-muted" : "text-text")}>{s.count}</span>
            </>
          );
          const nodeClass = clsx(
            "relative z-10 flex items-center justify-center rounded-full border-[3px] bg-surface-1 transition-[box-shadow,transform] duration-base motion-reduce:transition-none",
            empty && "border-dashed",
          );

          return (
            <li key={s.id} className="flex min-w-0 flex-col items-center text-center">
              <span className="flex h-7 items-end pb-1.5">
                {s.badge && (
                  <Tag tone={s.badge.tone} size="sm">
                    {s.badge.label}
                  </Tag>
                )}
              </span>

              <span className="relative flex w-full items-center justify-center" style={{ height: MAX + 8 }}>
                {prev && (
                  <span aria-hidden="true" className="absolute start-0 top-1/2 h-1.5 w-1/2 -translate-y-1/2 overflow-hidden" style={{ background: prev }}>
                    <span className="absolute inset-0" />
                  </span>
                )}
                {i < stages.length - 1 && (
                  <span aria-hidden="true" className="absolute end-0 top-1/2 h-1.5 w-1/2 -translate-y-1/2 overflow-hidden" style={{ background: color }}>
                    <span className="absolute inset-0" />
                  </span>
                )}
                {onSelect ? (
                  <button
                    type="button"
                    aria-pressed={selected}
                    aria-label={`${s.label}: ${s.count} (${share}%)${s.badge ? `, ${s.badge.label}` : ""}`}
                    onClick={() => onSelect(selected ? null : s.id)}
                    className={clsx(nodeClass, "hover:scale-105 motion-reduce:hover:scale-100", focusRing)}
                    style={nodeStyle}
                  >
                    {node}
                  </button>
                ) : (
                  <span className={nodeClass} style={nodeStyle}>
                    {node}
                  </span>
                )}
              </span>

              <span className={clsx("mt-2 line-clamp-2 px-1 text-caption font-medium", selected ? "text-text" : "text-text-muted")}>{s.label}</span>
              <span className="tabular-nums mt-0.5 text-caption text-text-muted">{share}%</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
