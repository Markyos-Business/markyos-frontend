"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Button } from "../buttons/Button";
import { IconBadge } from "../badges/IconBadge";
import { Icon } from "../primitives/Icon";
import { Skeleton } from "../loading/Skeleton";

type TableColumn = {
  key: string;
  label: ReactNode;
  /** Width, alignment or visibility classes for the header and its cells. */
  className?: string;
};

type TableProps = {
  columns: TableColumn[];
  /** The table's accessible name. */
  label: string;
  /** Under the table, inside the card: usually `TablePagination`. */
  footer?: ReactNode;
  children: ReactNode;
};

/**
 * A data table on a surface card. Rows are the caller's `<tr>`s; cells should
 * reuse `cellClasses` so padding and separators match the header.
 *
 * When the table is wider than its card, a soft shade on either edge says
 * there is more to scroll to. The edges are logical: in Arabic the table
 * scrolls the other way and the shades swap with it.
 */
const Table = ({ columns, label, footer, children }: TableProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [more, setMore] = useState({ start: false, end: false });

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () => {
      // `scrollLeft` counts down from 0 in a right-to-left table, so measure
      // the distance travelled, not the coordinate.
      const travelled = Math.abs(el.scrollLeft);
      const room = el.scrollWidth - el.clientWidth;
      setMore({ start: travelled > 1, end: room - travelled > 1 });
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, []);

  return (
    <div className="mk-surface overflow-hidden rounded-card bg-surface-1">
      <div className="relative">
        <div ref={scrollRef} className="overflow-x-auto">
          <table aria-label={label} className="w-full border-collapse text-start text-body">
            <thead>
              <tr>
                {columns.map((c) => (
                  <th
                    key={c.key}
                    scope="col"
                    // The spec's column header: 12px muted on the raised fill.
                    className={`bg-surface-2 px-space-6 py-space-4 text-start text-caption font-normal text-text-muted ${c.className ?? ""}`}
                  >
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>{children}</tbody>
          </table>
        </div>
        <span
          aria-hidden
          className={`pointer-events-none absolute inset-y-0 start-0 w-4 bg-linear-to-r from-hairline-strong to-transparent transition-opacity rtl:bg-linear-to-l ${
            more.start ? "opacity-100" : "opacity-0"
          }`}
        />
        <span
          aria-hidden
          className={`pointer-events-none absolute inset-y-0 end-0 w-4 bg-linear-to-l from-hairline-strong to-transparent transition-opacity rtl:bg-linear-to-r ${
            more.end ? "opacity-100" : "opacity-0"
          }`}
        />
      </div>
      {footer}
    </div>
  );
};

// Rows divide with an inset rule, not a border; cells take the spec's 18px
// inline padding. The first cell of a row is the one set at weight 500.
const rowClasses = "shadow-rule-t first:shadow-none";
const cellClasses = "h-widget-row px-space-6 align-middle";

type TableEmptyRowProps = {
  colSpan: number;
  title: string;
  /** Required for the same reason as EmptyState's: say what would be here. */
  description: string;
};

const TableEmptyRow = ({ colSpan, title, description }: TableEmptyRowProps) => (
  <tr className={rowClasses}>
    <td colSpan={colSpan} className="px-space-6 py-space-11 text-center">
      <div dir="auto" className="bidi-auto text-body font-medium text-text-secondary">
        {title}
      </div>
      <div dir="auto" className="bidi-auto mt-space-1 text-caption text-text-faint">
        {description}
      </div>
    </td>
  </tr>
);

type TableLoadingRowProps = {
  colSpan: number;
  rows?: number;
  /**
   * One skeleton per cell instead of one bar across the row, so the
   * placeholder has the table's own columns. The first cell reads wider, like
   * a name.
   */
  columns?: number;
};

/** Skeleton rows shaped like the table, while it loads. */
const TableLoadingRow = ({ colSpan, rows = 3, columns }: TableLoadingRowProps) => (
  <>
    {Array.from({ length: rows }, (_, i) => (
      <tr key={i} className={rowClasses} aria-hidden>
        {columns ? (
          Array.from({ length: columns }, (_, c) => (
            <td key={c} className={cellClasses}>
              <Skeleton className={`h-4 rounded-lg ${c === 0 ? "w-7/10" : "w-1/2"}`} />
            </td>
          ))
        ) : (
          <td colSpan={colSpan} className={cellClasses}>
            <Skeleton className="h-4 w-full rounded-lg" />
          </td>
        )}
      </tr>
    ))}
  </>
);

type TableErrorRowProps = {
  colSpan: number;
  /** What failed, already in words a person can act on. */
  message?: string;
  /** Re-runs the load. Without it there is no Retry button. */
  onRetry?: () => void;
};

/** A table whose load failed: what happened, and a way to try again. */
const TableErrorRow = ({ colSpan, message = "Something went wrong while loading this data.", onRetry }: TableErrorRowProps) => (
  <tr className={rowClasses}>
    <td colSpan={colSpan} className="px-space-6 py-space-11 text-center">
      <div role="alert" className="flex flex-col items-center gap-space-3">
        <IconBadge icon="exclamation-circle" tone="danger" />
        <p className="text-body font-medium text-text">Something went wrong</p>
        <p dir="auto" className="bidi-auto text-caption text-text-muted">
          {message}
        </p>
        {onRetry && (
          <Button variant="outline" size="sm" className="mt-space-3" icon={<Icon name="sync" size={18} />} onClick={onRetry}>
            Retry
          </Button>
        )}
      </div>
    </td>
  </tr>
);

export { Table, TableEmptyRow, TableErrorRow, TableLoadingRow, cellClasses, rowClasses };
export type { TableColumn, TableEmptyRowProps, TableErrorRowProps, TableLoadingRowProps, TableProps };
