"use client";
import { useMemo, useState } from "react";
import { functionalUpdate, getCoreRowModel, getExpandedRowModel, getFilteredRowModel, getGroupedRowModel, getPaginationRowModel, getSortedRowModel, useReactTable, type ColumnDef, type ColumnFiltersState, type ExpandedState, type OnChangeFn, type PaginationState, type RowSelectionState, type SortingState, type VisibilityState } from "@tanstack/react-table";
import type { DataTableProps, SelectionScope } from "./types";
import { useUiStrings } from "../ui-strings";
import { tableLabels } from "./labels";
import { selectionCount } from "./model";
const EMPTY: never[] = [];

export function useDataTable<T>(props: DataTableProps<T>) {
  const data = props.data ?? props.rows ?? EMPTY; const { t } = useUiStrings();
  const labels = { ...tableLabels, search: t.search, retry: t.retry, save: t.save, cancel: t.cancel, selected: t.selected, clearFilters: t.clearFilters, selectAll: t.selectAll, clearSelection: t.clearSelection, actions: t.actionsFor, pageSize: t.rowsPerPage, ...props.labels };
  const [ownSorting, setSorting] = useState<SortingState>(props.defaultSorting ?? []);
  const [ownSelection, setSelection] = useState<RowSelectionState>({});
  const [ownFilters, setFilters] = useState<ColumnFiltersState>(props.defaultFilters ?? []);
  const [ownVisibility, setVisibility] = useState<VisibilityState>(props.defaultColumnVisibility ?? {});
  const [ownPage, setPage] = useState<PaginationState>({ pageIndex: 0, pageSize: props.pageSizes?.[0] ?? 20 });
  const [ownSearch, setSearch] = useState(""); const [ownOrder, setOrder] = useState<string[]>([]);
  const [ownExpanded, setExpanded] = useState<ExpandedState>({});
  const [ownScope, setScope] = useState<SelectionScope>({ allMatching: false, excludedIds: [] });
  const [ownDensity, setDensity] = useState(props.defaultDensity ?? "comfortable");
  const sorting = props.sorting ?? (props.sort !== undefined ? props.sort ? [{ id: props.sort.key, desc: props.sort.dir === "desc" }] : [] : ownSorting);
  const selected = props.rowSelection ?? (props.selected ? Object.fromEntries(props.selected.map(id => [id, true])) : ownSelection);
  const scope = props.selectionScope ?? ownScope;
  const rowSelection = scope.allMatching ? Object.fromEntries(data.filter(row => !scope.excludedIds.includes(props.getRowId(row)) && !["disabled", "locked"].includes(props.getRowState?.(row) ?? "")).map(row => [props.getRowId(row), true])) : selected;
  const filters = props.filters ?? ownFilters; const search = props.search ?? ownSearch;
  const pagination = props.paging ? { pageIndex: props.paging.page - 1, pageSize: props.paging.pageSize } : typeof props.pagination === "object" ? props.pagination : ownPage;
  const paginated = !props.infinite && props.pagination !== false;
  const updateScope = (next: SelectionScope) => { if (!props.selectionScope) setScope(next); props.onSelectionScopeChange?.(next); };
  const onSelection: OnChangeFn<RowSelectionState> = updater => {
    const next = functionalUpdate(updater, rowSelection);
    if (scope.allMatching) {
      const loaded = new Set(data.map(props.getRowId));
      updateScope({ allMatching: true, excludedIds: [...scope.excludedIds.filter(id => !loaded.has(id)), ...data.map(props.getRowId).filter(id => !next[id])] });
    }
    if (!props.rowSelection && !props.selected) setSelection(next);
    props.onRowSelectionChange?.(updater); props.onSelectedChange?.(Object.keys(next).filter(id => next[id]));
  };
  const onPagination: OnChangeFn<PaginationState> = updater => {
    const next = functionalUpdate(updater, pagination);
    if (!props.pagination || typeof props.pagination !== "object") setPage(next);
    props.onPaginationChange?.(updater);
    if (props.paging) { if (next.pageSize !== pagination.pageSize) props.paging.onPageSizeChange?.(next.pageSize); props.paging.onPageChange(next.pageIndex + 1); }
  };
  const resetSelection = () => { updateScope({ allMatching: false, excludedIds: [] }); if (!props.rowSelection && !props.selected) setSelection({}); props.onRowSelectionChange?.({}); props.onSelectedChange?.([]); };
  const changeFilters: OnChangeFn<ColumnFiltersState> = updater => { if (!props.filters) setFilters(updater); props.onFiltersChange?.(updater); onPagination({ ...pagination, pageIndex: 0 }); resetSelection(); };
  const columns = useMemo<ColumnDef<T>[]>(() => props.columns.map(column => ({
    id: column.key, header: column.header, accessorFn: row => column.value?.(row) ?? column.sortValue?.(row) ?? (row as Record<string, unknown>)[column.key],
    size: column.width ?? 180, minSize: column.minWidth ?? 100, enableSorting: props.sortable !== false && (!!column.sortable || !!column.sortValue || props.sortable === true),
    enableColumnFilter: !!column.filterable, filterFn: "includesString", enableGrouping: true,
  })), [props.columns, props.sortable]);
  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack instance is consumed directly; never memoize it
  const table = useReactTable({ data, columns, getRowId: props.getRowId, getSubRows: props.getSubRows,
    getCoreRowModel: getCoreRowModel(), getFilteredRowModel: getFilteredRowModel(), getSortedRowModel: getSortedRowModel(), getGroupedRowModel: getGroupedRowModel(), getExpandedRowModel: getExpandedRowModel(),
    getPaginationRowModel: paginated ? getPaginationRowModel() : undefined, manualPagination: !!props.paging, rowCount: props.paging?.total ?? props.totalCount,
    manualFiltering: props.manualFiltering, manualSorting: props.manualSorting ?? !!props.onSortChange, enableMultiSort: props.multiSort ?? true, enableRowSelection: row => !["disabled", "locked"].includes(props.getRowState?.(row.original) ?? ""),
    columnResizeDirection: props.dir ?? "ltr", enableColumnResizing: props.resizable ?? false, columnResizeMode: "onChange", getRowCanExpand: row => !!props.expandable || !!row.subRows.length,
    autoResetPageIndex: false, paginateExpandedRows: false,
    state: { sorting, rowSelection, columnFilters: filters, globalFilter: search, columnVisibility: props.columnVisibility ?? ownVisibility, columnOrder: props.columnOrder ?? ownOrder,
      pagination, expanded: props.expanded ?? ownExpanded, grouping: props.groupBy ? (Array.isArray(props.groupBy) ? props.groupBy : [props.groupBy]) : [] },
    onSortingChange: updater => { const next = functionalUpdate(updater, sorting); if (!props.sorting && props.sort === undefined) setSorting(next); props.onSortingChange?.(updater); props.onSortChange?.(next[0] ? { key: next[0].id, dir: next[0].desc ? "desc" : "asc" } : null); },
    onRowSelectionChange: onSelection, onPaginationChange: onPagination, onColumnFiltersChange: changeFilters,
    onColumnVisibilityChange: updater => { if (!props.columnVisibility) setVisibility(updater); props.onColumnVisibilityChange?.(updater); },
    onColumnOrderChange: updater => { if (!props.columnOrder) setOrder(updater); props.onColumnOrderChange?.(updater); },
    onExpandedChange: updater => { if (props.expanded === undefined) setExpanded(updater); props.onExpandedChange?.(updater); },
    onGlobalFilterChange: updater => { const next = functionalUpdate(updater, search); if (props.search === undefined) setSearch(next); props.onSearchChange?.(next); onPagination({ ...pagination, pageIndex: 0 }); resetSelection(); },
  });
  const matching = table.getFilteredRowModel().flatRows.filter(row => !row.subRows.length);
  const total = props.paging?.total ?? props.totalCount ?? matching.length;
  const groups = new Set(table.getGroupedRowModel().flatRows.filter(row => row.getIsGrouped()).map(row => row.id));
  const ids = Object.keys(rowSelection).filter(id => rowSelection[id] && !groups.has(id)); const count = selectionCount(ids, scope, total);
  return { table, data, labels, scope, updateScope, resetSelection, clearSelection: resetSelection, search, filters, pagination, paginated,
    total, selectableTotal: props.paging || props.totalCount ? total : matching.filter(row => row.getCanSelect()).length, count, ids, density: props.density ?? ownDensity, setDensity: (next: "comfortable" | "compact") => { setDensity(next); props.onDensityChange?.(next); },
    bulkContext: { ...scope, ids, rows: data.filter(row => ids.includes(props.getRowId(row))), count, search, filters, clear: resetSelection },
    selectMatching: () => {
      const remote = !!props.paging || (props.totalCount ?? 0) > data.length;
      updateScope({ allMatching: remote, excludedIds: remote ? data.filter(row => ["disabled", "locked"].includes(props.getRowState?.(row) ?? "")).map(props.getRowId) : [] });
      const next = Object.fromEntries(matching.filter(row => row.getCanSelect()).map(row => [row.id, true]));
      if (!props.rowSelection && !props.selected) setSelection(next);
      props.onRowSelectionChange?.(next); props.onSelectedChange?.(Object.keys(next));
    },
  };
}
export type DataTableModel<T> = ReturnType<typeof useDataTable<T>>;
