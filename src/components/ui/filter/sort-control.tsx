"use client";

import { FilterSelectField } from "../listbox/filter-select-field";
import { useUiStrings } from "../ui-strings";

type SortOption = { value: string; label: string };

type SortControlProps = {
  /** Name each option with its direction ("Name A–Z", "Newest first") so the choice says how rows run. */
  options: readonly SortOption[];
  value: string;
  onChange: (value: string) => void;
  /** The first option, for the default order; defaults to the kit's "Default order". */
  defaultLabel?: string;
  /** The accessible name; defaults to the kit's "Sort by". */
  label?: string;
  /** Hide the label visually; the sort icon and the chosen option speak for it. */
  hideLabel?: boolean;
};

/**
 * "Sort by" and its choices, as a toolbar select. An empty value is the
 * default order. The pill always shows the order in force, so sorting never
 * changes silently.
 */
const SortControl = ({ options, value, onChange, defaultLabel, label, hideLabel }: SortControlProps) => {
  const { t } = useUiStrings();
  return (
    <FilterSelectField
      label={label ?? t.sortBy}
      hideLabel={hideLabel}
      icon="arrows-v"
      value={value}
      active={value !== ""}
      onChange={(next) => onChange(next)}
      options={[{ value: "", label: defaultLabel ?? t.defaultOrder }, ...options]}
    />
  );
};

export { SortControl };
export type { SortControlProps, SortOption };
