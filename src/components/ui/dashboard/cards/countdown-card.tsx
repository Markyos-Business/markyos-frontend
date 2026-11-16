"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AppDate } from "../../app-date/app-date";
import { useDashboardLocale } from "../shared/locale";
import DashboardCard from "./dashboard-card";
import type { WidgetStateProps } from "../types";

export interface CountdownCardProps extends Omit<WidgetStateProps, "emptyMessage"> {
  /** Heading, e.g. "Next launch". */
  heading: string;
  /** ISO date-time counted down to. */
  target: string;
  /** What it is, e.g. "January 2027 launch". */
  description?: ReactNode;
  /** Shown once the date has passed. Default "It's started." */
  doneMessage?: string;
  /** Reference time (tests and previews); otherwise ticks every minute. */
  now?: Date;
  footer?: ReactNode;
  className?: string;
}

/** Pure: whole days, hours and minutes until target (all 0 once passed). */
export function countdownParts(target: Date, now: Date): { days: number; hours: number; minutes: number; done: boolean } | null {
  if (!Number.isFinite(target.getTime()) || !Number.isFinite(now.getTime())) return null;
  const ms = target.getTime() - now.getTime();
  if (ms <= 0) return { days: 0, hours: 0, minutes: 0, done: true };
  const m = Math.floor(ms / 60_000);
  return { days: Math.floor(m / 1440), hours: Math.floor((m % 1440) / 60), minutes: m % 60, done: false };
}

/** Countdown to a date (brand launch, review deadline) in days / hours / minutes, tabular, updating every minute. */
export default function CountdownCard({ heading, target, description, doneMessage, now: fixedNow, footer, state = "ready", errorMessage, onRetry, className }: CountdownCardProps) {
  const { t, lang } = useDashboardLocale();
  const invalid = !Number.isFinite(new Date(target).getTime());
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    if (fixedNow) return;
    const initial = window.setTimeout(() => setNow(new Date()), 0);
    const t = window.setInterval(() => setNow(new Date()), 60_000);
    return () => { window.clearTimeout(initial); window.clearInterval(t); };
  }, [fixedNow]);

  const reference = fixedNow ?? now;
  const parts = reference ? countdownParts(new Date(target), reference) : null;
  const units = parts ? [{ n: parts.days, l: t(parts.days === 1 ? "day" : "days", "يوم") }, { n: parts.hours, l: t(parts.hours === 1 ? "hour" : "hours", "ساعة") }, { n: parts.minutes, l: t(parts.minutes === 1 ? "minute" : "minutes", "دقيقة") }] : [];
  return (
    <DashboardCard title={heading} subtitle={<AppDate value={target} format="long" locale={lang} />} state={state !== "ready" ? state : invalid ? "error" : !parts ? "loading" : "ready"} skeleton="stat" errorMessage={errorMessage ?? (invalid ? t("Invalid target date.", "تاريخ الموعد غير صالح.") : undefined)} onRetry={onRetry} footer={footer} className={className}>
      {parts?.done ? (
        <p className="text-title-sm text-text">{doneMessage ?? t("The date has passed.", "انقضى الموعد.")}</p>
      ) : (
        <>
          <p className="sr-only">{units.map((u) => `${u.n} ${u.l}`).join(", ")} {t("left", "متبقية")}</p>
          <div aria-hidden="true" className="grid grid-cols-3 gap-2">
            {units.map((u) => (
              <div key={u.l} className="rounded-widget bg-surface-2 px-2 py-3 text-center">
                <p className="tabular-nums text-h2 text-text">{String(u.n).padStart(2, "0")}</p>
                <p className="text-caption text-text-muted">{u.l}</p>
              </div>
            ))}
          </div>
        </>
      )}
      {description && <p className="mt-3 text-caption text-text-muted">{description}</p>}
    </DashboardCard>
  );
}
