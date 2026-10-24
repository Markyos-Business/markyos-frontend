"use client";

import type { InputHTMLAttributes } from "react";
import { Icon } from "../../ui/primitives/Icon";

type SearchFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "className" | "type"> & {
  /** The field's accessible name; the field shows only a placeholder. */
  label: string;
};

/** The search field of list headers: the underline field with a search glyph. */
const SearchField = ({ label, ...rest }: SearchFieldProps) => (
  <label className="mk-underline flex w-full items-center gap-space-3 sm:w-65">
    <Icon name="search" size={18} className="text-text-muted" />
    <span className="sr-only">{label}</span>
    <input {...rest} type="search" className="min-w-0 flex-1 bg-transparent text-body font-medium text-text outline-none placeholder:font-normal placeholder:text-text-disabled" />
  </label>
);

export { SearchField };
export type { SearchFieldProps };
