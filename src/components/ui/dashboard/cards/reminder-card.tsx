"use client";

import type { ReactNode } from "react";
import { Button } from "../../button/button";
import { useDashboardLocale } from "../shared/locale";
import { cx as clsx } from "../shared/styles";
import { CalendarClock } from "../shared/icons";
import { AppDate } from "../../app-date/app-date";

import DashboardCard from "./dashboard-card";
import type { WidgetStateProps } from "../types";

export interface ReminderCardProps extends WidgetStateProps {
  /** Card heading. Default "Next up". */
  heading?: string;
  /** The event, e.g. "Brand review with the design team". */
  title?: ReactNode;
  /** ISO start time. */
  startsAt?: string;
  /** Where or how, e.g. "Google Meet" or "Markyos workspace". */
  location?: ReactNode;
  /** The one action: verb + object ("Join call"). */
  cta?: { label: string; href?: string; onClick?: () => void; icon?: ReactNode };
  /** highlighted uses the brand fill and a white CTA. */
  variant?: "default" | "highlighted";
  className?: string;
}

/** Upcoming event: title, time, place and one call to action. Empty when nothing is scheduled. */
export default function ReminderCard({ heading, title, startsAt, location, cta, variant = "default", state, emptyMessage, errorMessage, onRetry, className }: ReminderCardProps) {
  const { t, lang } = useDashboardLocale();
  const hi = variant === "highlighted";
  const resolved = state && state !== "ready" ? state : title ? "ready" : "empty";

  return (
    <DashboardCard title={heading ?? t("Next up", "القادم")} variant={variant} state={resolved} skeleton="lines" emptyMessage={emptyMessage ?? t("Nothing scheduled.", "لا يوجد شيء مجدول.")} errorMessage={errorMessage} onRetry={onRetry} className={className}>
      <p className={clsx("text-title-sm", hi ? "text-accent-ink" : "text-text")}>{title}</p>
      {(startsAt || location) && (
        <p className={clsx("mt-2 flex items-center gap-2 text-caption", hi ? "text-accent-ink opacity-90" : "text-text-muted")}>
          <CalendarClock className="h-4 w-4 shrink-0" aria-hidden="true" />
          {startsAt && <AppDate value={startsAt} format="datetime" locale={lang} />}
          {startsAt && location && <span aria-hidden="true">·</span>}
          {location}
        </p>
      )}
      {cta && (
        <div className="mt-4">
          <Button href={cta.href} onClick={cta.onClick} icon={cta.icon} block variant={hi ? "solid" : "primary"}>{cta.label}</Button>
        </div>
      )}
    </DashboardCard>
  );
}
