"use client";

import { useMemo, useState, type KeyboardEvent, type ReactNode } from "react";
import { ActionsDropdown, type ActionItem } from "../buttons/ActionsDropdown";
import { ErrorState } from "../empty/ErrorState";
import { useUiStrings } from "../i18n/uiStrings";
import { BulkBar, DataTableFooter, SortHeader, checkboxClasses, type SortState } from "./DataTableParts";
import { TableLoadingRow, cellClasses, rowClasses } from "./Table";

type DataColumn<T> = {
  key: string;
  header: string;
  /** Keep the header for screen readers only, e.g. over a column of buttons. Default false. */
  hideHeader?: boolean;
  cell: (row: T) => ReactNode;
  /** Makes the column sortable on the page's own rows (client-side). */
  sortValue?: (row: T) => string | number | null | undefined;
  /** Sortable by the server: the table only reports `onSortChange`. */
  sortable?: boolean;
  /** Width, alignment or visibility classes for the header and its cells. */
  className?: string;
};

type ServerPaging = { page: number; pageSize: number; total: number; onPageChange: (p: number) => void; onPageSizeChange?: (n: number) => void };

type DataTableProps<T> = {
  label: string;
  columns: DataColumn<T>[];
  /** `undefined` while the first load is in flight. */
  rows: T[] | undefined;
  getRowId: (row: T) => string;
  /** Names a row for its checkbox and menu, e.g. the person's name. Default: none. */
  getRowLabel?: (row: T) => string;
  /** What a row is, plural: "users". */
  itemLabel: string;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  /** Shown in the body when there are no rows: usually an EmptyState. */
  empty: ReactNode;
  onRowClick?: (row: T) => void;
  rowActions?: (row: T) => ActionItem[];
  selectable?: boolean;
  selected?: string[];
  onSelectedChange?: (ids: string[]) => void;
  /** The bar's buttons while rows are selected. */
  bulkActions?: (ids: string[], clear: () => void) => ReactNode;
  /** Controlled sort; with `onSortChange` the server sorts. */
  sort?: SortState;
  onSortChange?: (sort: SortState) => void;
  /** Server-side pages. Without it the table pages its own rows. */
  paging?: ServerPaging;
  pageSizes?: number[];
  /** Keep the header in view while the body scrolls (body capped at 70vh). Default true. */
  stickyHeader?: boolean;
  className?: string;
};

/**
 * Rows of one kind of thing: sorting, selection with a bulk bar, paging, a
 * row menu, row click (and Enter), and the loading, empty and error states.
 * Scrolls sideways on a phone. Pages and sorts itself unless the server does.
 */
