"use client";
import { resolveWidgetState } from "../shared/widget-state-view";
import DashboardCard, { type DashboardCardProps } from "./dashboard-card";
import CardFooterStats, { type CardFooterStat } from "./card-footer-stats";
import CardMenu, { type CardMenuProps } from "../shared/card-menu";
import TimeSeriesBarChart, { type TimeSeriesBarChartProps } from "../charts/time-series-bar-chart";

export interface BarChartCardProps
  extends Omit<DashboardCardProps, "children" | "skeleton" | "footer"> {
  data: TimeSeriesBarChartProps["data"];
  label: string;
  unit?: string;
  highlightIndex?: number;
  formatValue?: TimeSeriesBarChartProps["formatValue"];
  stats?: CardFooterStat[];
  menu?: CardMenuProps;
}
/** Reference dashboard card: rounded bars, optional menu/link actions and summary footer. */
export default function BarChartCard({
  data,
  label,
  unit,
  highlightIndex,
  formatValue,
  stats,
  menu,
  actions,
  state,
  ...card
}: BarChartCardProps) {
  const resolved = resolveWidgetState(state, data.length > 0);
  return (
    <DashboardCard
      {...card}
      state={resolved}
      skeleton="chart"
      actions={
        <>
          {menu && <CardMenu {...menu} />}
          {actions}
        </>
      }
      footer={stats?.length ? <CardFooterStats items={stats} /> : undefined}
    >
      <TimeSeriesBarChart
        data={data}
        label={label}
        unit={unit}
        highlightIndex={highlightIndex}
        formatValue={formatValue}
        heightClass="h-48"
        className="pt-7"
      />
    </DashboardCard>
  );
}
