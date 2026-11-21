"use client";

import { cx as clsx } from "../shared/styles";
import { useDashboardLocale } from "./locale";
import { ArrowDownRight, ArrowUpRight, Minus } from "../shared/icons";

export interface MetricDeltaProps {
  /** Signed change, e.g. 12 or -4.5. */
  value: number;
  /** Default "%". Use "" for counts ("+3"). */
  unit?: string;
  /** Whether a rise is good (new accounts) or bad (days in stage). Default "up". */
  goodWhen?: "up" | "down";
  /** Period it compares to, read by screen readers: "vs last month". */
  comparedTo?: string;
  /** On a highlighted (brand) card. */
  onBrand?: boolean;
  className?: string;
}

/** Pure: "+12%", "−4.5%", "0%" (real minus sign). */
export function formatDelta(value: number, unit = "%"): string {
  const n = Math.abs(value).toLocaleString("en-US", { maximumFractionDigits: 1 });
  return `${value > 0 ? "+" : value < 0 ? "−" : ""}${n}${unit}`;
}

/** Pure: success when the change is the good direction, danger when bad, neutral at zero. */
export function deltaTone(value: number, goodWhen: "up" | "down" = "up"): "success" | "danger" | "neutral" {
  if (value === 0) return "neutral";
  return (value > 0) === (goodWhen === "up") ? "success" : "danger";
}

const TONE = {
  success: "border-success bg-success-soft text-success",
  danger: "border-danger bg-danger-soft text-danger",
  neutral: "border-hairline bg-surface-2 text-text-muted",
};

/** Change pill (+12%): arrow + signed value, coloured by whether the change is good. Never colour alone. */
export default function MetricDelta({ value, unit = "%", goodWhen = "up", comparedTo, onBrand = false, className }: MetricDeltaProps) {
  const { t } = useDashboardLocale();
  const tone = deltaTone(value, goodWhen);
  const Icon = value > 0 ? ArrowUpRight : value < 0 ? ArrowDownRight : Minus;
  return (
    <span className={clsx("tabular-nums inline-flex h-6 shrink-0 items-center gap-1 rounded-lg border px-2 text-caption font-medium", onBrand ? "border-transparent bg-solid text-solid-ink" : TONE[tone], className)}>
      <Icon className="h-3.5 w-3.5 rtl:-scale-x-100" aria-hidden="true" />
      <span aria-hidden="true" dir="ltr">{formatDelta(value, unit)}</span>
      <span className="sr-only">
        {value === 0 ? t("No change", "دون تغيير") : `${value > 0 ? t("Up", "ارتفاع") : t("Down", "انخفاض")} ${formatDelta(Math.abs(value), unit).replace(/^\+/, "")}`}
        {comparedTo ? ` ${comparedTo}` : ""}
      </span>
    </span>
  );
}
