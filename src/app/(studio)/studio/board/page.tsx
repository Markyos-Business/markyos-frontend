"use client";

import { BoardHeader, BoardView, useBoardPage } from "@/components/features/board";

export default function StudioBoardPage() {
  const board = useBoardPage();
  if (!board) return null;
  return (
    <div className="min-h-screen flex flex-col">
      <BoardHeader />
      <BoardView board={board} />
    </div>
  );
}
