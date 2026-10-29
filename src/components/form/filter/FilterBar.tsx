"use client";

import type { ReactNode } from "react";
import { Button } from "../../ui/buttons/Button";
import { Icon } from "../../ui/primitives/Icon";
import { useUiStrings } from "../../ui/i18n/uiStrings";

type FilterBarProps = {
  /** Usually a SearchField. */
  search?: ReactNode;
  /** FilterSelectFields, a DateRangeButton… in reading order. */
  children?: ReactNode;
  /** Whether any filter is set: shows "Clear filters". */
  active?: boolean;
  onClear?: () => void;
  className?: string;
};

/**
 * A list's search and filters on one line that wraps on a phone, with
 * "Clear filters" once something is set. Pair with `useUrlFilters` so the
 * filtered view lives in the URL.
 */
const FilterBar = ({ search, children, active = false, onClear, className = "" }: FilterBarProps) => {
  const { t } = useUiStrings();
  return (
    <div role="search" className={`flex flex-wrap items-center gap-space-4 ${className}`}>
      {search}
      {children}
      {active && onClear && (
        <Button variant="ghost" size="sm" icon={<Icon name="times" size={16} />} onClick={onClear}>
          {t.clearFilters}
        </Button>
      )}
    </div>
  );
};

export { FilterBar };
export type { FilterBarProps };
