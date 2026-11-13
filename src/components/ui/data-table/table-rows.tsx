"use client";
import { Fragment, type CSSProperties, type KeyboardEvent } from "react";
import type { Row } from "@tanstack/react-table";
import { CheckboxInput } from "../field/checkbox-field";
import { ActionsDropdown } from "../button/actions-dropdown";
import { Button } from "../button/button";
import { Icon } from "../icon";
import { EditableCell } from "./editable-cell";
import { moveItem } from "./model";
import type { DataColumn, DataTableProps } from "./types";
import type { DataTableModel } from "./use-data-table";
export function columnStyle<T>(column: DataColumn<T>, index: number, props: DataTableProps<T>, width: number): CSSProperties {
  return { width, minWidth: width, ...(props.stickyColumns?.first && index === 0 ? { position: "sticky", insetInlineStart: 0, zIndex: 1 } : {}) };
}
export function renderValue<T>(row: T, column: DataColumn<T>) {
  if (column.media) { const media = column.media(row); return <span className="flex items-center gap-space-3">
    {/* eslint-disable-next-line @next/next/no-img-element -- caller-owned media thumbnail */}
    {media.src && <img src={media.src} alt="" width={40} height={40} className="size-10 shrink-0 rounded-md object-cover" />}
    <span className="min-w-0"><span className="block truncate font-medium">{media.name}</span>{media.meta && <span className="block truncate text-caption text-text-muted">{media.meta}</span>}</span>
  </span>; }
  return column.cell?.(row) ?? String(column.value?.(row) ?? column.sortValue?.(row) ?? (row as Record<string, unknown>)[column.key] ?? "");
}
export function TableRow<T>({ row, props, model, measure, index }: { row: Row<T>; props: DataTableProps<T>; model: DataTableModel<T>; measure?: (node: HTMLTableRowElement | null) => void; index: number }) {
  const { labels: l } = model; const state = props.getRowState?.(row.original) ?? "idle"; const disabled = state === "locked" || state === "disabled";
  const name = props.getRowLabel?.(row.original) ?? row.id;
  const columns = model.table.getVisibleLeafColumns().map(c => props.columns.find(col => col.key === c.id)!);
  const span = columns.length + (props.selectable ? 1 : 0) + (props.expandable || props.getSubRows || props.groupBy ? 1 : 0) + (props.rowActions || props.rowHoverActions ? 1 : 0) + (props.onReorderRows ? 1 : 0);
  const padding = model.density === "compact" ? "px-space-4 py-space-2" : "px-space-6 py-space-4";
  function key(event: KeyboardEvent<HTMLTableRowElement>) {
    if (event.target !== event.currentTarget) return;
    if (event.key === " " && props.selectable && !disabled) { event.preventDefault(); row.toggleSelected(); }
    if (event.key === "Enter" && !disabled) props.onRowClick?.(row.original);
    if (["ArrowUp", "ArrowDown"].includes(event.key)) { event.preventDefault(); const rows = Array.from(event.currentTarget.parentElement!.querySelectorAll<HTMLTableRowElement>('tr[data-data-row]')); rows[rows.indexOf(event.currentTarget) + (event.key === "ArrowDown" ? 1 : -1)]?.focus(); }
  }
  const reorder = (to: number) => { const from = model.data.findIndex(item => props.getRowId(item) === row.id); props.onReorderRows?.(moveItem(model.data, from, to)); };
  const rowIndex = model.data.findIndex(item => props.getRowId(item) === row.id);
  return <Fragment>
    <tr ref={measure} data-index={index} data-data-row data-row-state={state} data-row-id={row.id} tabIndex={0} aria-selected={props.selectable ? row.getIsSelected() : undefined} aria-disabled={disabled || undefined} aria-busy={state === "saving"}
      onKeyDown={key} onClick={event => { if (!disabled && !(event.target as HTMLElement).closest("button,input,select,a")) props.onRowClick?.(row.original); }}
      onDragOver={event => { if (props.onReorderRows && !disabled) event.preventDefault(); }} onDrop={event => { const from = model.data.findIndex(item => props.getRowId(item) === event.dataTransfer.getData("markyos-row")); if (props.onReorderRows && from >= 0 && !disabled) { event.preventDefault(); props.onReorderRows(moveItem(model.data, from, rowIndex)); } }}
      className={`group border-b border-hairline text-body transition-colors duration-[120ms] hover:bg-surface-highlight focus-visible:bg-surface-highlight motion-reduce:transition-none ${row.getIsSelected() ? "bg-accent-soft" : ["highlighted", "unread"].includes(state) ? "bg-info-soft" : "bg-surface-1"} ${disabled ? "text-text-disabled" : "text-text"}`}>
      {props.onReorderRows && <td className={padding}><button type="button" draggable={!disabled} disabled={disabled} className="mk-tap flex size-8 items-center justify-center" aria-label={`${l.moveRow}: ${name}`} onDragStart={event => event.dataTransfer.setData("markyos-row", row.id)} onKeyDown={event => { if (["ArrowUp", "ArrowDown"].includes(event.key)) { event.preventDefault(); event.stopPropagation(); reorder(rowIndex + (event.key === "ArrowUp" ? -1 : 1)); } }}><Icon name="bars" size={16} /></button></td>}
      {props.selectable && <td className={padding}><CheckboxInput aria-label={l.selectRow(name)} checked={row.getIsSelected()} disabled={!row.getCanSelect()} onChange={row.getToggleSelectedHandler()} /></td>}
      {(props.expandable || props.getSubRows || props.groupBy) && <td className={padding}>{row.getCanExpand() && <button type="button" className="mk-tap flex size-8 items-center justify-center" aria-label={row.getIsExpanded() ? l.collapse(name) : l.expand(name)} aria-expanded={row.getIsExpanded()} onClick={row.getToggleExpandedHandler()}><Icon name={row.getIsExpanded() ? "angle-down" : "angle-right"} size={18} /></button>}</td>}
      {columns.map((column, i) => <td key={column.key} style={columnStyle(column, i, props, model.table.getColumn(column.key)!.getSize())} className={`${padding} max-w-96 ${props.stickyColumns?.first && i === 0 ? row.getIsSelected() ? "bg-accent-soft" : "bg-surface-1" : ""} ${column.className ?? ""}`}>
        {row.getIsGrouped() ? i === 0 ? <span className="font-medium">{String(row.getGroupingValue(row.groupingColumnId!))} <span className="text-text-muted">({l.groupCount(row.subRows.length)})</span></span> : null : props.editable && props.onEdit && column.editable ? <EditableCell row={row.original} column={column} props={props} labels={l} disabled={disabled} /> : renderValue(row.original, column)}
      </td>)}
      {(props.rowActions || props.rowHoverActions) && <td className={`${padding} bg-surface-1 ${props.stickyColumns?.actions ? "sticky end-0 z-10" : ""}`}>
        {!row.getIsGrouped() && <div className="flex items-center justify-end gap-space-2" aria-disabled={disabled || undefined} inert={disabled}>
          {props.rowHoverActions && <div className="opacity-100 transition-opacity duration-[120ms] min-[720px]:opacity-0 min-[720px]:group-hover:opacity-100 min-[720px]:group-focus-within:opacity-100">{props.rowHoverActions(row.original)}</div>}
          {props.rowActions && <ActionsDropdown iconOnly label={l.actions(name)} items={props.rowActions(row.original)} />}
        </div>}
      </td>}
    </tr>
    {state !== "idle" && ["saving", "saved", "failed"].includes(state) && <tr><td colSpan={span} className="px-space-6 py-space-2"><span role={state === "failed" ? "alert" : "status"} className={`text-caption ${state === "failed" ? "text-danger" : "text-text-muted"}`}>{state === "saving" ? l.saving : state === "saved" ? l.saved : props.rowError?.(row.original) ?? l.failed}</span>{state === "failed" && props.onRowRetry && <Button size="xs" variant="outline" onClick={() => props.onRowRetry?.(row.original)}>{l.retry}</Button>}</td></tr>}
    {row.getIsExpanded() && props.expandable && !row.getIsGrouped() && <tr><td colSpan={span} className="bg-surface-2 p-space-6">{props.expandable(row.original)}</td></tr>}
  </Fragment>;
}
