"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

const subscribe = (onChange: () => void) => {
  const list = window.matchMedia(QUERY);
  list.addEventListener("change", onChange);
  return () => list.removeEventListener("change", onChange);
};

/**
 * Whether the person asked for less motion, kept live. CSS already turns
 * movement into plain fades under this preference; use this only where JS
 * decides something, like waiting for an exit or drawing a chart.
 */
export function usePrefersReducedMotion() {
  return useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches, () => false);
}

/** The same, read once, for code that isn't a component (a timer, a handler). */
export const prefersReducedMotion = () => typeof window !== "undefined" && window.matchMedia(QUERY).matches;
