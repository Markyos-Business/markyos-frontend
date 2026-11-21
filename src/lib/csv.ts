/*
 * CSV for spreadsheets: one place for the quoting rules (moved from the
 * admin users export, 21 Nov 2026, when the Help Center analytics needed
 * the same).
 */

export type CsvCell = string | number | null | undefined;

/** One cell: quoted when it holds a comma, quote or line break; a leading
 *  = + - @ is escaped so a spreadsheet doesn't run it as a formula. */
export const csvCell = (value: CsvCell) => {
  const text = value === null || value === undefined ? "" : String(value);
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

export const toCsv = (rows: CsvCell[][]) => rows.map((r) => r.map(csvCell).join(",")).join("\n");

/** Saves `csv` as a file. A byte-order mark first, so Excel reads Arabic as UTF-8. */
export function downloadCsv(name: string, csv: string) {
  const url = URL.createObjectURL(new Blob(["﻿", csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
