"use client";

import type { Workspace, WorkspaceStage } from "@/types";
import { STAGES } from "../constants";
import { BoardCard } from "./BoardCard";

type BoardColumnProps = {
  stage: (typeof STAGES)[number];
  items: Workspace[];
  isOver: boolean;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onDragOver: (stage: WorkspaceStage) => void;
  onDragLeave: (stage: WorkspaceStage) => void;
  onDrop: (stage: WorkspaceStage) => void;
  onStep: (ws: Workspace, dir: 1 | -1) => void;
};

/** One stage: its name, count and hint, and the brands in it. */
export function BoardColumn({ stage, items, isOver, onDragStart, onDragEnd, onDragOver, onDragLeave, onDrop, onStep }: BoardColumnProps) {
  return (
    <section
      aria-label={`${stage.label} — ${items.length} brand${items.length === 1 ? "" : "s"}`}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver(stage.key);
      }}
      onDragLeave={() => onDragLeave(stage.key)}
      onDrop={(e) => {
        e.preventDefault();
        onDrop(stage.key);
      }}
      // `--hairline-strong` for the edge, not `--hairline`: the interior
      // divider used as a card edge put a 1.35:1 line around a column
      // sitting 1.12:1 from the page.
      className={`flex w-[268px] shrink-0 flex-col gap-2.5 rounded-2xl p-3 ${
        isOver ? "bg-accent-soft shadow-[inset_0_0_0_1px_var(--accent-ring)]" : "bg-surface-1 shadow-[inset_0_0_0_1px_var(--hairline-strong)]"
      }`}
    >
      <header className="px-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[12.5px] font-semibold">{stage.label}</span>
          <span className="rounded bg-surface-3 px-1.5 py-[2px] text-[11px] font-semibold text-text-muted">{items.length}</span>
        </div>
        <div className="mt-0.5 text-[11px] text-text-faint">{stage.hint}</div>
      </header>

      {items.length === 0 ? (
        <p className="px-1 py-3 text-[11.5px] text-text-faint">Nothing here.</p>
      ) : (
        items.map((ws) => (
          <BoardCard
            key={ws.id}
            ws={ws}
            stageIndex={STAGES.findIndex((s) => s.key === ws.stage)}
            onDragStart={() => onDragStart(ws.id)}
            onDragEnd={onDragEnd}
            onMove={(dir) => onStep(ws, dir)}
          />
        ))
      )}
    </section>
  );
}
