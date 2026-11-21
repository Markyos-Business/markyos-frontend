"use client";

import { useState } from "react";
import { useLocalPref } from "@/hooks/useLocalPref";
import { useBuilderViewport } from "./use-builder-viewport";

/**
 * Whether the tools and design panels are open.
 *
 * Panel visibility is this browser's preference, not the brand's. A narrow
 * window starts with both shut: on a 390px screen the canvas got the ninety
 * pixels left over. Shut to *begin* with, not permanently — the panels hold
 * the only route to Insert, Template and Site — and on a phone they open one at
 * a time, while the stored preference waits for the window to widen.
 */
/** The tools panel's width: wide enough for its four tabs, never half the screen. */
export const TOOLS_DEFAULT_W = 288;
export const TOOLS_MIN_W = 288;
export const TOOLS_MAX_W = 420;
export const clampToolsWidth = (w: number) =>
  Number.isFinite(w) ? Math.min(TOOLS_MAX_W, Math.max(TOOLS_MIN_W, Math.round(w))) : TOOLS_DEFAULT_W;

export function useBuilderPanels() {
  const [leftPref, setLeftPref] = useLocalPref("markyos:ui:builder-left", true);
  const [rightPref, setRightPref] = useLocalPref("markyos:ui:builder-right", true);
  // The tools panel's width on a wide screen, dragged by its edge.
  const [leftWidth, setLeftWidth] = useLocalPref("markyos:ui:builder-left-width", TOOLS_DEFAULT_W);
  // Under 1024px the panels float over the canvas, one at a time.
  const { compact: narrow } = useBuilderViewport();
  const [narrowPanel, setNarrowPanel] = useState<"left" | "right" | null>(null);
  return {
    narrow,
    leftWidth: clampToolsWidth(leftWidth),
    setLeftWidth: (w: number) => setLeftWidth(clampToolsWidth(w)),
    leftOpen: narrow ? narrowPanel === "left" : leftPref,
    rightOpen: narrow ? narrowPanel === "right" : rightPref,
    setLeftOpen: (next: boolean) => {
      if (narrow) setNarrowPanel(next ? "left" : null);
      else setLeftPref(next);
    },
    setRightOpen: (next: boolean) => {
      if (narrow) setNarrowPanel(next ? "right" : null);
      else setRightPref(next);
    },
  };
}
