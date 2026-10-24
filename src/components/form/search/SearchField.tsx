"use client";

import type { InputHTMLAttributes } from "react";
import { Icon } from "../../ui/primitives/Icon";

type SearchFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "className" | "type"> & {
  /** The field's accessible name; the box shows only a placeholder. */
  label: string;
};

/** The rounded search box of list headers. */
const SearchField = ({ label, ...rest }: SearchFieldProps) => (
  <label className="flex h-9 w-full items-center gap-2.5 rounded-full bg-surface-1 px-4 sm:w-65">
    <Icon name="search" size={16} className="text-text-muted" />
    <span className="sr-only">{label}</span>
    <input {...rest} type="search" className="flex-1 bg-transparent text-ui text-text outline-none" />
  </label>
);

export { SearchField };
export type { SearchFieldProps };
