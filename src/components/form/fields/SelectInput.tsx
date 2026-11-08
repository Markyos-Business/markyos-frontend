"use client";

import { fieldClasses, type FieldSize } from "./InputField";
import { Listbox, type ListboxOption } from "./Listbox";

type SelectOption = ListboxOption;

type SelectInputProps = {
  id?: string;
  value: string;
  options: readonly SelectOption[];
  onChange: (value: string) => void;
  /** Shown while nothing is chosen. */
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  onBlur?: () => void;
  className?: string;
  size?: FieldSize;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
};

/**
 * Just the select, on the same underline as every other field, for an inline
 * picker that needs no label of its own (a currency beside an amount). It
 * opens the kit's dropdown, never the browser's.
 *
 * A value that matches none of the options shows the placeholder rather than
 * whatever the first option is, so nothing looks chosen that isn't.
 */
const SelectInput = ({ error, className = "", placeholder = "Select…", size = "md", ...rest }: SelectInputProps) => (
  <span className={`relative flex min-w-0 items-center ${className}`}>
    <Listbox {...rest} placeholder={placeholder} error={Boolean(error)} triggerClassName={`${fieldClasses(size)} w-full`} />
  </span>
);

export { SelectInput };
export type { SelectInputProps, SelectOption };
