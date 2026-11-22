import type { ComponentType } from "react";

/** Every widget renders one of these (brief §4.7 data states). */
export type WidgetState = "ready" | "loading" | "empty" | "error";

export type IconComponent = ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>;

/** Shared state props: pass state, or let the widget infer "empty" from its data. */
export interface WidgetStateProps {
  state?: WidgetState;
  /** Empty state line, e.g. "No applications this week." */
  emptyMessage?: string;
  /** Error line; a Try again button shows when onRetry is set. */
  errorMessage?: string;
  onRetry?: () => void;
}

/** Categorical slots (validated set) and supporting chart colours. */
export type ChartColor = "cat-1" | "cat-2" | "cat-3" | "muted" | "hatch";

/** Full class names so Tailwind's JIT sees them. */
export const CHART_BG: Record<ChartColor, string> = {
  "cat-1": "bg-accent",
  "cat-2": "bg-indigo",
  "cat-3": "bg-info",
  muted: "bg-ink-soft",
  hatch: "bg-accent-soft border border-dashed border-accent-edge",
};
export const CHART_STROKE: Record<Exclude<ChartColor, "hatch">, string> = {
  "cat-1": "stroke-accent",
  "cat-2": "stroke-indigo",
  "cat-3": "stroke-info",
  muted: "stroke-text-disabled",
};

/** Pure: compact numbers for axes and bubbles (1,284 · 12.9K · 4.2M). */
export function compactNumber(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${+(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 10_000) return `${+(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString("en-US");
}

export interface CardLinkButtonProps {
  href: string;
  label: string;
  tone?: "primary" | "secondary";
  size?: "sm" | "md";
  className?: string;
}
