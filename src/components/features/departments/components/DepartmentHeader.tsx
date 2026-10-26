"use client";

import { useApp } from "@/contexts/AppContext";
import { IconButton, useDialog, useToast } from "@/components/ui";
import type { DepartmentView, Workspace } from "@/types";

type DepartmentHeaderProps = { ws: Workspace; view: DepartmentView; isAr: boolean };

/** The department's name, with rename and delete. */
export function DepartmentHeader({ ws, view, isAr }: DepartmentHeaderProps) {
  const { renameDepartmentView, removeDepartmentView } = useApp();
  const { showToast } = useToast();
  const { confirm, prompt } = useDialog();

  async function rename() {
    const name = await prompt({
      title: isAr ? "إعادة تسمية القسم" : "Rename department",
      label: isAr ? "اسم القسم" : "Department name",
      initialValue: view.name,
      confirmLabel: isAr ? "حفظ" : "Save",
      isAr,
    });
    if (name) renameDepartmentView(ws.id, view.id, name);
  }

  /**
   * Deleting a department takes the guideline text and the curated list with
   * it, and nothing in the product restores it — so it asks first.
   */
  async function remove() {
    const ok = await confirm({
      title: isAr ? `حذف ${view.name}؟` : `Delete ${view.name}?`,
      body: isAr ? "تُحذف إرشادات هذا القسم والعناصر المرتبطة به. لا يمكن التراجع." : "Its guideline text, uploaded file and curated list go with it. This can't be undone.",
      confirmLabel: isAr ? "حذف" : "Delete",
      tone: "danger",
      isAr,
    });
    if (!ok) return;
    removeDepartmentView(ws.id, view.id);
    showToast("Department removed.");
  }

  return (
    <div className="flex items-center justify-between">
      <h1 className="font-display text-[26px] font-semibold tracking-tight">{view.name}</h1>
      {/*
       * The delete is a named bin, set apart from the rename by a rule, and it
       * turns the warning colour under the pointer: the most destructive
       * control on the page must not be the twin of the most harmless one.
       */}
      <div className="flex items-center gap-2">
        <IconButton
          icon="pen"
          label={isAr ? `أعد تسمية ${view.name}` : `Rename ${view.name}`}
          title={isAr ? "إعادة التسمية" : "Rename"}
          onClick={() => void rename()}
          className="cursor-pointer text-text-faint"
        />
        <span aria-hidden className="mx-1 h-4 w-px bg-hairline-strong" />
        <IconButton
          icon="trash"
          label={isAr ? `احذف قسم ${view.name}` : `Delete the ${view.name} department`}
          title={isAr ? "حذف القسم" : "Delete department"}
          onClick={() => void remove()}
          className="mk-danger-hover cursor-pointer text-text-faint"
        />
      </div>
    </div>
  );
}
