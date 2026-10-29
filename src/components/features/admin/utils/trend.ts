import type { TrendDirection } from "@/components/ui";

/** A stat card's trend: the change from a month ago, as a whole percentage. */
export function trendOf(now: number, before: number): { direction: TrendDirection; value: string } {
  if (now === before) return { direction: "neutral", value: "0%" };
  // From nothing, any growth is the whole of it.
  const pct = before === 0 ? 100 : Math.round((Math.abs(now - before) / before) * 100);
  return { direction: now > before ? "up" : "down", value: `${pct}%` };
}
