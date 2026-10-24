"use client";

import type { SelectHTMLAttributes } from "react";
import { Icon } from "../../ui/primitives/Icon";

type SelectFieldProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "className"> & {
  /** Always required: it is the control's accessible name even when hidden. */
  label: string;
  /** Hide the label visually, for a filter bar where the options speak for it. */
  hideLabel?: boolean;
  options: readonly { value: string; label: string }[];
};

/** A native select in the pill style of the filter bars. */
const SelectField = ({ label, hideLabel = false, options, ...rest }: SelectFieldProps) => (
  <label className="flex items-center gap-2 text-ui-xs text-text-muted">
    <span className={hideLabel ? "sr-only" : "font-medium"}>{label}</span>
    <span className="relative inline-flex items-center">
      <select
        {...rest}
        className="h-9 cursor-pointer appearance-none rounded-full bg-surface-1 ps-3.5 pe-8 text-ui-xs font-medium text-text outline-none ring-1 ring-inset ring-hairline"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <Icon name="angle-down" size={13} className="pointer-events-none absolute end-3 text-text-muted" />
    </span>
  </label>
);

export { SelectField };
export type { SelectFieldProps };
