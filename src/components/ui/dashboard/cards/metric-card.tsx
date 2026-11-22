"use client";

import type { ReactNode } from "react";
import { cx as clsx } from "../shared/styles";
import { card } from "../shared/styles";
import MetricDelta, { type MetricDeltaProps } from "../shared/metric-delta";
import IconTile, { type IconTileTone } from "../shared/icon-tile";
import Sparkline from "../charts/sparkline";
import WidgetStateView from "../shared/widget-state-view";
import type { IconComponent, WidgetStateProps } from "../types";

export type MetricCardVariant = "default" | "highlighted" | "icon" | "bars";

export interface MetricCardProps extends Omit<WidgetStateProps, "emptyMessage"> {
  label: string;
  /** The figure: Numeral, Amount or text (tabular). */
  value: ReactNode;
  delta?: Pick<MetricDeltaProps, "value" | "unit" | "goodWhen" | "comparedTo">;
  /** One line under the value, e.g. "vs 41 last month". */
  caption?: ReactNode;
  /** default · highlighted (brand fill; one per view) · icon (IconTile beside the label) · bars (mini bars under the value). */
  variant?: MetricCardVariant;
  icon?: IconComponent;
  iconTone?: IconTileTone;
  /** Mini bars for variant="bars" (oldest → newest; the last is highlighted). */
  bars?: number[];
  barsLabel?: string;
  /** Header control, e.g. a CardLinkButton. */
  action?: ReactNode;
  className?: string;
}

/**
 * Dashboard KPI card: label, big tabular value, delta pill and caption.
 * The existing simple MetricCard remains available for basic count displays.
 */
export default function MetricCard({ label, value, delta, caption, variant = "default", icon, iconTone = "brand", bars, barsLabel, action, state = "ready", errorMessage, onRetry, className }: MetricCardProps) {
  const hi = variant === "highlighted";
  return (
    <section aria-busy={state === "loading" || undefined} className={clsx(hi ? "rounded-card border border-transparent bg-accent" : card, "flex min-w-0 flex-col gap-3 p-4 md:p-5", className)}>
      {state !== "ready" ? (
        <WidgetStateView state={state} skeleton="stat" errorMessage={errorMessage} onRetry={onRetry} />
      ) : (
        <>
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              {(variant === "icon" || (hi && icon)) && icon && <IconTile icon={icon} tone={hi ? "onBrand" : iconTone} size="md" />}
              <h3 className={clsx("min-w-0 break-words text-body font-medium", hi ? "text-accent-ink" : "text-text-muted")}>{label}</h3>
            </div>
            {action}
          </div>
          <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
            <p className={clsx("tabular-nums text-h2 font-medium", hi ? "text-accent-ink" : "text-text")}>{value}</p>
            {delta && <MetricDelta {...delta} onBrand={hi} className="mb-1" />}
          </div>
          {variant === "bars" && bars && bars.length > 0 && <Sparkline values={bars} variant="bars" label={barsLabel ?? `${label}, recent trend`} className="h-10 w-full" />}
          {caption && <p className={clsx("text-caption", hi ? "text-accent-ink opacity-90" : "text-text-muted")}>{caption}</p>}
        </>
      )}
    </section>
  );
}
