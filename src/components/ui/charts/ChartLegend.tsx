import { SERIES_BG } from "./series";

type ChartLegendProps = {
  /** Series names, in series order. */
  labels: string[];
  className?: string;
};

/** A dot and a name per series, for a ChartCard's legend slot. */
const ChartLegend = ({ labels, className = "" }: ChartLegendProps) => (
  <ul className={`flex flex-wrap items-center gap-space-5 ${className}`}>
    {labels.map((label, i) => (
      <li key={label} className="flex items-center gap-space-3 text-caption text-text-muted">
        <span aria-hidden className={`size-2 rounded-full ${SERIES_BG[i % SERIES_BG.length]}`} />
        {label}
      </li>
    ))}
  </ul>
);

export { ChartLegend };
export type { ChartLegendProps };
