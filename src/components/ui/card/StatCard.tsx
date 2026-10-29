import type { ReactNode } from "react";
import { TrendChip, type TrendDirection } from "../badges/TrendChip";
import { Skeleton } from "../loading/Skeleton";

type StatCardProps = {
  label: string;
  /** Already formatted: "1,284", "SAR 84,500". */
  value: ReactNode;
  /** Under the value, beside the trend: "vs last month". */
  footnote?: string;
  trend?: { direction: TrendDirection; value: string; label?: string };
  /** Placeholders in place of the value and footer. Default false. */
  loading?: boolean;
  className?: string;
};

/**
 * One number in a frame: a raised outer frame with the inner panel set into
 * it, the label over the value, and a footnote with its trend underneath.
 */
const StatCard = ({ label, value, footnote, trend, loading = false, className = "" }: StatCardProps) => (
  <div className={`rounded-card bg-surface-2 p-space-1 shadow-edge ${className}`}>
    <div className="flex flex-col gap-space-2 rounded-spark bg-surface-1 px-space-5 py-space-4">
      <span className="text-ui text-text-muted">{label}</span>
      {loading ? <Skeleton className="h-8 w-24 rounded-lg" /> : <span className="text-2xl font-medium text-text">{value}</span>}
    </div>
    {(footnote || trend) && (
      <div className="flex items-center justify-between gap-space-3 px-space-5 pb-space-2 pt-space-3">
        {loading ? (
          <Skeleton className="h-4 w-20 rounded-lg" />
        ) : (
          <>
            <span className="truncate text-caption text-text-muted">{footnote}</span>
            {trend && <TrendChip direction={trend.direction} value={trend.value} label={trend.label} />}
          </>
        )}
      </div>
    )}
  </div>
);

export { StatCard };
export type { StatCardProps };
