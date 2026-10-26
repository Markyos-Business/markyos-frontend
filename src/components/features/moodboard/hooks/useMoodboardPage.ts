"use client";

import { useMemo, useState } from "react";
import { useBrandPage } from "@/contexts/pageGuards";
import type { Moodboard } from "@/types";
import { PAGE_SECTION } from "../constants";
import { useMoodboardFullscreen } from "./useMoodboardFullscreen";

/**
 * The moodboard page: which board is open, whether a new one is being picked,
 * and how much of the window the board has.
 */
export function useMoodboardPage(slug: string) {
  const page = useBrandPage(slug);
  const ws = page?.workspace;
  const [activeId, setActiveId] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const { fullscreen, applyFullscreen } = useMoodboardFullscreen();

  const board: Moodboard | null = useMemo(() => {
    if (!ws) return null;
    return ws.moodboards.find((b) => b.id === activeId) ?? ws.moodboards[0] ?? null;
  }, [ws, activeId]);

  if (!page || !ws) return null;
  // A board made before the canvas existed has no `view`. The canvas is what a
  // moodboard is, so that is the default rather than the fallback.
  const view = board?.view ?? "canvas";
  /** The canvas is showing, so the page chrome gets out of its way. */
  const compact = !!board && !picking && view === "canvas";
  /** Full screen only means anything while the canvas is the thing on screen. */
  const immersive = compact && fullscreen;

  return {
    // In full screen the board is the only thing on the page: the breadcrumb
    // and title are navigation, which is not what arranging a board is.
    shell: { workspace: ws, section: PAGE_SECTION.en, arSection: PAGE_SECTION.ar, width: "full" as const, topBar: !immersive },
    view: {
      ws,
      isAr: page.isAr,
      board,
      view,
      compact,
      immersive,
      picking,
      onPicking: setPicking,
      onActive: setActiveId,
      fullscreen,
      onFullscreen: applyFullscreen,
    },
  };
}

export type MoodboardPageView = NonNullable<ReturnType<typeof useMoodboardPage>>["view"];
