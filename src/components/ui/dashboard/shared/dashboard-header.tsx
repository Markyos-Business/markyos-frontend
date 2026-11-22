"use client";

import type { ReactNode } from "react";
import { cx as clsx } from "../shared/styles";

export interface DashboardHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Hide a page title already supplied by the app navbar. */
  hideTitle?: boolean;
  /** The view's one Primary action (a Button variant="primary"). */
  primaryAction?: ReactNode;
  /** Secondary actions, e.g. a PeriodSelect or Export (secondary buttons). */
  secondaryActions?: ReactNode;
  /** Heading level. Default h1. */
  as?: "h1" | "h2" | "h3";
  className?: string;
}

/**
 * Top of a dashboard (brief §5): heading-xl title, one line of context, actions on the end side (wrap on mobile).
 *
 * Kept beside PageHeader rather than folded into it: the dashboard family
 * takes a rich title, can hide it when the navbar already shows one, and
 * steps the title down to h2 size on a phone. Every other page uses PageHeader.
 */
export default function DashboardHeader({ title, hideTitle = false, subtitle, primaryAction, secondaryActions, as: Heading = "h1", className }: DashboardHeaderProps) {
  return (
    <header className={clsx("flex flex-col gap-4 md:flex-row md:items-end md:justify-between", className)}>
      <div className="min-w-0">
        {!hideTitle && <Heading className="text-h2 text-text sm:text-h1">{title}</Heading>}
        {subtitle && <p className="mt-1 text-body text-text-muted">{subtitle}</p>}
      </div>
      {(primaryAction || secondaryActions) && (
        <div className="flex flex-wrap items-center gap-2 md:justify-end">
          {secondaryActions}
          {primaryAction}
        </div>
      )}
    </header>
  );
}
