"use client";

import { useMediaQuery } from "@/hooks/useNarrowViewport";

/*
 * The builder's own breakpoints (review, 21 Nov 2026).
 *
 * - compact, under 1024px: the panels float over the canvas instead of taking
 *   room beside it, one at a time; the top bar is a single row with View and
 *   Copy in its ⋯ menu.
 * - tooSmall, under 768px: there is no room to edit a 1200px page, so the
 *   builder says so instead of drawing a broken layout.
 *
 * Separate from the app's 900px `useNarrowViewport`, which other screens use.
 */
export const BUILDER_COMPACT_QUERY = "(max-width: 1023px)";
export const BUILDER_TOO_SMALL_QUERY = "(max-width: 767px)";

export function useBuilderViewport() {
  return {
    compact: useMediaQuery(BUILDER_COMPACT_QUERY),
    tooSmall: useMediaQuery(BUILDER_TOO_SMALL_QUERY),
  };
}
