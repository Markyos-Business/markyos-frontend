"use client";
import type { ReactNode } from "react";
import { Progress, type ProgressTone } from "../../progress";
import DashboardCard from "./dashboard-card";
import { useDashboardLocale } from "../shared/locale";
import type { WidgetStateProps } from "../types";
export interface ProgressCardProps extends Omit<WidgetStateProps, "emptyMessage"> {
  title: string;
  done: number;
  total: number;
  stepLabel?: string;
  description?: ReactNode;
  action?: ReactNode;
  tone?: ProgressTone;
  className?: string;
}
export default function ProgressCard({ title, done, total, stepLabel, description, action, tone, state = "ready", errorMessage, onRetry, className }: ProgressCardProps) {
  const { t } = useDashboardLocale();
  const safeTotal = Number.isFinite(total) ? Math.max(0, total) : 0;
  const safeDone = Number.isFinite(done) ? Math.min(safeTotal, Math.max(0, done)) : 0;
  const label = t(`${safeDone} of ${safeTotal}`, `${safeDone} من ${safeTotal}`) + ` ${stepLabel ?? t("steps", "خطوات")}`;
  return <DashboardCard title={title} actions={action} state={state} skeleton="lines" errorMessage={errorMessage} onRetry={onRetry} className={className}>
    <p className="mb-space-3 text-caption tabular-nums text-text-muted">{label}</p>
    <Progress value={safeTotal ? (safeDone / safeTotal) * 100 : 0} label={label} size="md" tone={tone ?? (safeTotal > 0 && safeDone === safeTotal ? "success" : "accent")} />
    {description && <p className="mt-space-3 text-caption text-text-muted">{description}</p>}
  </DashboardCard>;
}
