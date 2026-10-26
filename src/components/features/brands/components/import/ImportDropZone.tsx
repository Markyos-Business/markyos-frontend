"use client";

import { useRef } from "react";
import { Icon } from "@/components/ui";

/** Where a guideline file is dropped or picked. */
export function ImportDropZone({ onFile }: { onFile: (file: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="flex flex-col">
      <h1 className="mb-space-3 text-h1 font-medium">Import an existing guideline</h1>
      <p className="mb-[26px] max-w-[54ch] text-body text-text-muted">
        Upload the PDF or Word file you already have. Markyos renders the pages and samples their colours, reads the fonts the file embeds, and matches any
        strategy headings it can find — then shows you everything it found before anything is saved.
      </p>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = "";
        }}
      />
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files?.[0];
          if (file) onFile(file);
        }}
        className="flex h-50 cursor-pointer flex-col items-center justify-center gap-3 rounded-card bg-surface-1 shadow-edge"
      >
        <Icon name="upload" size={26} className="text-text-muted" />
        <span className="text-body font-medium">Drop a PDF or .docx, or click to browse</span>
        <span className="text-caption text-text-faint">Read entirely in your browser — the file is never uploaded anywhere</span>
      </div>
    </div>
  );
}
