"use client";

import { useRef } from "react";
import { Button, Icon, IconButton, Stagger } from "@/components/ui";
import type { MoodboardProjectsView as Props } from "../../hooks/projects/useMoodboardProjectsPage";
import { MoodboardFootnote } from "../MoodboardFootnote";
import { MoodboardIntro } from "../MoodboardIntro";
import { TemplatePicker } from "../TemplatePicker";
import { BoardProjectCard } from "./BoardProjectCard";

/**
 * The moodboard as projects: each board is its own piece of work, opened on
 * its own page, rather than tabs over one shared canvas. Starting one is
 * choosing a method (or just dropping in references).
 */
export function MoodboardProjectsView({ ws, isAr, boards, picking, onPicking, onCreate, onUploadNew, onRename, onDuplicate, onDelete }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const assets = new Map(ws.assets.map((a) => [a.id, a]));
  const empty = boards.length === 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-space-8 overflow-auto px-7 py-6.5">
      <div className="flex flex-wrap items-start justify-between gap-space-5">
        <MoodboardIntro isAr={isAr} compact={false} hidden={false} />
        {!empty && (
          <div className="flex shrink-0 items-center gap-space-3">
            <Button variant="outline" icon={<Icon name="upload" size={18} />} onClick={() => fileRef.current?.click()}>
              {isAr ? "ارفع مراجع" : "Upload references"}
            </Button>
            <Button variant="primary" icon={<Icon name="plus" size={18} />} onClick={() => onPicking(!picking)} aria-expanded={picking}>
              {isAr ? "لوح جديد" : "New board"}
            </Button>
          </div>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) onUploadNew(Array.from(e.target.files));
          e.target.value = "";
        }}
      />

      {(picking || empty) && (
        <section className="flex flex-col gap-space-4" aria-label={isAr ? "ابدأ لوحًا جديدًا" : "Start a new board"}>
          {!empty && (
            <div className="flex items-center justify-between gap-space-3">
              <h2 className="text-h5 font-medium text-text">{isAr ? "ابدأ لوحًا جديدًا" : "Start a new board"}</h2>
              <IconButton icon="times" label={isAr ? "إغلاق" : "Close"} onClick={() => onPicking(false)} />
            </div>
          )}
          <TemplatePicker isAr={isAr} onPick={onCreate} onUpload={() => fileRef.current?.click()} hasBoard={!empty} />
        </section>
      )}

      {!empty && (
        <Stagger className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {boards.map((b) => (
            <BoardProjectCard
              key={b.id}
              board={b}
              slug={ws.slug}
              assets={assets}
              isAr={isAr}
              onRename={() => onRename(b)}
              onDuplicate={() => onDuplicate(b)}
              onDelete={() => onDelete(b)}
            />
          ))}
        </Stagger>
      )}

      <MoodboardFootnote slug={ws.slug} isAr={isAr} hidden={false} />
    </div>
  );
}
