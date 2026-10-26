"use client";

import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { Switch } from "@/components/ui";
import type { Workspace } from "@/types";
import { DepartmentHeader } from "./DepartmentHeader";
import { GuidelineContentCard } from "./GuidelineContentCard";
import { ImportInstructionsModal } from "./ImportInstructionsModal";
import { InstructionEditor } from "./InstructionEditor";
import { RelevantLinksCard } from "./RelevantLinksCard";

/** Editing one department: its name, whether it is published, its instructions, guideline and links. */
export function DepartmentPanel({ ws, viewId }: { ws: Workspace; viewId: string }) {
  const { setDeptPublish, uiLang } = useApp();
  const [importOpen, setImportOpen] = useState(false);
  const view = ws.departmentViews.find((d) => d.id === viewId);
  if (!view) return null;
  const isAr = uiLang(ws) === "ar";
  const publishLabel = isAr ? "انشر في موقع الدليل" : "Publish to the guideline site";

  return (
    <div className="flex flex-col gap-5">
      <DepartmentHeader ws={ws} view={view} isAr={isAr} />

      {/* Whether this page reaches the client-facing site. A department page is
          often internal, so publishing is a decision rather than a default
          consequence of writing one. */}
      <div className="mk-surface flex items-center gap-4 rounded-2xl bg-surface-1 px-5 py-4">
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-medium">{publishLabel}</div>
          <div className="mt-0.5 text-[12px] text-text-faint">
            {view.publishToSite
              ? isAr
                ? "يظهر هذا القسم للعميل ضمن قسم «الأقسام»."
                : "This page appears to the client under the Departments section."
              : isAr
                ? "داخلي فقط — لا يظهر للعميل."
                : "Internal only — the client never sees it."}
          </div>
        </div>
        <Switch label={publishLabel} checked={view.publishToSite} onToggle={() => setDeptPublish(ws.id, view.id, !view.publishToSite)} />
      </div>

      <InstructionEditor ws={ws} view={view} onImport={() => setImportOpen(true)} />
      {importOpen && <ImportInstructionsModal ws={ws} view={view} onClose={() => setImportOpen(false)} />}

      <GuidelineContentCard ws={ws} view={view} isAr={isAr} />
      <RelevantLinksCard ws={ws} view={view} isAr={isAr} />
    </div>
  );
}
