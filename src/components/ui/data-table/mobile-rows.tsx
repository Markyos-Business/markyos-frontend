"use client";
import { CheckboxField } from "../field/checkbox-field";
import { ActionsDropdown } from "../button/actions-dropdown";
import { Button } from "../button/button";
import { EditableCell } from "./editable-cell";
import { renderValue } from "./table-rows";
import type { DataTableProps } from "./types";
import type { DataTableModel } from "./use-data-table";
export function MobileRows<T>({ props, model, indices, paddingStart, paddingEnd, measure }: { props: DataTableProps<T>; model: DataTableModel<T>; indices: number[]; paddingStart: number; paddingEnd: number; measure?: (node: HTMLElement | null) => void }) {
  const { labels: l, table } = model; const columns = table.getVisibleLeafColumns().map(c => props.columns.find(col => col.key === c.id)!);
  const config = props.mobileCard || {}; const primary = columns.find(c => c.key === config.primary) ?? columns[0];
  const secondary = config.secondary ? columns.filter(c => config.secondary?.includes(c.key)) : columns.filter(c => c !== primary);
  return <div className="flex flex-col gap-space-3 p-space-3" aria-label={props.label} style={{ paddingBlockStart: paddingStart + 12, paddingBlockEnd: paddingEnd + 12 }}>
    {props.selectable && <CheckboxField label={l.selectAll} checked={table.getIsAllPageRowsSelected()} indeterminate={table.getIsSomePageRowsSelected()} onChange={table.getToggleAllPageRowsSelectedHandler()} />}
    {indices.map(index => { const row = table.getRowModel().rows[index]; const name = props.getRowLabel?.(row.original) ?? row.id; const state = props.getRowState?.(row.original) ?? "idle";
      return <article key={row.id} ref={measure} data-index={index} data-mobile-row data-row-id={row.id} aria-label={name} tabIndex={0} data-selected={props.selectable ? row.getIsSelected() : undefined} className={`min-w-0 rounded-card p-space-4 shadow-edge ${row.getIsSelected() ? "bg-accent-soft" : "bg-surface-1"}`} onKeyDown={e => { if (e.target === e.currentTarget && e.key === " " && props.selectable && row.getCanSelect()) { e.preventDefault(); row.toggleSelected(); } }}>
        <div className="flex items-start justify-between gap-space-3">
          {props.selectable && <CheckboxField label={name} checked={row.getIsSelected()} disabled={!row.getCanSelect()} onChange={row.getToggleSelectedHandler()} />}
          {!props.selectable && <h3 className="min-w-0 truncate font-medium">{name}</h3>}
          {props.rowActions && !["disabled", "locked"].includes(state) && <ActionsDropdown iconOnly label={l.actions(name)} items={props.rowActions(row.original)} />}
        </div>
        {row.getIsGrouped() ? <p>{String(row.getGroupingValue(row.groupingColumnId!))} ({l.groupCount(row.subRows.length)})</p> : <dl className="flex min-w-0 flex-col gap-space-3">{[primary, ...secondary].filter(Boolean).map(column => <div key={column.key} className="min-w-0"><dt className="text-caption text-text-muted">{column.header}</dt><dd className="min-w-0 break-words text-body">{props.editable && props.onEdit && column.editable ? <EditableCell props={props} row={row.original} column={column} labels={l} disabled={!row.getCanSelect()} /> : renderValue(row.original, column)}</dd></div>)}</dl>}
        {row.getCanExpand() && <Button size="xs" variant="outline" onClick={row.getToggleExpandedHandler()} aria-expanded={row.getIsExpanded()}>{row.getIsExpanded() ? l.collapse(name) : l.expand(name)}</Button>}
        {row.getIsExpanded() && props.expandable && !row.getIsGrouped() && <div className="mt-space-3">{props.expandable(row.original)}</div>}
        {props.onReorderRows && <div className="flex gap-space-2"><Button size="xs" variant="outline" onClick={() => { const i = model.data.findIndex(item => props.getRowId(item) === row.id); if (i > 0) { const next = [...model.data]; [next[i - 1], next[i]] = [next[i], next[i - 1]]; props.onReorderRows?.(next); } }}>{l.moveEarlier(name)}</Button></div>}
        {["saving", "saved", "failed"].includes(state) && <div role={state === "failed" ? "alert" : "status"} className="text-caption text-text-muted">{state === "failed" ? props.rowError?.(row.original) ?? l.failed : state === "saving" ? l.saving : l.saved}{state === "failed" && props.onRowRetry && <Button size="xs" variant="outline" onClick={() => props.onRowRetry?.(row.original)}>{l.retry}</Button>}</div>}
      </article>;
    })}
  </div>;
}
