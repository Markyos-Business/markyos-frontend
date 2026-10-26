"use client";

import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { Button, EmptyHint, Icon, IconButton } from "@/components/ui";
import type { DepartmentView, Workspace } from "@/types";
import { resolveItem, type DeptItem } from "../utils/resolveItem";
import { AddItemForm } from "./AddItemForm";

type RelevantLinksCardProps = { ws: Workspace; view: DepartmentView; isAr: boolean };

/** The strategy and guideline pieces this department should read, pulled live. */
export function RelevantLinksCard({ ws, view, isAr }: RelevantLinksCardProps) {
  const { removeDeptItem } = useApp();
  const [adding, setAdding] = useState(false);
  return (
    <div className="mk-surface flex flex-col gap-3.5 rounded-2xl bg-surface-1 p-5">
      <div className="flex items-center justify-between">
        <span className="text-[15px] font-semibold">{isAr ? "روابط ذات صلة" : "Relevant links"}</span>
        <Button variant="link" onClick={() => setAdding((v) => !v)} className="text-[12px] font-semibold">
          {adding ? "Cancel" : "+ Add"}
        </Button>
      </div>
      <p className="-mt-2 text-[12px] text-text-faint">
        Nothing here is a copy — every item is pulled live, so editing Strategy or a section updates this automatically.
      </p>

      {adding && <AddItemForm ws={ws} view={view} onDone={() => setAdding(false)} />}

      {view.items.length === 0 ? (
        <EmptyHint>Nothing selected yet.</EmptyHint>
      ) : (
        <div className="flex flex-col gap-2">
          {view.items.map((item) => (
            <LinkedItem key={item.id} ws={ws} item={item} onRemove={() => removeDeptItem(ws.id, view.id, item.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function LinkedItem({ ws, item, onRemove }: { ws: Workspace; item: DeptItem; onRemove: () => void }) {
  const { icon, title, body } = resolveItem(ws, item);
  return (
    <div className="mk-surface flex items-start gap-3 rounded-xl bg-surface-2 p-3.5">
      <Icon name={icon} size={15} className="mt-0.5 shrink-0 text-accent-text" />
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-medium">{title}</div>
        <div className="mt-0.5 text-[12px] text-text-secondary">{body}</div>
        {item.relevanceNote && <div className="mt-1 text-[11px] text-text-faint">Why: {item.relevanceNote}</div>}
      </div>
      <IconButton icon="times" label={`Remove ${title}`} onClick={onRemove} className="mk-danger-hover shrink-0 cursor-pointer text-text-faint" />
    </div>
  );
}
