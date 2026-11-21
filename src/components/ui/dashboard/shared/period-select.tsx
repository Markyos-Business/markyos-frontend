"use client";
import { useId } from "react";
import { SelectInput } from "../../listbox/select-input";
import { useDashboardLocale } from "./locale";
export type DashboardPeriod = "week" | "month" | "year";
export const PERIOD_LABELS = { week: "This week", month: "This month", year: "This year" };
export interface PeriodSelectProps {
  value: DashboardPeriod;
  onChange: (value: DashboardPeriod) => void;
  options?: DashboardPeriod[];
  label?: string;
  labels?: Partial<Record<DashboardPeriod, string>>;
  size?: "sm" | "md";
  disabled?: boolean;
  className?: string;
}
/** Controlled picker: callers must actually filter their data for these periods. */
export default function PeriodSelect({ value, onChange, options = ["week", "month", "year"], label, labels: customLabels, size = "sm", disabled, className }: PeriodSelectProps) {
  const id = useId();
  const { t } = useDashboardLocale();
  const labels = { week: t("This week", "هذا الأسبوع"), month: t("This month", "هذا الشهر"), year: t("This year", "هذا العام") };
  return <div className={`min-w-0 ${className ?? ""}`}>
    <label htmlFor={id} className="sr-only">{label ?? t("Period", "الفترة")}</label>
    <SelectInput id={id} value={value} onChange={next => onChange(next as DashboardPeriod)} options={options.map(period => ({ value: period, label: customLabels?.[period] ?? labels[period] }))} size={size} disabled={disabled} />
  </div>;
}
