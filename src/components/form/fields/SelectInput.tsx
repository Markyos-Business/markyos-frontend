"use client";

import type { SelectHTMLAttributes } from "react";
import { Icon } from "../../ui/primitives/Icon";
import { inputClasses } from "./InputField";

type SelectOption = { value: string; label: string; disabled?: boolean };

type SelectInputProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "className" | "value" | "children"> & {
  value: string;
  options: readonly SelectOption[];
  /** The disabled first option shown while nothing is chosen. */
  placeholder?: string;
  error?: string;
  className?: string;
};

/**
 * Just the select, on the same underline as the other fields, for an inline picker that
 * needs no label of its own (a currency beside an amount).
 *
 * A value that matches none of the options is shown as such rather than
 * left to the browser, which would quietly display the first option as if it
 * were chosen.
 */
const SelectInput = ({ value, options, placeholder, error, className = "", ...rest }: SelectInputProps) => {
  const matched = options.some((o) => o.value === value);
  return (
    <span className={`relative flex items-center ${className}`}>
      <select
        {...rest}
        value={value}
        aria-invalid={error ? true : undefined}
        className={`${inputClasses} cursor-pointer appearance-none pe-space-11`}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {value !== "" && !matched && (
          <option value={value} disabled>
            {`${value} (not an available option)`}
          </option>
        )}
        {options.map((o) => (
          <option key={o.value} value={o.value} disabled={o.disabled}>
            {o.label}
          </option>
        ))}
      </select>
      <Icon name="angle-down" size={16} className="pointer-events-none absolute end-space-4 text-text-muted" />
    </span>
  );
};

export { SelectInput };
export type { SelectInputProps, SelectOption };
