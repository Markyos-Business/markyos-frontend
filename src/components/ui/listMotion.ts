import type { CSSProperties } from "react";

// 40ms apart, and never more than seven steps of delay, so even a long list
// has finished arriving in well under 400ms.
const STEP_MS = 40;
const MAX_STEPS = 7;

type ListItemMotion = { className: string; style: CSSProperties };

/**
 * The entrance for item `index` of a list or grid: each fades up a beat after
 * the one before. Spread it onto the item element.
 */
const listItemMotion = (index: number): ListItemMotion => ({
  className: "animate-list-in",
  style: { animationDelay: `${Math.min(index, MAX_STEPS) * STEP_MS}ms` },
});

export { listItemMotion };
export type { ListItemMotion };
