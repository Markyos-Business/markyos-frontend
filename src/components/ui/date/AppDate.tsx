"use client";

import { useMemo } from "react";
import type { ReactNode } from "react";
import { formatDate, parseDate, type DateFormat } from "./dateFormat";

type AppDateProps = {
  /** An ISO or other parseable string, a Date, or nothing. */
  value?: string | Date | null;
  /**
   * `month` Jan · `month-year` Jan 26 · `short` 23 Jun 2026 · `long` 23 June
   * 2026 · `datetime` 23 Jun 2026, 2:30 PM · `relative` 5 minutes ago.
   */
  format?: DateFormat;
  /** A BCP 47 tag; pass "ar" in the Arabic interface. */
  locale?: string;
  /** Shown when the value is missing or invalid. */
  fallback?: ReactNode;
  className?: string;
};

/**
 * A date as a real `<time>` element: a machine-readable `datetime` for
 * assistive tech, the full date and time on hover.
 */
const AppDate = ({ value, format = "short", locale = "en-GB", fallback = "—", className }: AppDateProps) => {
  const parsed = useMemo(() => parseDate(value), [value]);
  const formatted = useMemo(() => (parsed ? formatDate(parsed, format, locale) : null), [parsed, format, locale]);
  if (!parsed) return <span className={className}>{fallback}</span>;
  return (
    // `dir="auto"`: an English date inside the Arabic interface (or the
    // reverse) keeps its own word order instead of the page's.
    <time dir="auto" dateTime={parsed.toISOString()} className={className} title={formatDate(parsed, "datetime", locale)}>
      {formatted}
    </time>
  );
};

export { AppDate };
export type { AppDateProps };
