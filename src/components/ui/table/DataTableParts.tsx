"use client";

import type { ReactNode } from "react";
import { FilterSelectField } from "../../form/fields/FilterSelectField";
import { Icon } from "../primitives/Icon";
import { useUiStrings } from "../i18n/uiStrings";
import { TablePagination } from "./TablePagination";

type SortDir = "asc" | "desc";
type SortState = { key: string; dir: SortDir } | null;

const checkboxClasses =
  "size-4.5 cursor-pointer appearance-none rounded-sm bg-surface-2 shadow-edge checked:bg-accent checked:shadow-none indeterminate:bg-accent focus-visible:outline-2 focus-visible:outline-accent";

type SortHeaderProps = { label: string; sortKey: string; sort: SortState; onSort: (key: string) => void };

/** A column header that sorts: a real button, with its state read out. */
const SortHeader = ({ label, sortKey, sort, onSort }: SortHeaderProps) => {
  const { t } = useUiStrings();
  const dir = sort?.key === sortKey ? sort.dir : null;
  return (
    <button type="button" onClick={() => onSort(sortKey)} className="inline-flex min-h-6 min-w-6 items-center gap-space-1 hover:text-text">
      {label}
      {/* One arrow that turns over when the order flips, rather than swapping glyphs. */}
      <Icon
        name={dir ? "sort-up" : "sort"}
        size={16}
        className={`transition-[rotate] duration-fast ease-standard ${dir === "desc" ? "rotate-180" : ""}`}
      />
      {dir && <span className="sr-only">, {dir === "asc" ? t.sortedAscending : t.sortedDescending}</span>}
    </button>
  );
};

type BulkBarProps = { count: number; onClear: () => void; children: ReactNode };

/** Over the table while rows are selected: how many, the bulk actions, and a way out. */
const BulkBar = ({ count, onClear, children }: BulkBarProps) => {
  const { t } = useUiStrings();
  return (
    // Rises 8px into place as it fades in, the first time something is selected.
    <div role="region" aria-label={t.selected(count)} className="flex animate-fade-up flex-wrap items-center gap-space-4 bg-accent-soft px-space-6 py-space-3">
      <span className="text-body font-medium text-accent-on-soft">{t.selected(count)}</span>
      <div className="flex flex-wrap items-center gap-space-3">{children}</div>
      <button type="button" onClick={onClear} className="ms-auto text-caption font-medium text-accent-on-soft hover:underline">
        {t.clearSelection}
      </button>
    </div>
  );
};

type FooterProps = {
  page: number;
  pageSize: number;
  pageSizes: number[];
  total: number;
  itemCount: number;
  itemLabel: string;
  loading: boolean;
  onPage: (p: number) => void;
  onPageSize?: (n: number) => void;
};

/** Pagination, with a rows-per-page select when the size can change. */
const DataTableFooter = ({ page, pageSize, pageSizes, total, itemCount, itemLabel, loading, onPage, onPageSize }: FooterProps) => {
  const { t } = useUiStrings();
  return (
    <div className="flex flex-wrap items-center justify-between gap-space-4 shadow-rule-t">
      {onPageSize && (
        <span className="ps-space-6">
          <FilterSelectField
            label={t.rowsPerPage}
            size="sm"
            value={String(pageSize)}
            onChange={(value) => onPageSize(Number(value))}
            options={pageSizes.map((n) => ({ value: String(n), label: String(n) }))}
          />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <TablePagination currentPage={page} onPageChange={onPage} itemsPerPage={pageSize} itemCount={itemCount} totalCount={total} itemLabel={itemLabel} loading={loading} />
      </div>
    </div>
  );
};

export { BulkBar, DataTableFooter, SortHeader, checkboxClasses };
export type { SortDir, SortState };
