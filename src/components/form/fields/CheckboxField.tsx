"use client";

import type { InputHTMLAttributes, ReactNode } from "react";

type CheckboxFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "className"> & {
  label: ReactNode;
};

/** A checkbox with its label, the whole row clickable. */
const CheckboxField = ({ label, ...inputProps }: CheckboxFieldProps) => (
  <label className="inline-flex min-h-6.5 cursor-pointer select-none items-center gap-2.5 text-ui text-text-secondary">
    <input {...inputProps} type="checkbox" className="size-4 cursor-pointer accent-accent" />
    {label}
  </label>
);

export { CheckboxField };
export type { CheckboxFieldProps };
