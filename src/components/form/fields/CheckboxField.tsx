"use client";

import type { InputHTMLAttributes, ReactNode } from "react";
import { Icon } from "../../ui/primitives/Icon";

type CheckboxInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "className">;

/**
 * The checkbox mark (spec §6.6): a 20px box with a 4px radius, filled with
 * the accent and its ink tick when checked. Still a real checkbox
 * underneath, only restyled; put it inside a `<label>`.
 */
const CheckboxInput = (props: CheckboxInputProps) => (
  <span className="relative flex size-5 shrink-0">
    <input
      {...props}
      type="checkbox"
      className="peer size-5 cursor-pointer appearance-none rounded-sm bg-surface-2 shadow-edge transition-colors checked:bg-accent checked:shadow-none disabled:cursor-not-allowed"
    />
    <Icon name="check" size={16} className="pointer-events-none absolute inset-0.5 hidden text-accent-ink peer-checked:block" />
  </span>
);

type CheckboxFieldProps = CheckboxInputProps & {
  label: ReactNode;
};

/** A checkbox with its label, the whole row clickable; the label goes from muted to heading when checked. */
const CheckboxField = ({ label, ...inputProps }: CheckboxFieldProps) => (
  <label className="inline-flex min-h-6.5 cursor-pointer select-none items-center gap-space-4 text-body text-text-muted has-checked:text-text has-disabled:cursor-not-allowed has-disabled:text-text-disabled">
    <CheckboxInput {...inputProps} />
    {label}
  </label>
);

export { CheckboxField, CheckboxInput };
export type { CheckboxFieldProps, CheckboxInputProps };
