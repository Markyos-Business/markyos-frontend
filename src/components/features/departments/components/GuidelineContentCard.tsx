"use client";

import { useRef, useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { AutoTextarea, Button, Icon, IconButton, useToast } from "@/components/ui";
import { fileToDataUrl, formatBytes } from "@/lib/utils";
import type { DepartmentView, Workspace } from "@/types";

type GuidelineContentCardProps = { ws: Workspace; view: DepartmentView; isAr: boolean };

/** The department's own guideline: an uploaded file, written text, or both. */
export function GuidelineContentCard({ ws, view, isAr }: GuidelineContentCardProps) {
  const { addAsset, setDeptGuideline } = useApp();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [textDraft, setTextDraft] = useState<string | null>(null);
  const guidelineFile = view.guidelineFileAssetId ? ws.assets.find((a) => a.id === view.guidelineFileAssetId) : undefined;

  async function upload(file: File) {
    const url = await fileToDataUrl(file);
    addAsset(ws.id, { type: "pdf", fileName: file.name, url, sizeKB: file.size / 1024, tags: [`dept-${view.id}`] });
    // The asset was just prepended, so it's the freshest one tagged for this department.
    const freshest = [...ws.assets].sort((a, b) => b.uploadedAt - a.uploadedAt)[0];
    setDeptGuideline(ws.id, view.id, { guidelineFileAssetId: freshest?.id });
    showToast("Guideline file uploaded.", "success");
  }

  return (
    <div className="mk-surface flex flex-col gap-3.5 rounded-2xl bg-surface-1 p-5">
      <div className="flex items-center justify-between">
        <span className="text-[15px] font-semibold">{isAr ? "محتوى الدليل" : "Guideline content"}</span>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void upload(file);
            e.target.value = "";
          }}
        />
        <Button variant="link" onClick={() => fileInputRef.current?.click()} className="text-[12px] font-semibold">
          Upload guideline file
        </Button>
      </div>
      {guidelineFile && (
        <div className="flex items-center gap-2.5 rounded-lg bg-surface-2 px-3 py-2.5">
          <Icon name="file-alt" size={14} className="text-text-faint" />
          <span className="flex-1 truncate text-[12px]">{guidelineFile.fileName}</span>
          <span className="font-mono text-[11px] text-text-faint">{formatBytes(guidelineFile.sizeKB)}</span>
          <IconButton
            icon="times"
            label="Remove file"
            onClick={() => setDeptGuideline(ws.id, view.id, { guidelineFileAssetId: undefined })}
            className="cursor-pointer text-text-faint"
          />
        </div>
      )}
      <AutoTextarea
        minRows={4}
        caretAtEnd={false}
        value={textDraft ?? view.guidelineText}
        onChange={setTextDraft}
        onBlur={() => {
          if (textDraft !== null) setDeptGuideline(ws.id, view.id, { guidelineText: textDraft.trim() });
          setTextDraft(null);
        }}
        aria-label={isAr ? `دليل قسم ${view.name}` : `Guideline text for ${view.name}`}
        placeholder={isAr ? "أو اكتب دليل هذا القسم كنص هنا…" : "…or write this department's guidelines as text here."}
        className="rounded-lg bg-surface-2 p-3 text-[14px] leading-[1.7] text-text outline-none"
      />
    </div>
  );
}
