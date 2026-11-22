"use client";

import { cx as clsx } from "../shared/styles";
import { CircleAlert, Inbox, RotateCw } from "../shared/icons";
import { Skeleton } from "../../skeleton";
import { Button } from "../../button/button";
import { useDashboardLocale } from "./locale";
import type { WidgetState } from "../types";

export interface WidgetStateViewProps {
  state: Exclude<WidgetState, "ready">;
  /** Skeleton shape while loading. Default "lines". */
  skeleton?: "lines" | "chart" | "list" | "stat";
  emptyMessage?: string;
  errorMessage?: string;
  onRetry?: () => void;
  className?: string;
}

/**
 * Loading, empty and error content for a widget, sized like the real thing
 * so nothing jumps when data arrives. Loading is announced as busy; errors
 * use role="alert".
 */
export default function WidgetStateView({ state, skeleton = "lines", emptyMessage, errorMessage, onRetry, className }: WidgetStateViewProps) {
  const { t } = useDashboardLocale();
  if (state === "loading") {
    return (
      <div role="status" aria-label={t("Loading", "جارٍ التحميل")} aria-busy="true" className={className}>
        {skeleton === "chart" && (
          <div className="flex h-40 items-end gap-3">
            {[40, 70, 55, 90, 65, 45, 80].map((_, i) => (
              <Skeleton key={i} className={clsx("flex-1 rounded-full", ["h-1/3", "h-2/3", "h-1/2", "h-5/6", "h-3/5", "h-2/5", "h-3/4"][i])} />
            ))}
          </div>
        )}
        {skeleton === "stat" && (
          <div className="grid gap-2">
            <Skeleton className="h-4 w-24 max-w-full" />
            <Skeleton className="h-9 w-32 max-w-full" />
            <Skeleton className="h-4 w-40 max-w-full" />
          </div>
        )}
        {skeleton === "list" && (
          <div className="grid gap-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 shrink-0 rounded-widget" />
                <div className="grid flex-1 gap-1.5">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        )}
        {skeleton === "lines" && (
          <div className="grid gap-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        )}
      </div>
    );
  }
  if (state === "error") {
    return (
      <div role="alert" className={clsx("flex flex-col items-start gap-3 rounded-widget border border-danger bg-danger-soft p-4", className)}>
        <p className="flex items-start gap-space-3 text-caption text-danger">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {errorMessage ?? t("This couldn't load.", "تعذر التحميل.")}
        </p>
        {onRetry && (
          <Button onClick={onRetry} size="sm" variant="secondary">
            <RotateCw className="h-4 w-4" aria-hidden="true" />
            {t("Try again", "إعادة المحاولة")}
          </Button>
        )}
      </div>
    );
  }
  return (
    <div className={clsx("flex flex-col items-center justify-center gap-2 rounded-widget bg-surface-2 px-4 py-8 text-center", className)}>
      <Inbox className="h-6 w-6 text-text-muted" aria-hidden="true" />
      <p className="text-caption text-text-muted">{emptyMessage ?? t("Nothing to show yet.", "لا يوجد ما يُعرض بعد.")}</p>
    </div>
  );
}

/** Pure: the state a widget shows (explicit state wins; no data means empty). */
export function resolveWidgetState(state: WidgetState | undefined, hasData: boolean): WidgetState {
  if (state && state !== "ready") return state;
  return hasData ? "ready" : "empty";
}
