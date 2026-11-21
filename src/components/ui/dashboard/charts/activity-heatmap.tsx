"use client";

import { safeCount } from "../shared/numbers";
import { useDashboardLocale } from "../shared/locale";
import { useRef, useState, type KeyboardEvent } from "react";
import { cx as clsx } from "../shared/styles";
import WidgetStateView, { resolveWidgetState } from "../shared/widget-state-view";
import type { WidgetStateProps } from "../types";

export interface ActivityHeatmapProps extends WidgetStateProps {
  /** Row labels, e.g. Mon–Sun. */
  rows: string[];
  /** Column labels, e.g. 9am–6pm. */
  columns: string[];
  /** values[row][column]. */
  values: number[][];
  /** Noun for tooltips: "uploads". */
  unit?: string;
  label: string;
  className?: string;
}

const LEVELS = ["bg-surface-2", "bg-accent-soft", "bg-accent-edge", "bg-accent", "bg-accent-deep"];

/** Pure: 0 → level 0; otherwise 1–4 in equal steps of the max. */
export function heatLevel(value: number, max: number): number {
  if (value <= 0 || max <= 0) return 0;
  return Math.min(4, Math.max(1, Math.ceil((value / max) * 4)));
}

/**
 * Day × hour grid in one blue ramp (light → dark = less → more; its own dark
 * steps in dark mode). Each cell has a tooltip and a screen-reader label;
 * a Less–More key explains the scale.
 */
export default function ActivityHeatmap({ rows, columns, values: inputValues, unit = "", label, state, emptyMessage, errorMessage, onRetry, className }: ActivityHeatmapProps) {
  const { t } = useDashboardLocale();
  const values = rows.map((_, ri) => columns.map((_, ci) => safeCount(inputValues[ri]?.[ci] ?? 0)));
  const [hover, setHover] = useState<string | null>(null);
  // Roving focus: the grid is one Tab stop; arrow keys move between cells (mirrored in RTL).
  const [active, setActive] = useState<[number, number]>([0, 0]);
  const cells = useRef<Record<string, HTMLSpanElement | null>>({});
  const onKey = (e: KeyboardEvent<HTMLSpanElement>, ri: number, ci: number) => {
    const rtl = getComputedStyle(e.currentTarget).direction === "rtl";
    const moves: Record<string, [number, number]> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, rtl ? 1 : -1], ArrowRight: [0, rtl ? -1 : 1], Home: [0, -ci], End: [0, columns.length - 1 - ci] };
    const m = moves[e.key];
    if (!m) return;
    e.preventDefault();
    const next: [number, number] = [Math.min(rows.length - 1, Math.max(0, ri + m[0])), Math.min(columns.length - 1, Math.max(0, ci + m[1]))];
    setActive(next);
    cells.current[`${next[0]}-${next[1]}`]?.focus();
  };
  const flat = values.flat();
  const resolved = resolveWidgetState(state, rows.length > 0 && columns.length > 0 && flat.some((v) => v > 0));
  if (resolved !== "ready") return <WidgetStateView state={resolved} skeleton="chart" emptyMessage={emptyMessage} errorMessage={errorMessage} onRetry={onRetry} className={className} />;
  const max = Math.max(...flat);
  return (
    <div className={clsx("min-w-0", className)}>
      <div role="grid" aria-label={label} className="grid w-max max-w-full gap-1 overflow-x-auto" style={{ gridTemplateColumns: `auto repeat(${columns.length}, minmax(2.5rem, 2.75rem))` }}>
        <div role="row" className="contents"><span role="presentation" />
        {columns.map((c) => (
          <span key={c} role="columnheader" className="truncate text-center text-caption text-text-muted">
            {c}
          </span>
        ))}
        </div>
        {rows.map((r, ri) => (
          <div key={r} role="row" className="contents">
            <span role="rowheader" className="pe-2 text-caption text-text-muted">
              {r}
            </span>
            {columns.map((c, ci) => {
              const v = values[ri]?.[ci] ?? 0;
              const id = `${ri}-${ci}`;
              return (
                <span
                  key={c}
                  role="gridcell"
                  title={`${r} ${c}: ${values[ri]?.[ci] ?? 0} ${unit}`}
                  ref={(el) => {
                    cells.current[id] = el;
                  }}
                  tabIndex={Math.min(active[0], rows.length - 1) === ri && Math.min(active[1], columns.length - 1) === ci ? 0 : -1}
                  onKeyDown={(e) => onKey(e, ri, ci)}
                  aria-label={`${r} ${c}: ${v}${unit ? ` ${unit}` : ""}`}
                  onMouseEnter={() => setHover(id)}
                  onMouseLeave={() => setHover(null)}
                  onFocus={() => {
                    setHover(id);
                    setActive([ri, ci]);
                  }}
                  onBlur={() => setHover(null)}
                  className={clsx("relative aspect-square min-h-5 rounded-sm outline-none transition-colors duration-fast focus-visible:ring-2 focus-visible:ring-accent", LEVELS[heatLevel(v, max)])}
                >
                  {hover === id && (
                    <span aria-hidden="true" className="tabular-nums pointer-events-none absolute bottom-full start-1/2 z-10 mb-1 -translate-x-1/2 whitespace-nowrap rounded-lg bg-solid px-2 py-1 text-caption text-solid-ink rtl:translate-x-1/2">
                      {r} {c} · {v}
                      {unit && ` ${unit}`}
                    </span>
                  )}
                </span>
              );
            })}
          </div>
        ))}
      </div>
      <div aria-hidden="true" className="mt-3 flex items-center justify-end gap-1.5 text-caption text-text-muted">
        {t("Less", "أقل")}
        {LEVELS.map((l) => (
          <span key={l} className={clsx("h-3 w-3 rounded-sm", l)} />
        ))}
        {t("More", "أكثر")}
      </div>
    </div>
  );
}
