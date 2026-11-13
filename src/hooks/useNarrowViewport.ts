"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Below this, a panel costs more than it gives.
 *
 * 232px of a 390px screen is most of it, and what was left had colour codes,
 * font names and reorder buttons squeezed to 3–13px wide — technically
 * rendered, impossible to hit. The builder's own two panels were worse: the
 * rail took 60, the tools panel 240, and the page being edited got the ninety
 * pixels left over.
 *
 * One number, shared, because the sidebar and the builder's panels are the same
 * decision made twice and a window that is narrow for one is narrow for both.
 */
export const NARROW_QUERY = "(max-width: 900px)";

/**
 * `useSyncExternalStore` rather than an effect that calls `setState`.
 *
 * This is state that lives outside React and changes without us — exactly what
 * the hook is for. It also gives a server snapshot, so the first paint matches
 * what the server rendered instead of flashing the wide layout and snapping
 * shut.
 */
export function useNarrowViewport(): boolean {
  return useMediaQuery(NARROW_QUERY);
}

/**
 * A phone: where a menu opens as an action sheet from the bottom, in reach of
 * the thumb, instead of a dropdown hanging off a 40px button.
 */
export const PHONE_QUERY = "(max-width: 639px)";

export function usePhoneViewport(): boolean {
  return useMediaQuery(PHONE_QUERY);
}

function useMediaQuery(query: string): boolean {
  const subscribe = useCallback((notify: () => void) => {
    const mql = window.matchMedia(query);
    mql.addEventListener("change", notify);
    return () => mql.removeEventListener("change", notify);
  }, [query]);
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    // Assume wide on the server: the desktop layout is the one that renders
    // correctly before the client knows the viewport.
    () => false,
  );
}
