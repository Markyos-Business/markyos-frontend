"use client";

import Link from "next/link";
import { Avatar, IconButton } from "@/components/ui";
import type { Workspace } from "@/types";
import { formatRelative } from "@/lib/utils";

type BoardCardProps = {
  ws: Workspace;
  stageIndex: number;
  onDragStart: () => void;
  onDragEnd: () => void;
  onMove: (dir: 1 | -1) => void;
};

/** One brand on the board: its name, what's waiting, and the arrows that move it. */
export function BoardCard({ ws, stageIndex, onDragStart, onDragEnd, onMove }: BoardCardProps) {
  const pendingDrafts = ws.drafts.filter((d) => d.status === "pending").length;

  return (
    <article
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className="mk-surface flex cursor-grab flex-col gap-2 rounded-xl bg-surface-2 p-3 active:cursor-grabbing"
    >
      {/* The avatar is inside the link, not beside it: the name alone was a
          19px target, and the mark and the name are one identity, so they
          should be one object to point at. */}
      <Link href={`/w/${ws.slug}/overview`} className="-m-1 flex min-h-[34px] min-w-0 items-center gap-2.5 rounded-lg p-1 text-text">
        <Avatar initials={ws.initials} size={26} />
        <span dir="auto" className="bidi-auto truncate text-[12.5px] font-semibold">
          {ws.name}
        </span>
      </Link>

      {pendingDrafts > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <Link href={`/w/${ws.slug}/drafts`} className="mk-tap rounded bg-accent-soft px-2 text-[10.5px] font-semibold text-accent-on-soft">
            {pendingDrafts} waiting
          </Link>
        </div>
      )}

      <div className="flex items-center gap-1">
        <span className="text-[10.5px] text-text-faint">{formatRelative(ws.updatedAt)}</span>
        {/* Buttons as well as dragging: drag-and-drop is unusable with a
            keyboard and awkward on a touch screen. */}
        <span className="ms-auto flex items-center gap-0.5">
          <IconButton icon="angle-left" label={`Move ${ws.name} back a stage`} onClick={() => onMove(-1)} disabled={stageIndex <= 0} className="text-text-muted" />
          <IconButton icon="angle-right" label={`Move ${ws.name} on a stage`} onClick={() => onMove(1)} disabled={stageIndex >= 5} className="text-text-muted" />
        </span>
      </div>
    </article>
  );
}
