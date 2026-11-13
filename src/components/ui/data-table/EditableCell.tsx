"use client";
import { useEffect, useState } from "react";
import { Button } from "../buttons/Button";
import { Select } from "../select/Select";
import { InputField } from "../../form/fields/InputField";
import type { DataColumn, DataTableProps, TableLabels } from "./types";
export function EditableCell<T>({ row, column, props, labels, disabled }: { row: T; column: DataColumn<T>; props: DataTableProps<T>; labels: TableLabels; disabled: boolean }) {
  const value = String(column.value?.(row) ?? column.sortValue?.(row) ?? (row as Record<string, unknown>)[column.key] ?? "");
  const [editing, setEditing] = useState(false); const [draft, setDraft] = useState(value); const [status, setStatus] = useState<"idle" | "saving" | "saved" | "failed">("idle");
  useEffect(() => { if (status !== "saved") return; const timer = setTimeout(() => setStatus("idle"), 1600); return () => clearTimeout(timer); }, [status]);
  async function save() { setStatus("saving"); try { await props.onEdit?.(row, column.key, draft); setStatus("saved"); setEditing(false); } catch { setStatus("failed"); } }
  return <div className="min-w-0" data-cell-state={status} onClick={e => e.stopPropagation()}>
    {editing ? <div className="flex flex-col gap-space-2" onKeyDown={e => { if (e.key === "Escape") { e.stopPropagation(); setEditing(false); setDraft(value); setStatus("idle"); } if (e.key === "Enter" && column.editable !== "select") { e.preventDefault(); save(); } }}>
      {column.editable === "select" ? <Select label={column.header} options={column.editOptions ?? []} value={draft} onValueChange={setDraft} disabled={status === "saving"} /> : <InputField size="sm" aria-label={column.header} type={column.editable === "date" ? "date" : "text"} value={draft} onChange={e => setDraft(e.target.value)} disabled={status === "saving"} />}
      <div className="flex gap-space-2"><Button size="xs" onClick={save} disabled={status === "saving"}>{labels.save}</Button><Button size="xs" variant="outline" disabled={status === "saving"} onClick={() => { setEditing(false); setDraft(value); setStatus("idle"); }}>{labels.cancel}</Button></div>
    </div> : <button type="button" className="mk-tap min-h-8 max-w-full truncate text-start" aria-label={labels.edit(column.header)} disabled={disabled} onClick={() => { setDraft(value); setEditing(true); }}>{column.cell?.(row) ?? value}</button>}
    <span role={status === "failed" ? "alert" : "status"} className={status === "idle" ? "sr-only" : `block text-caption ${status === "failed" ? "text-danger" : "text-text-muted"}`}>{status === "saving" ? labels.saving : status === "saved" ? labels.saved : status === "failed" ? labels.failed : ""}</span>
  </div>;
}
