"use client";

import { FilterSelectField } from "../fields/FilterSelectField";

type SortOption = { value: string; label: string };

type SortControlProps = {
  options: readonly SortOption[];
  value: string;
  onChange: (value: string) => void;
  /** The first option, for no particular order. */
  defaultLabel?: string;
  label?: string;
};

/** "Sort by" and its choices, as a toolbar select. An empty value is the default order. */
const SortControl = ({ options, value, onChange, defaultLabel = "Default order", label = "Sort by" }: SortControlProps) => (
  <FilterSelectField
    label={label}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    options={[{ value: "", label: defaultLabel }, ...options]}
  />
);

export { SortControl };
export type { SortControlProps, SortOption };
