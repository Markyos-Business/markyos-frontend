"use client";

import { useEffect, useRef, useState } from "react";
import { SERIES_FILL, SERIES_STROKE } from "./series";

type ChartPoint = { label: string; values: number[] };

type ChartProps = {
  kind?: "bar" | "line" | "area";
  /** One point per x-axis step; `values` in series order. */
  data: ChartPoint[];
  /** Series names, in the same order as each point's values. */
  series: string[];
  /** Height in pixels. Default 220. */
  height?: number;
  /** Formats axis labels and the tooltip. Default: the number as is. */
  format?: (n: number) => string;
  /** The chart's accessible name. */
  label: string;
};

const PAD = { top: 12, bottom: 26, start: 36, end: 8 };

/**
 * A bar, line or area chart drawn in SVG with theme tokens: dashed hairline
 * gridlines, 11px muted axis labels, a tooltip on hover or focus. Time runs
 * left to right in Arabic too: a chart's time axis never mirrors (spec §8).
 */
const Chart = ({ kind = "bar", data, series, height = 220, format = (n) => String(n), label }: ChartProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setWidth(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const max = Math.max(1, ...data.flatMap((p) => p.values));
  // Four steps of a round size (1, 2, 2.5 or 5 × 10ⁿ), so the gridlines
  // read 0 / 25 / 50 / 75 / 100 rather than 0 / 23 / 45.
  const magnitude = Math.pow(10, Math.floor(Math.log10(max / 4)));
  const step = ([1, 2, 2.5, 5, 10].find((m) => m * magnitude >= max / 4) ?? 10) * magnitude;
  const top = step * 4;
  const ticks = [0, 1, 2, 3, 4].map((n) => n * step);
  const plotW = Math.max(0, width - PAD.start - PAD.end);
  const plotH = height - PAD.top - PAD.bottom;
  const band = data.length ? plotW / data.length : 0;
  const x = (i: number) => PAD.start + (i + 0.5) * band;
  const y = (v: number) => PAD.top + plotH - (v / top) * plotH;
  const axisX = PAD.start - 6;

  return (
    <div ref={ref} dir="ltr" className="relative w-full" style={{ height }}>
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label={label}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.start} x2={width - PAD.end} y1={y(t)} y2={y(t)} className="stroke-hairline-strong" strokeDasharray="3 4" />
              <text x={axisX} y={y(t)} dy="0.32em" textAnchor="end" className="fill-text-muted text-ui-2xs">
                {format(t)}
              </text>
            </g>
          ))}
          {data.map((p, i) => (
            <text key={p.label} x={x(i)} y={height - 8} textAnchor="middle" className="fill-text-muted text-ui-2xs">
              {p.label}
            </text>
          ))}
          {kind === "bar"
            ? data.map((p, i) => {
                const w = Math.min(28, (band * 0.7) / series.length);
                return p.values.map((v, s) => (
                  <rect
                    key={`${i}-${s}`}
                    x={x(i) - (w * series.length) / 2 + s * w}
                    y={y(v)}
                    width={Math.max(1, w - 2)}
                    height={Math.max(0, PAD.top + plotH - y(v))}
                    rx={3}
                    className={SERIES_FILL[s % SERIES_FILL.length]}
                    opacity={hover === null || hover === i ? 1 : 0.45}
                  />
                ));
              })
            : series.map((_, s) => {
                const pts = data.map((p, i) => `${x(i)},${y(p.values[s] ?? 0)}`).join(" ");
                const base = `${x(data.length - 1)},${y(0)} ${x(0)},${y(0)}`;
                return (
                  <g key={s}>
                    {kind === "area" && <polygon points={`${pts} ${base}`} className={SERIES_FILL[s % SERIES_FILL.length]} opacity={0.14} />}
                    <polyline points={pts} fill="none" strokeWidth={2} className={SERIES_STROKE[s % SERIES_STROKE.length]} />
                  </g>
                );
              })}
          {data.map((p, i) => (
            <rect
              key={`hit-${p.label}`}
              x={x(i) - band / 2}
              y={PAD.top}
              width={band}
              height={plotH}
              fill="transparent"
              tabIndex={0}
              aria-label={`${p.label}: ${p.values.map((v, s) => `${series[s]} ${format(v)}`).join(", ")}`}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              className="outline-none focus-visible:stroke-accent"
            />
          ))}
        </svg>
      )}
      {hover !== null && data[hover] && (
        <div
          aria-hidden
          className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-lg bg-surface-1 px-space-4 py-space-3 text-caption shadow-raised"
          style={{ left: x(hover) }}
        >
          <div className="mb-space-1 font-medium text-text">{data[hover].label}</div>
          {data[hover].values.map((v, s) => (
            <div key={s} className="flex items-center justify-between gap-space-5 text-text-muted">
              <span>{series[s]}</span>
              <span className="font-medium text-text">{format(v)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export { Chart };
export type { ChartPoint, ChartProps };
