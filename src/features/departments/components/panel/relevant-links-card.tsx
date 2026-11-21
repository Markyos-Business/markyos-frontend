"use client";

import { useState } from "react";
import { useAppActions } from "@/contexts/AppContext";
import { ActionsDropdown, Button, EmptyHint, Icon, useDialog } from "@/components/ui";
import type { DepartmentView, Workspace } from "@/types";
import { resolveItem, type DeptItem } from "../../utils/resolve-item";
import { AddItemForm } from "./add-item-form";

type RelevantLinksCardProps = { ws: Workspace; view: DepartmentView; isAr: boolean };

/** The strategy and guideline pieces this department should read, pulled live. */
export function RelevantLinksCard({ ws, view, isAr }: RelevantLinksCardProps) {
  const { removeDeptItem } = useAppActions();
  const [adding, setAdding] = useState(false);
  return (
    <div className="mk-surface flex flex-col gap-3.5 rounded-card bg-surface-1 p-5">
      <div className="flex items-center justify-between">
        <span className="text-[15px] font-semibold">{isAr ? "روابط ذات صلة" : "Relevant links"}</span>
        <Button variant="ghost" onClick={() => setAdding((v) => !v)} className="text-[12px] font-semibold">
          {adding ? (isAr ? "إلغاء" : "Cancel") : isAr ? "+ إضافة" : "+ Add"}
        </Button>
      </div>
      <p className="-mt-2 text-[12px] text-text-faint">
        {isAr
          ? "لا شيء هنا نسخة؛ كل عنصر يُسحب مباشرة، فتعديل الاستراتيجية أو أي قسم يحدّث هذا تلقائيًا."
          : "Nothing here is a copy — every item is pulled live, so editing Strategy or a section updates this automatically."}
      </p>

      {adding && <AddItemForm ws={ws} view={view} isAr={isAr} onDone={() => setAdding(false)} />}

      {view.items.length === 0 ? (
        <EmptyHint>{isAr ? "لم يُختر شيء بعد." : "Nothing selected yet."}</EmptyHint>
      ) : (
        <div className="flex flex-col gap-2">
          {view.items.map((item) => (
            <LinkedItem key={item.id} ws={ws} item={item} isAr={isAr} onRemove={() => removeDeptItem(ws.id, view.id, item.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function LinkedItem({ ws, item, isAr, onRemove }: { ws: Workspace; item: DeptItem; isAr: boolean; onRemove: () => void }) {
  const { icon, title, body } = resolveItem(ws, item, isAr);
  const { confirm } = useDialog();
  const remove = async () => {
    const ok = await confirm({
      title: isAr ? `إزالة ${title}؟` : `Remove ${title}?`,
      body: isAr ? "يُزال من هذا القسم فقط؛ الأصل في الاستراتيجية أو الدليل يبقى كما هو." : "It leaves this department only; the original in Strategy or the guideline stays as it is.",
      confirmLabel: isAr ? "إزالة" : "Remove",
      tone: "danger",
      isAr,
    });
    if (ok) onRemove();
  };
  return (
    <div className="mk-surface flex items-start gap-ctl-row rounded-card bg-surface-2 p-3.5">
      <Icon name={icon} size={15} className="mt-0.5 shrink-0 text-accent-text" />
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-medium">{title}</div>
        <div className="mt-0.5 text-[12px] text-text-secondary">{body}</div>
        {item.relevanceNote && <div className="mt-1 text-[11px] text-text-faint">Why: {item.relevanceNote}</div>}
      </div>
      <ActionsDropdown
        iconOnly
        size="sm"
        label={isAr ? `إجراءات ${title}` : `${title} actions`}
        items={[{ label: isAr ? "إزالة من القسم" : "Remove from department", icon: "trash", tone: "danger", onSelect: () => void remove() }]}
      />
    </div>
  );
}
