import type { ReactNode } from "react";
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
  children: ReactNode;
};

/**
 * A data table on a surface card. Rows are the caller's `<tr>`s; cells should
 * reuse `cellClasses` so padding and separators match the header.
 */
const Table = ({ columns, label, children }: TableProps) => (
  <div className="mk-surface overflow-x-auto rounded-2xl bg-surface-1">
    <table aria-label={label} className="w-full border-collapse text-start text-ui">
      <thead>
        <tr>
          {columns.map((c) => (
            <th
              key={c.key}
              scope="col"
              className={`px-4 py-3 text-start text-ui-2xs font-semibold uppercase tracking-caps text-text-faint ${c.className ?? ""}`}
            >
              {c.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  </div>
);

const rowClasses = "border-t border-hairline";
const cellClasses = "px-4 py-3 align-middle";

type TableEmptyRowProps = {
  colSpan: number;
  title: string;
  /** Required for the same reason as EmptyState's: say what would be here. */
  description: string;
};

const TableEmptyRow = ({ colSpan, title, description }: TableEmptyRowProps) => (
  <tr className={rowClasses}>
    <td colSpan={colSpan} className="px-4 py-10 text-center">
      <div className="text-ui font-medium text-text-secondary">{title}</div>
      <div className="mt-1 text-ui-xs text-text-faint">{description}</div>
    </td>
  </tr>
);

type TableLoadingRowProps = { colSpan: number; rows?: number };

/** Skeleton rows shaped like the table, while it loads. */
const TableLoadingRow = ({ colSpan, rows = 3 }: TableLoadingRowProps) => (
  <>
    {Array.from({ length: rows }, (_, i) => (
      <tr key={i} className={rowClasses} aria-hidden>
        <td colSpan={colSpan} className={cellClasses}>
          <Skeleton className="h-4 w-full rounded-lg" />
        </td>
      </tr>
    ))}
  </>
);

export { Table, TableEmptyRow, TableLoadingRow, cellClasses, rowClasses };
export type { TableColumn, TableEmptyRowProps, TableLoadingRowProps, TableProps };
