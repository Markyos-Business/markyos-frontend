"use client";

import { InputHTMLAttributes } from "react";
import { Icon } from "../../ui/primitives/Icon";

interface SearchFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "className" | "type"> {
  label: string;
}

/** The rounded search box of list headers. */
export function SearchField({ label, ...rest }: SearchFieldProps) {
  return (
    <label className="flex h-9 w-full items-center gap-2.5 rounded-full bg-surface-1 px-4 sm:w-[260px]">
      <Icon name="search" size={16} className="text-text-muted" />
      <span className="sr-only">{label}</span>
      <input
        {...rest}
        type="search"
        className="flex-1 bg-transparent text-[13px] text-text outline-none"
      />
    </label>
  );
}