const DataTable = <T,>(props: DataTableProps<T>) => {
  const { label, columns, rows, getRowId, getRowLabel, itemLabel, loading = false, error, onRetry, empty, onRowClick, rowActions } = props;
  const { selectable = false, bulkActions, paging, pageSizes = [10, 20, 50], stickyHeader = true, className = "" } = props;
  const { t } = useUiStrings();
  const [ownSort, setOwnSort] = useState<SortState>(null);
  const [ownSelected, setOwnSelected] = useState<string[]>([]);
  const [ownPage, setOwnPage] = useState(1);
  const [ownSize, setOwnSize] = useState(pageSizes[0]);
  const sort = props.sort !== undefined ? props.sort : ownSort;
  const selected = props.selected ?? ownSelected;
  const setSelected = props.onSelectedChange ?? setOwnSelected;

  const sorted = useMemo(() => {
    const list = rows ?? [];
    const col = columns.find((c) => c.key === sort?.key);
    if (!sort || !col?.sortValue || props.onSortChange) return list;
    const get = col.sortValue;
    return [...list].sort((a, b) => {
      const x = get(a) ?? "";
      const y = get(b) ?? "";
      const cmp = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y));
      return sort.dir === "asc" ? cmp : -cmp;
    });
  }, [rows, columns, sort, props.onSortChange]);

  const page = paging?.page ?? ownPage;
  const pageSize = paging?.pageSize ?? ownSize;
  const visible = paging ? sorted : sorted.slice((page - 1) * pageSize, page * pageSize);
  const total = paging?.total ?? sorted.length;
  const ids = visible.map(getRowId);
  const all = ids.length > 0 && ids.every((id) => selected.includes(id));
  const some = !all && ids.some((id) => selected.includes(id));
  const colSpan = columns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0);

  const onSort = (key: string) => {
    const next: SortState = sort?.key === key ? (sort.dir === "asc" ? { key, dir: "desc" } : null) : { key, dir: "asc" };
    if (props.onSortChange) props.onSortChange(next);
    else setOwnSort(next);
  };
  const toggle = (id: string) => setSelected(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
  const toggleAll = () => setSelected(all ? selected.filter((s) => !ids.includes(s)) : [...new Set([...selected, ...ids])]);
  const rowKey = (e: KeyboardEvent, row: T) => {
    if (e.key === "Enter" && e.target === e.currentTarget) onRowClick?.(row);
  };

  return (
    <div className={`mk-surface overflow-hidden rounded-card bg-surface-1 ${className}`}>
      {selectable && bulkActions && selected.length > 0 && (
        <BulkBar count={selected.length} onClear={() => setSelected([])}>
          {bulkActions(selected, () => setSelected([]))}
        </BulkBar>
      )}
      <div className={`overflow-x-auto ${stickyHeader ? "max-h-[70vh] overflow-y-auto" : ""}`}>
        <table aria-label={label} className="w-full border-collapse text-start text-body">
          <thead className={stickyHeader ? "sticky top-0 z-10" : ""}>
            <tr>
              {selectable && (
                <th scope="col" className="w-12 bg-surface-2 ps-space-6">
                  <input type="checkbox" aria-label={t.selectAll} checked={all} ref={(el) => { if (el) el.indeterminate = some; }} onChange={toggleAll} className={checkboxClasses} />
                </th>
              )}
              {columns.map((c) => (
                <th key={c.key} scope="col" aria-sort={sort?.key === c.key ? (sort.dir === "asc" ? "ascending" : "descending") : undefined} className={`whitespace-nowrap bg-surface-2 px-space-6 py-space-4 text-start text-caption font-normal text-text-muted ${c.className ?? ""}`}>
                  {c.sortValue || c.sortable ? <SortHeader label={c.header} sortKey={c.key} sort={sort} onSort={onSort} /> : c.hideHeader ? <span className="sr-only">{c.header}</span> : c.header}
                </th>
              ))}
              {rowActions && <th scope="col" className="w-12 bg-surface-2"><span className="sr-only">{t.rowActions}</span></th>}
            </tr>
          </thead>
          <tbody>
            {error ? (
              <tr><td colSpan={colSpan}><ErrorState message={error} onRetry={onRetry} /></td></tr>
            ) : loading && !rows?.length ? (
              <TableLoadingRow colSpan={colSpan} rows={5} columns={colSpan} />
            ) : visible.length === 0 ? (
              <tr><td colSpan={colSpan}>{empty}</td></tr>
            ) : (
              visible.map((row) => {
                const id = getRowId(row);
                const isSelected = selected.includes(id);
                const rowName = getRowLabel?.(row);
                const named = (base: string) => (rowName ? `${base}: ${rowName}` : base);
                return (
                  <tr
                    key={id}
                    tabIndex={onRowClick ? 0 : undefined}
                    aria-selected={selectable ? isSelected : undefined}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    onKeyDown={onRowClick ? (e) => rowKey(e, row) : undefined}
                    className={`${rowClasses} ${onRowClick ? "cursor-pointer outline-none hover:bg-surface-highlight focus-visible:bg-surface-highlight" : ""} ${isSelected ? "bg-accent-soft" : ""}`}
                  >
                    {selectable && (
                      <td className={`${cellClasses} w-12`} onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" aria-label={named(t.selectRow)} checked={isSelected} onChange={() => toggle(id)} className={checkboxClasses} />
                      </td>
                    )}
                    {columns.map((c) => (
                      <td key={c.key} className={`${cellClasses} ${c.className ?? ""}`}>{c.cell(row)}</td>
                    ))}
                    {rowActions && (
                      <td className={`${cellClasses} w-12`} onClick={(e) => e.stopPropagation()}>
                        <ActionsDropdown iconOnly label={named(t.rowActions)} items={rowActions(row)} />
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {/* A short list the table pages itself fits on one page: no footer.
          Server-paged lists keep it, since the total is the server's. */}
      {!error && total > 0 && (paging || total > Math.min(...pageSizes)) && (
        <DataTableFooter
          page={page}
          pageSize={pageSize}
          pageSizes={pageSizes}
          total={total}
          itemCount={visible.length}
          itemLabel={itemLabel}
          loading={loading}
          onPage={paging?.onPageChange ?? setOwnPage}
          onPageSize={paging ? paging.onPageSizeChange : (n) => { setOwnSize(n); setOwnPage(1); }}
        />
      )}
    </div>
  );
};

export { DataTable };
export type { DataColumn, DataTableProps, ServerPaging };
