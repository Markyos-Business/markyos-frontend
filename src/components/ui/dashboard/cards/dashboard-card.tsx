"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { cx as clsx } from "../shared/styles";
import { card } from "../shared/styles";
import WidgetStateView, { type WidgetStateViewProps } from "../shared/widget-state-view";
import type { WidgetStateProps } from "../types";

export interface DashboardCardProps extends WidgetStateProps {
  title: ReactNode;
  subtitle?: ReactNode;
  /** End-side header controls: PeriodSelect, CardMenu, CardLinkButton. */
  actions?: ReactNode;
  children?: ReactNode;
  /** Tabs or filters inside the card, between the header and body. */
  controls?: ReactNode;
  /** Attributes for the content panel, e.g. tabPanelProps for view tabs. */
  bodyProps?: HTMLAttributes<HTMLDivElement>;
  /** Under the body, e.g. CardFooterStats. */
  footer?: ReactNode;
  /** default: solid surface · highlighted: brand fill for the one card the view leads with. */
  variant?: "default" | "highlighted";
  /** Skeleton shape while loading. */
  skeleton?: WidgetStateViewProps["skeleton"];
  as?: "h2" | "h3" | "h4";
  /** Layout only (grid placement). */
  className?: string;
}

/**
 * Card shell for dashboard widgets (brief §4.4): Markyos card radius, 1px border, no
 * resting shadow, padding 20 (16 on mobile). The header holds the title and
 * controls; the body swaps to loading, empty or error from `state`.
 */
export default function DashboardCard({ title, subtitle, actions, children, controls, bodyProps, footer, variant = "default", state = "ready", skeleton, emptyMessage, errorMessage, onRetry, as: Heading = "h2", className }: DashboardCardProps) {
  const hi = variant === "highlighted";
  return (
    <section aria-busy={state === "loading" || undefined} className={clsx(hi ? "rounded-card border border-transparent bg-accent text-accent-ink" : card, "flex min-w-0 flex-col", className)}>
      <header className="flex items-start justify-between gap-3 px-4 pt-4 md:px-5 md:pt-5">
        <div className="min-w-0">
          <Heading className={clsx("text-title-sm font-medium", hi ? "text-accent-ink" : "text-text")}>{title}</Heading>
          {subtitle && <p className={clsx("mt-0.5 text-caption", hi ? "text-accent-ink" : "text-text-muted")}>{subtitle}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </header>
      {controls && <div className="px-4 pt-4 md:px-5">{controls}</div>}
      <div {...bodyProps} className={clsx("min-w-0 flex-1 px-4 pb-4 pt-4 md:px-5 md:pb-5", bodyProps?.className)}>
        {state === "ready" ? children : <WidgetStateView state={state} skeleton={skeleton} emptyMessage={emptyMessage} errorMessage={errorMessage} onRetry={onRetry} />}
      </div>
      {footer && state === "ready" && <footer className={clsx("border-t px-4 py-3 md:px-5", hi ? "border-accent-edge" : "border-hairline")}>{footer}</footer>}
    </section>
  );
}
