// Dashboard widget library (presentational: props in, UI out).
export { default as DashboardHeader } from "./shared/dashboard-header";
export { default as PeriodSelect, PERIOD_LABELS, type DashboardPeriod } from "./shared/period-select";
export { default as CardMenu } from "./shared/card-menu";
export { default as CardLinkButton } from "./cards/card-link-button";
export { default as DashboardCard } from "./cards/dashboard-card";
export { default as CardFooterStats } from "./cards/card-footer-stats";
export { default as MetricCard } from "./cards/metric-card";
export { default as MetricDelta, formatDelta, deltaTone } from "./shared/metric-delta";
export { default as IconTile } from "./shared/icon-tile";
export { default as TimeSeriesBarChart, defaultHighlight } from "./charts/time-series-bar-chart";
export { default as CategoryColumnChart } from "./charts/category-column-chart";
export { default as GaugeChart, gaugeDashes } from "./charts/gauge-chart";
export { default as GaugeLegendStats } from "./charts/gauge-legend-stats";
export { default as ActivityHeatmap, heatLevel } from "./charts/activity-heatmap";
export { default as Sparkline, sparkPoints } from "./charts/sparkline";
export { default as PipelineBar } from "./pipeline/pipeline-bar";
export { default as PipelineFlow, type PipelineFlowStage, type PipelineFlowProps } from "./pipeline/pipeline-flow";
export { default as ChartLegend } from "./charts/chart-legend";
export { default as TaskList, TaskListItem } from "./lists/task-list";
export { default as PeopleList, PeopleListItem } from "./lists/people-list";
export { default as BreakdownTable } from "./lists/breakdown-table";
export { default as StatusTag } from "./shared/status-tag";
export { default as ReminderCard } from "./cards/reminder-card";
export { default as CountdownCard, countdownParts } from "./cards/countdown-card";
export { default as ProgressCard } from "./cards/progress-card";
export { default as WidgetStateView, resolveWidgetState } from "./shared/widget-state-view";
export * from "./types";

export { default as QuickActions } from "./lists/quick-actions";
export type { QuickAction } from "./lists/quick-actions";

export { default as BarChartCard, type BarChartCardProps } from "./cards/bar-chart-card";
export { default as GaugeCard, type GaugeCardProps } from "./cards/gauge-card";

export { DashboardProvider } from "./shared/locale";
