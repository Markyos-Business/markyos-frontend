"use client";

import { useId } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { Icon } from "../icon";

type CheckboxState = "default" | "error" | "success";

type CheckboxInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "className"> & {
  /** Part of a group is chosen: a dash instead of a tick; announced as "mixed". */
  indeterminate?: boolean;
  /** The box's ring: danger for an error, success for a confirmed choice (spec §6.6). */
  state?: CheckboxState;
};

const RING: Record<CheckboxState, string> = { default: "shadow-edge", error: "shadow-edge-danger", success: "shadow-edge-success" };

/**
 * The checkbox mark (spec §6.6): a 20px box with a 4px radius, filled with
 * the accent and its ink tick when checked, a dash when indeterminate. Still
 * a real checkbox underneath (its native `indeterminate` is what assistive
 * tech reads as "mixed"); put it inside a `<label>`.
 */
const CheckboxInput = ({ indeterminate = false, state = "default", ...props }: CheckboxInputProps) => (
  <span className="relative flex size-5 shrink-0">
    <input
      {...props}
      type="checkbox"
      ref={(input) => {
        if (input) input.indeterminate = indeterminate;
      }}
      data-indeterminate={indeterminate || undefined}
      className={`peer size-5 cursor-pointer appearance-none rounded-sm bg-surface-2 transition-colors checked:bg-accent checked:shadow-none data-indeterminate:bg-accent data-indeterminate:shadow-none disabled:cursor-not-allowed ${RING[state]}`}
    />
    <Icon name={indeterminate ? "minus" : "check"} size={16} className={`pointer-events-none absolute inset-0.5 text-accent-ink ${indeterminate ? "block" : "hidden peer-checked:block"}`} />
  </span>
);

type CheckboxFieldProps = CheckboxInputProps & {
  label: ReactNode;
  /** A line under the label. */
  description?: ReactNode;
  error?: string;
  success?: string;
};

/**
 * A checkbox with its label, the whole row clickable; the label goes from
 * muted to heading when checked. An error or success note sits under it and
 * is tied to the box, so it is read with it.
 */
const CheckboxField = ({ label, description, error, success, state, ...inputProps }: CheckboxFieldProps) => {
  const noteId = `${useId()}-note`;
  const note = error ?? success;
  return (
    <span className="inline-flex flex-col gap-space-1">
      <label className="inline-flex min-h-6.5 cursor-pointer select-none items-start gap-space-4 text-body text-text-muted has-checked:text-text has-disabled:cursor-not-allowed has-disabled:text-text-disabled">
        <span className="flex min-h-6.5 items-center">
          <CheckboxInput
            {...inputProps}
            state={state ?? (error ? "error" : success ? "success" : "default")}
            aria-invalid={error ? true : inputProps["aria-invalid"]}
            aria-describedby={[inputProps["aria-describedby"], note ? noteId : null].filter(Boolean).join(" ") || undefined}
          />
        </span>
        <span className="flex min-h-6.5 flex-col justify-center">
          {label}
          {description && <span className="text-caption text-text-muted">{description}</span>}
        </span>
      </label>
      {note && (
        <span id={noteId} aria-live={error ? "assertive" : "polite"} className={`ps-space-10 text-caption ${error ? "text-danger" : "text-success"}`}>
          {note}
        </span>
      )}
    </span>
  );
};

/** Checkbox, by the UI library's name. */
const Checkbox = CheckboxField;

export { Checkbox, CheckboxField, CheckboxInput };
export type { CheckboxFieldProps, CheckboxInputProps, CheckboxState };
