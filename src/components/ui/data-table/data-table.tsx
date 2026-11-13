"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Button } from "../button/button";
import { Icon } from "../icon";
import { EmptyState } from "../empty-state/empty-state";
import { Skeleton } from "../skeleton";
import { Progress } from "../progress";
import { CheckboxInput } from "../field/checkbox-field";
import { Select } from "../select/select";
import { TablePagination } from "../table/table-pagination";
import { TableToolbar } from "./table-toolbar";
import { TableRow, columnStyle } from "./table-rows";
import { MobileRows } from "./mobile-rows";
import { moveItem } from "./model";
import { useDataTable } from "./use-data-table";
import type { DataTableProps } from "./types";
const subscribe = (notify: () => void) => { const media = matchMedia("(width < 720px)"); media.addEventListener("change", notify); return () => media.removeEventListener("change", notify); };

/** One table pipeline for client/server paging, selection, filtering and grouping. */
export function DataTable<T>(props: DataTableProps<T>) {
  const model = useDataTable(props); const { table, labels: l } = model;
  const scroll = useRef<HTMLDivElement>(null); const sentinel = useRef<HTMLDivElement>(null);
  const [bulk, setBulk] = useState<string | null>(null); const [bulkFailed, setBulkFailed] = useState(false); const [overflow, setOverflow] = useState(false);
  const narrow = useSyncExternalStore(subscribe, () => matchMedia("(width < 720px)").matches, () => false);
  const cards = narrow && props.mobileCard !== false; const rows = table.getRowModel().rows;
  const loading = props.state === "loading" || (!!props.loading && !model.data.length);
  const error = props.state === "error" || !!props.error; const denied = props.state === "no-permission";
  const empty = props.state === "empty" || !rows.length;
  const virtualConfig = typeof props.virtualized === "object" ? props.virtualized : {};
  // eslint-disable-next-line react-hooks/incompatible-library -- virtualizer's measured rows are rendered directly, not memoized
  const virtual = useVirtualizer({ count: rows.length, getScrollElement: () => scroll.current, estimateSize: () => virtualConfig.estimateSize ?? (cards ? 240 : model.density === "compact" ? 42 : 64), overscan: 6, enabled: !!props.virtualized, getItemKey: i => rows[i]?.id ?? i });
  const virtualRows = virtual.getVirtualItems(); const first = virtualRows[0]?.start ?? 0;
  const last = virtualRows.at(-1)?.end ?? 0; const indices = props.virtualized ? virtualRows.map(item => item.index) : rows.map((_, i) => i);
  const prefix = Number(!!props.selectable) + Number(!!(props.expandable || props.getSubRows || props.groupBy)) + Number(!!props.onReorderRows);
  const columns = table.getVisibleLeafColumns(); const colSpan = columns.length + prefix + Number(!!(props.rowActions || props.rowHoverActions));
  useEffect(() => {
    const element = scroll.current; if (!element) return;
    const update = () => setOverflow(element.scrollWidth > element.clientWidth + 1);
    const observer = new ResizeObserver(update); observer.observe(element); update(); return () => observer.disconnect();
  }, [cards, columns.length, rows.length]);
  const load = props.infinite?.onLoadMore; const more = props.infinite?.hasMore; const pending = props.infinite?.loading;
  useEffect(() => {
    if (!props.infinite?.auto || !more || pending || !sentinel.current) return;
    const observer = new IntersectionObserver(entries => { if (entries.some(entry => entry.isIntersecting)) load?.(); }, { root: scroll.current, rootMargin: "100px" });
    observer.observe(sentinel.current); return () => observer.disconnect();
  }, [props.infinite?.auto, more, pending, load, rows.length]);
  const noResults = !!model.search || !!model.filters.length;
  const message = denied ? l.noPermission : error ? props.error || l.error : noResults ? l.noResults(model.search || model.filters.map(filter => String(filter.value)).join(", ")) : l.empty;
  async function runBulk(action: { label: string; progressLabel?: (count: number) => string; onSelect: (context: typeof model.bulkContext) => void | Promise<void> }) {
    setBulk(action.progressLabel?.(model.count) ?? action.label); setBulkFailed(false);
    try { await action.onSelect(model.bulkContext); model.resetSelection(); } catch { setBulkFailed(true); } finally { setBulk(null); }
  }
  return <section dir={props.dir} data-data-table data-density={model.density} aria-label={props.label ?? "Data table"} aria-busy={loading || props.state === "refetching" || pending || !!bulk}
    className={`min-w-0 overflow-hidden rounded-card bg-surface-1 text-text shadow-edge ${props.className ?? ""}`}>
    {props.state === "stale" && <p role="status" className="bg-warning-soft p-space-4 text-body text-text">{l.stale}</p>}
    {!denied && <TableToolbar props={props} model={model} />}
    {model.count > 0 && props.selectable && <div role="region" aria-label={l.selected(model.count)} aria-busy={!!bulk} className="flex flex-wrap items-center gap-space-3 bg-accent-soft p-space-4">
      <span className="text-body font-medium">{l.selected(model.count)}</span>
      <fieldset disabled={!!bulk} className="flex min-w-0 flex-wrap items-center gap-space-3">
        {!model.scope.allMatching && model.count < model.selectableTotal && <Button size="xs" variant="outline" onClick={model.selectMatching}>{l.selectAllMatching(model.selectableTotal)}</Button>}
        {Array.isArray(props.bulkActions) ? props.bulkActions.map(action => <Button key={action.label} size="xs" onClick={() => runBulk(action)}>{action.label}</Button>) : props.bulkActions?.(model.ids, model.resetSelection, model.bulkContext)}
        <Button size="xs" variant="outline" onClick={model.resetSelection}>{l.clearSelection}</Button>
      </fieldset>
      {bulk && <span role="status" className="text-body">{bulk}</span>}{bulkFailed && <span role="alert" className="text-body text-danger">{l.failed}</span>}
    </div>}
    {props.state === "refetching" && <Progress label={l.results(model.total)} />}
    <div className="relative min-w-0">
      {overflow && <><span aria-hidden className="pointer-events-none absolute inset-y-0 start-0 z-20 w-3 bg-gradient-to-r from-surface-1 to-transparent rtl:rotate-180" /><span aria-hidden className="pointer-events-none absolute inset-y-0 end-0 z-20 w-3 bg-gradient-to-l from-surface-1 to-transparent rtl:rotate-180" /></>}
      <div ref={scroll} tabIndex={0} aria-label={props.label ?? "Data table"} className={`relative max-w-full overflow-auto ${props.virtualized ? "" : props.stickyHeader !== false ? "max-h-[70vh]" : ""}`} style={props.virtualized ? { height: virtualConfig.height ?? 480 } : undefined}>
        {(error || denied || (empty && !loading)) ? !error && !denied && !noResults && props.empty ? props.empty : <div role={error ? "alert" : "status"}><EmptyState icon={denied ? "lock" : error ? "exclamation-circle" : "inbox"} title={message} description="" action={error && props.onRetry ? <Button onClick={props.onRetry}>{l.retry}</Button> : noResults ? <Button onClick={() => { table.resetColumnFilters(true); table.setGlobalFilter(""); }}>{l.clearFilters}</Button> : denied ? undefined : props.emptyAction} /></div>
        : cards && !loading ? <MobileRows props={props} model={model} indices={indices} paddingStart={props.virtualized ? first : 0} paddingEnd={props.virtualized ? virtual.getTotalSize() - last : 0} measure={props.virtualized ? virtual.measureElement : undefined} />
        : <table aria-label={props.label ?? "Data table"} aria-rowcount={model.total + 1} aria-busy={loading || props.state === "refetching"} className="w-full border-collapse text-start text-body" style={{ minWidth: table.getTotalSize() + prefix * 48 + (props.rowActions ? 72 : 0) }}>
          <thead className={props.stickyHeader !== false ? "sticky top-0 z-20 bg-surface-2" : "bg-surface-2"}><tr>
            {props.onReorderRows && <th className="w-12"><span className="sr-only">{l.moveRow}</span></th>}
            {props.selectable && <th scope="col" className="w-12 px-space-4"><CheckboxInput aria-label={l.selectAll} checked={table.getIsAllPageRowsSelected()} indeterminate={table.getIsSomePageRowsSelected()} onChange={table.getToggleAllPageRowsSelectedHandler()} disabled={loading} /></th>}
            {(props.expandable || props.getSubRows || props.groupBy) && <th className="w-12"><span className="sr-only">{l.expand(props.label ?? "")}</span></th>}
            {columns.map((column, i) => { const definition = props.columns.find(c => c.key === column.id)!; const sorted = column.getIsSorted(); return <th key={column.id} scope="col" aria-sort={sorted ? sorted === "asc" ? "ascending" : "descending" : undefined} style={columnStyle(definition, i, props, column.getSize())}
              className={`relative bg-surface-2 px-space-4 py-space-3 text-start text-caption font-medium text-text-muted ${definition.className ?? ""}`}
              draggable={props.reorderColumns} onDragStart={event => event.dataTransfer.setData("markyos-column", column.id)} onDragOver={event => { if (props.reorderColumns) event.preventDefault(); }} onDrop={event => { const id = event.dataTransfer.getData("markyos-column"); const order = table.getAllLeafColumns().map(c => c.id); if (id && props.reorderColumns) { event.preventDefault(); table.setColumnOrder(moveItem(order, order.indexOf(id), order.indexOf(column.id))); } }}>
              {column.getCanSort() ? <button type="button" onClick={column.getToggleSortingHandler()} className="mk-tap inline-flex min-h-8 items-center gap-space-2 text-start">{definition.header}<Icon name={sorted ? "sort-up" : "sort"} size={16} className={sorted === "desc" ? "rotate-180" : ""} />{sorted && table.getState().sorting.length > 1 && <span>{column.getSortIndex() + 1}</span>}</button> : definition.hideHeader ? <span className="sr-only">{definition.header}</span> : definition.header}
              {props.resizable && <span role="separator" aria-orientation="vertical" aria-label={l.resize(definition.header)} aria-valuenow={column.getSize()} aria-valuemin={column.columnDef.minSize} tabIndex={0}
                className="absolute inset-y-0 end-0 w-2 cursor-col-resize touch-none hover:bg-accent-soft focus-visible:bg-accent-soft" onMouseDown={table.getFlatHeaders().find(header => header.column.id === column.id)?.getResizeHandler()} onTouchStart={table.getFlatHeaders().find(header => header.column.id === column.id)?.getResizeHandler()} onDoubleClick={() => column.resetSize()}
                onKeyDown={event => { if (["ArrowLeft", "ArrowRight"].includes(event.key)) { event.preventDefault(); const rtl = getComputedStyle(event.currentTarget).direction === "rtl"; const step = (event.key === "ArrowRight" ? 10 : -10) * (rtl ? -1 : 1); table.setColumnSizing(prev => ({ ...prev, [column.id]: Math.max(column.columnDef.minSize ?? 100, column.getSize() + step) })); } }} />}
            </th>; })}
            {(props.rowActions || props.rowHoverActions) && <th className={`bg-surface-2 ${props.stickyColumns?.actions ? "sticky end-0" : ""}`}><span className="sr-only">{l.actions(props.label ?? "")}</span></th>}
          </tr></thead>
          <tbody>{loading ? Array.from({ length: 5 }, (_, i) => <tr key={i}>{Array.from({ length: colSpan }, (_, j) => <td key={j} className="px-space-4 py-space-4"><Skeleton /></td>)}</tr>) : <>
            {props.virtualized && first > 0 && <tr aria-hidden><td colSpan={colSpan} style={{ height: first, padding: 0 }} /></tr>}
            {indices.map(index => rows[index] && <TableRow key={rows[index].id} index={index} row={rows[index]} props={props} model={model} measure={props.virtualized ? virtual.measureElement : undefined} />)}
            {props.virtualized && virtual.getTotalSize() - last > 0 && <tr aria-hidden><td colSpan={colSpan} style={{ height: virtual.getTotalSize() - last, padding: 0 }} /></tr>}
            {pending && <tr><td colSpan={colSpan} className="p-space-4"><span role="status" className="inline-flex items-center gap-space-3 text-body"><Icon name="circle-notch" size={18} className="animate-spin motion-reduce:animate-none" />{l.loadingMore}</span></td></tr>}
          </>}</tbody>
        </table>}
        {props.infinite && !denied && !error && <div ref={sentinel} className="flex justify-center p-space-4"><Button variant="outline" disabled={pending || !more} onClick={load}>{pending ? l.loadingMore : l.loadMore}</Button></div>}
      </div>
    </div>
    {model.paginated && !error && !denied && !loading && model.total > 0 && (props.paging || model.total > (props.pageSizes?.[0] ?? 20)) && <div className="min-w-0 shadow-rule-t">
      <div className="flex flex-wrap items-center justify-between gap-space-4 px-space-4 py-space-2"><span className="text-caption text-text-muted" dir="auto">{l.range(model.pagination.pageIndex * model.pagination.pageSize + 1, model.pagination.pageIndex * model.pagination.pageSize + rows.filter(row => !row.getIsGrouped()).length, model.total)}</span>
        <Select aria-label={l.pageSize} value={String(model.pagination.pageSize)} options={(props.pageSizes ?? [20, 50, 100]).map(size => ({ value: String(size), label: String(size) }))} onValueChange={value => table.setPagination({ pageIndex: 0, pageSize: Number(value) })} />
      </div>
      <TablePagination currentPage={model.pagination.pageIndex + 1} itemsPerPage={model.pagination.pageSize} itemCount={Math.min(model.pagination.pageSize, model.total - model.pagination.pageIndex * model.pagination.pageSize)} totalCount={model.total} itemLabel={props.itemLabel ?? "rows"} onPageChange={page => table.setPageIndex(page - 1)} loading={!!props.loading} labels={props.paginationLabels} />
    </div>}
    <span role="status" aria-live="polite" className="sr-only">{denied ? "" : `${props.selectable ? l.selected(model.count) : ""} ${loading ? l.loadingMore : l.results(model.total)}`}</span>
  </section>;
}
