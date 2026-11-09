"use client";

import { useRouter } from "next/navigation";
import { useBrandPage } from "@/contexts/pageGuards";
import { PAGE_SECTION } from "../constants";
import { boardHref } from "./projects/useMoodboardProjectsPage";
import { useMoodboardFullscreen } from "./useMoodboardFullscreen";

/**
 * One board, opened as its own project at /w/<slug>/moodboard/<boardId>: the
 * board, how much of the window it has, and the way back to all boards.
 */
export function useMoodboardPage(slug: string, boardId: string) {
  const page = useBrandPage(slug);
  const router = useRouter();
  const { fullscreen, applyFullscreen } = useMoodboardFullscreen();
  const ws = page?.workspace;

  if (!page || !ws) return null;
  const board = ws.moodboards.find((b) => b.id === boardId) ?? null;
  const allBoards = `/w/${ws.slug}/moodboard`;
  // A board made before the canvas existed has no `view`. The canvas is what a
  // moodboard is, so that is the default rather than the fallback.
  const view = board?.view ?? "canvas";
  /** The canvas is showing, so the page chrome gets out of its way. */
  const compact = !!board && view === "canvas";
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
      allBoards,
      onBoardMade: (id: string) => router.push(boardHref(ws.slug, id)),
      onBoardGone: () => router.push(allBoards),
      fullscreen,
      onFullscreen: applyFullscreen,
    },
  };
}

export type MoodboardPageView = NonNullable<ReturnType<typeof useMoodboardPage>>["view"];
