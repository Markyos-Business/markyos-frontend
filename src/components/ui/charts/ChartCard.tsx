import type { ReactNode } from "react";
import { ContentCard } from "../card/ContentCard";
import { Skeleton } from "../loading/Skeleton";
import { ErrorState } from "../empty/ErrorState";
import { Chart, type ChartProps } from "./Chart";
import { ChartLegend } from "./ChartLegend";

type ChartCardProps = ChartProps & {
  title: string;
  /** On the end side of the header: a period select, tabs. */
  controls?: ReactNode;
  loading?: boolean;
  /** A failed load: shown in place of the chart, with Retry when `onRetry` is set. */
  error?: string | null;
  onRetry?: () => void;
  /** Shown instead of an empty chart. */
  empty?: ReactNode;
  className?: string;
};

/** A ContentCard holding a chart, its legend in the header, and every state. */
const ChartCard = ({ title, controls, loading = false, error, onRetry, empty, className = "", ...chart }: ChartCardProps) => {
  const height = chart.height ?? 220;
  const body = error ? (
    <ErrorState message={error} onRetry={onRetry} />
  ) : loading ? (
    <div style={{ height }}>
      <Skeleton className="size-full rounded-lg" />
    </div>
  ) : chart.data.length === 0 && empty ? (
    empty
  ) : (
    <Chart {...chart} />
  );
  return (
    <ContentCard title={title} legend={<ChartLegend labels={chart.series} />} controls={controls} className={className}>
      {body}
    </ContentCard>
  );
};

export { ChartCard };
export type { ChartCardProps };
