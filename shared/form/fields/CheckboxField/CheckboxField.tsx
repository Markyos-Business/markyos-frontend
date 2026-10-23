"use client";

import { InputHTMLAttributes, ReactNode } from "react";

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "className"> {
  label: ReactNode;
}

/** A checkbox with its label, the whole row clickable. */
export function CheckboxField({ label, ...inputProps }: Props) {
  return (
    <label className="inline-flex min-h-[26px] cursor-pointer select-none items-center gap-2.5 text-[13px] text-text-secondary">
      <input {...inputProps} type="checkbox" className="h-4 w-4 cursor-pointer accent-accent" />
      {label}
    </label>
  );
}
