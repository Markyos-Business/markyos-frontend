"use client";
import { resolveWidgetState } from "../shared/widget-state-view";
import DashboardCard, { type DashboardCardProps } from "./dashboard-card";
import CardFooterStats, { type CardFooterStat } from "./card-footer-stats";
import CardMenu, { type CardMenuProps } from "../shared/card-menu";
import GaugeChart, { type GaugeChartProps } from "../charts/gauge-chart";
import GaugeLegendStats from "../charts/gauge-legend-stats";

export interface GaugeCardProps
  extends Omit<DashboardCardProps, "children" | "skeleton" | "footer"> {
  segments: NonNullable<GaugeChartProps["segments"]>;
  label: string;
  centerLabel?: GaugeChartProps["centerLabel"];
  centerCaption?: GaugeChartProps["centerCaption"];
  stats?: CardFooterStat[];
  menu?: CardMenuProps;
}
/** Segmented gauge and matching legend; shared tokens support light, dark and RTL. */
export default function GaugeCard({
  segments,
  label,
  centerLabel,
  centerCaption,
  stats,
  menu,
  actions,
  state,
  ...card
}: GaugeCardProps) {
  const resolved = resolveWidgetState(state, segments.length > 0);
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
      <GaugeChart
        segments={segments}
        label={label}
        centerLabel={centerLabel}
        centerCaption={centerCaption}
      />
      <GaugeLegendStats items={segments} className="mt-5" />
    </DashboardCard>
  );
}
