"use client";

import type { RefObject } from "react";
import { IconButton } from "@/components/ui";
import { TOOLBAR, type ToolbarAction } from "../constants";

type OverviewEditorProps = {
  editorRef: RefObject<HTMLDivElement | null>;
  isAr: boolean;
  wordCount: number;
  onInput: () => void;
  onTool: (action: ToolbarAction) => void;
};

/** The brand overview's rich-text editor and its toolbar. Block styles live in tailwind/base.js. */
export function OverviewEditor({ editorRef, isAr, wordCount, onInput, onTool }: OverviewEditorProps) {
  return (
    <div className="mk-surface flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-surface-1">
      <div className="flex shrink-0 items-center gap-1 px-4 py-2.5 text-text-muted shadow-rule-b">
        {TOOLBAR.map((t) => (
          <IconButton
            key={t.label}
            icon={t.icon}
            label={t.label}
            iconSize={18}
            // The editor loses its selection the moment a toolbar button
            // takes focus, so the press must not move focus at all.
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onTool(t.action)}
            className="h-9 cursor-pointer p-1.5 hover:text-text"
          />
        ))}
        <span className="ms-auto font-mono text-[11px] text-text-faint">{wordCount} words</span>
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={onInput}
        dir={isAr ? "rtl" : "ltr"}
        className={`overview-editor min-h-0 max-w-[74ch] flex-1 overflow-auto px-10 py-8 outline-none ${isAr ? "font-arabic" : "font-sans"}`}
      />
    </div>
  );
}
