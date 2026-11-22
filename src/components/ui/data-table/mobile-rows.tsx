"use client";
import { CheckboxField, CheckboxInput } from "../field/checkbox-field";
import { ActionsDropdown } from "../button/actions-dropdown";
import { Button } from "../button/button";
import { IconButton } from "../button/icon-button";
import { EditableCell } from "./editable-cell";
import { renderValue } from "./table-rows";
import type { DataTableProps } from "./types";
import type { DataTableModel } from "./use-data-table";
export function MobileRows<T>({ props, model, indices, paddingStart, paddingEnd, measure }: { props: DataTableProps<T>; model: DataTableModel<T>; indices: number[]; paddingStart: number; paddingEnd: number; measure?: (node: HTMLElement | null) => void }) {
  const { labels: l, table } = model; const columns = table.getVisibleLeafColumns().map(c => props.columns.find(col => col.key === c.id)!);
  const config = props.mobileCard || {}; const primary = columns.find(c => c.key === config.primary) ?? columns[0];
  const secondary = config.secondary ? columns.filter(c => config.secondary?.includes(c.key) && c !== primary) : columns.filter(c => c !== primary);
  // A phone card is a list row, not a form: the primary value is its one title line (or the
  // checkbox's label), the other columns a two-column grid of one-line label/value pairs.
  return <div className="flex flex-col gap-space-3 p-space-3" aria-label={props.label} style={{ paddingBlockStart: paddingStart + 12, paddingBlockEnd: paddingEnd + 12 }}>
    {props.selectable && <CheckboxField label={l.selectAll} checked={table.getIsAllPageRowsSelected()} indeterminate={table.getIsSomePageRowsSelected()} onChange={table.getToggleAllPageRowsSelectedHandler()} />}
    {indices.map(index => { const row = table.getRowModel().rows[index]; const name = props.getRowLabel?.(row.original) ?? row.id; const state = props.getRowState?.(row.original) ?? "idle";
      return <article key={row.id} ref={measure} data-index={index} data-mobile-row data-row-id={row.id} aria-label={name} tabIndex={0} data-selected={props.selectable ? row.getIsSelected() : undefined} className={`flex min-w-0 flex-col gap-space-3 rounded-card px-space-4 py-space-3 shadow-edge ${row.getIsSelected() ? "bg-accent-soft" : "bg-surface-1"}`} onKeyDown={e => { if (e.target === e.currentTarget && e.key === " " && props.selectable && row.getCanSelect()) { e.preventDefault(); row.toggleSelected(); } }}>
        <div className="flex min-h-8 items-center justify-between gap-space-3">
          {props.selectable && <span className="relative flex shrink-0"><CheckboxInput aria-label={name} checked={row.getIsSelected()} disabled={!row.getCanSelect()} onChange={row.getToggleSelectedHandler()} /></span>}
          <h3 className="min-w-0 flex-1 truncate text-body font-medium">{primary ? renderValue(row.original, primary) : name}</h3>
          {row.getCanExpand() && <IconButton size="sm" icon={row.getIsExpanded() ? "angle-up" : "angle-down"} label={row.getIsExpanded() ? l.collapse(name) : l.expand(name)} aria-expanded={row.getIsExpanded()} onClick={row.getToggleExpandedHandler()} />}
          {props.rowActions && !["disabled", "locked"].includes(state) && props.rowActions(row.original).length > 0 && <ActionsDropdown iconOnly label={l.actions(name)} items={props.rowActions(row.original)} />}
        </div>
        {row.getIsGrouped() ? <p>{String(row.getGroupingValue(row.groupingColumnId!))} ({l.groupCount(row.subRows.length)})</p> : secondary.length > 0 && <dl className="grid min-w-0 grid-cols-2 gap-x-space-5 gap-y-space-2">{secondary.map(column => <div key={column.key} className={`flex min-h-6 min-w-0 items-center gap-space-2 ${column.mobileWide ? "col-span-2" : ""}`}><dt className="shrink-0 text-caption text-text-muted">{column.header}</dt><dd className={`flex min-w-0 items-center text-caption text-text ${column.mobileWide ? "flex-wrap" : "truncate"}`}>{props.editable && props.onEdit && column.editable ? <EditableCell props={props} row={row.original} column={column} labels={l} disabled={!row.getCanSelect()} /> : renderValue(row.original, column)}</dd></div>)}</dl>}
        {row.getIsExpanded() && props.expandable && !row.getIsGrouped() && <div className="mt-space-3">{props.expandable(row.original)}</div>}
        {props.onReorderRows && <div className="flex gap-space-2"><Button size="sm" variant="secondary" onClick={() => { const i = model.data.findIndex(item => props.getRowId(item) === row.id); if (i > 0) { const next = [...model.data]; [next[i - 1], next[i]] = [next[i], next[i - 1]]; props.onReorderRows?.(next); } }}>{l.moveEarlier(name)}</Button></div>}
        {["saving", "saved", "failed"].includes(state) && <div role={state === "failed" ? "alert" : "status"} className="text-caption text-text-muted">{state === "failed" ? props.rowError?.(row.original) ?? l.failed : state === "saving" ? l.saving : l.saved}{state === "failed" && props.onRowRetry && <Button size="sm" variant="secondary" onClick={() => props.onRowRetry?.(row.original)}>{l.retry}</Button>}</div>}
      </article>;
    })}
  </div>;
}
