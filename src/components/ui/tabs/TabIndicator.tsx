"use client";

import { ViewTransition } from "react";

type TabIndicatorProps = {
  /**
   * One name per tab row. The indicator renders inside the active tab only;
   * when the selection changes inside `startTransition`, React sees the same
   * name leave one tab and arrive in the next, and the browser slides it
   * across (the View Transitions API). Without support it simply moves.
   */
  group: string;
  className?: string;
};

/**
 * The active tab's pill, as its own element so it can travel between tabs.
 * The tab button needs `relative isolate` so the pill sits under its label.
 */
const TabIndicator = ({ group, className = "bg-surface-2" }: TabIndicatorProps) => (
  <ViewTransition name={`tab-indicator-${group}`} share="tab-slide" default="none">
    <span aria-hidden className={`pointer-events-none absolute inset-0 -z-10 rounded-full ${className}`} />
  </ViewTransition>
);

export { TabIndicator };
export type { TabIndicatorProps };
