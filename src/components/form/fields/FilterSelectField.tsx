"use client";

import type { SelectHTMLAttributes } from "react";
import { Icon } from "../../ui/primitives/Icon";

type FilterSelectFieldProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "className"> & {
  /** Always required: it is the control's accessible name even when hidden. */
  label: string;
  /** Hide the label visually, for a filter bar where the options speak for it. */
  hideLabel?: boolean;
  /** An icon name shown inside the pill, before the value. */
  icon?: string;
  options: readonly { value: string; label: string }[];
};

/** A native select for a toolbar or filter bar, in the outline button's look. */
const FilterSelectField = ({ label, hideLabel = false, icon, options, ...rest }: FilterSelectFieldProps) => (
  <label className="flex items-center gap-space-3 text-caption text-text-muted">
    <span className={hideLabel ? "sr-only" : "font-medium"}>{label}</span>
    <span className="relative inline-flex items-center">
      {icon && <Icon name={icon} size={16} className="pointer-events-none absolute start-space-4 text-text-muted" />}
      <select
        {...rest}
        className={`h-control-sm cursor-pointer appearance-none rounded-lg bg-ink-soft pe-space-11 text-body font-medium text-text shadow-edge ${
          icon ? "ps-space-11" : "ps-space-5"
        }`}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <Icon name="angle-down" size={16} className="pointer-events-none absolute end-space-4 text-text-muted" />
    </span>
  </label>
);

export { FilterSelectField };
export type { FilterSelectFieldProps };
