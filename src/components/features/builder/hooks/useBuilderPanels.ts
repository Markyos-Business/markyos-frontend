"use client";

import { useState } from "react";
import { useLocalPref } from "@/hooks/useLocalPref";
import { useNarrowViewport } from "@/hooks/useNarrowViewport";

/**
 * Whether the tools and design panels are open.
 *
 * Panel visibility is this browser's preference, not the brand's. A narrow
 * window starts with both shut: on a 390px screen the canvas got the ninety
 * pixels left over. Shut to *begin* with, not permanently — the panels hold
 * the only route to Insert, Template and Site — and on a phone they open one at
 * a time, while the stored preference waits for the window to widen.
 */
export function useBuilderPanels() {
  const [leftPref, setLeftPref] = useLocalPref("markyos:ui:builder-left", true);
  const [rightPref, setRightPref] = useLocalPref("markyos:ui:builder-right", true);
  const narrow = useNarrowViewport();
  const [narrowPanel, setNarrowPanel] = useState<"left" | "right" | null>(null);
  return {
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
