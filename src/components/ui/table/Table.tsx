import type { ReactNode } from "react";

export interface TableColumn {
  key: string;
  label: ReactNode;
  /** Width, alignment or visibility classes for the header and its cells. */
  className?: string;
}

/**
 * A data table on a surface card. Rows are the caller's `<tr>`s; cells should
 * reuse `cellClasses` so padding and separators match the header.
 */
export function Table({
  columns,
  label,
  children,
}: {
  columns: TableColumn[];
  /** The table's accessible name. */
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="mk-surface overflow-x-auto rounded-card bg-surface-1">
      <table aria-label={label} className="w-full border-collapse text-start text-[13px]">
        <thead>
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                scope="col"
                className={`px-4 py-3 text-start text-[11px] font-semibold uppercase tracking-[0.06em] text-text-faint ${c.className ?? ""}`}
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
}

export const rowClasses = "border-t border-hairline";
export const cellClasses = "px-4 py-3 align-middle";

export function TableEmptyRow({
  colSpan,
  title,
  hint,
}: {
  colSpan: number;
  title: string;
  hint?: string;
}) {
  return (
    <tr className={rowClasses}>
      <td colSpan={colSpan} className="px-4 py-10 text-center">
        <div className="text-[13px] font-medium text-text-secondary">{title}</div>
        {hint && <div className="mt-1 text-[12px] text-text-faint">{hint}</div>}
      </td>
    </tr>
  );
}

export function TableLoadingRow({ colSpan, rows = 3 }: { colSpan: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }, (_, i) => (
        <tr key={i} className={rowClasses} aria-hidden>
          <td colSpan={colSpan} className={cellClasses}>
            <div className="h-4 w-full animate-pulse rounded-widget bg-surface-2" />
          </td>
        </tr>
      ))}
    </>
  );
}
