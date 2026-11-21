"use client";

import type { RefObject } from "react";
import { IconButton } from "@/components/ui";
import { TOOLBAR, type ToolbarAction } from "../constants";

type OverviewEditorProps = {
  editorRef: RefObject<HTMLDivElement | null>;
  isAr: boolean;
  wordCount: number;
  /** "Saved 10h ago": shown beside the word count, on the text it is about. */
  savedLabel?: string;
  onInput: () => void;
  onTool: (action: ToolbarAction) => void;
};

/** The brand overview's rich-text editor and its toolbar. Block styles live in tailwind/base.js. */
export function OverviewEditor({ editorRef, isAr, wordCount, savedLabel, onInput, onTool }: OverviewEditorProps) {
  return (
    <div className="mk-surface flex min-h-64 flex-1 flex-col overflow-hidden rounded-card bg-surface-1">
      <div className="flex shrink-0 items-center gap-ctl-row px-4 py-2.5 text-text-muted shadow-rule-b">
        {TOOLBAR.map((t) => (
          <IconButton
            key={t.label}
            icon={t.icon}
            label={isAr ? t.arLabel : t.label}
            iconSize={18}
            // The editor loses its selection the moment a toolbar button
            // takes focus, so the press must not move focus at all.
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onTool(t.action)}
            className="h-9 cursor-pointer p-1.5 hover:text-text"
          />
        ))}
        <span dir="auto" className="ms-auto text-caption tabular-nums text-text-muted">
          {isAr ? `${wordCount} كلمة` : `${wordCount} words`}
          {savedLabel && <span className="text-text-faint"> · {savedLabel}</span>}
        </span>
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={onInput}
        dir={isAr ? "rtl" : "ltr"}
        // An empty brand showed a blank box with no hint of what goes in it.
        aria-label={isAr ? "نظرة عامة على العلامة" : "Brand overview"}
        data-placeholder={isAr ? "اكتب نظرة عامة على العلامة: من هي، ولمن، وما الذي يميّزها." : "Write the brand overview: who it is, who it's for, and what sets it apart."}
        className={`overview-editor min-h-0 max-w-[74ch] flex-1 overflow-auto px-10 py-8 outline-none empty:before:pointer-events-none empty:before:text-text-faint empty:before:content-[attr(data-placeholder)] ${isAr ? "font-arabic" : "font-sans"}`}
      />
    </div>
  );
}
