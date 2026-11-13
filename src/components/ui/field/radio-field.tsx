"use client";

import { useId } from "react";
import { labelClasses } from "./input-field";

type RadioOption = { value: string; label: string; description?: string; disabled?: boolean };

type RadioFieldProps = {
  label: string;
  options: readonly RadioOption[];
  value: string;
  onChange: (value: string) => void;
  /** Groups the radios; defaults to a unique id. */
  name?: string;
  required?: boolean;
  disabled?: boolean;
  /** `horizontal` wraps the options in a row (default); `vertical` stacks them. */
  orientation?: "horizontal" | "vertical";
  hint?: string;
  error?: string;
  success?: string;
};

/**
 * One choice from a few (spec §6.6): real radios, each a 20px round mark with
 * its label and an optional line under it. The chosen one fills with the
 * accent; its label goes from muted to heading. They are native radios, so
 * the arrow keys move the choice and mirror in Arabic without extra code.
 */
const RadioField = ({ label, options, value, onChange, name, required = false, disabled = false, orientation = "horizontal", hint, error, success }: RadioFieldProps) => {
  const id = useId();
  const noteId = `${id}-note`;
  const note = error ?? success ?? hint;
  return (
    <fieldset disabled={disabled} className="flex w-full flex-col gap-space-3" aria-describedby={note ? noteId : undefined} aria-invalid={error ? true : undefined}>
      <legend className={labelClasses}>
        {label}
        {required && (
          <span aria-hidden className="ms-0.5 text-danger">
            *
          </span>
        )}
      </legend>
      <div className={`mt-space-3 flex ${orientation === "vertical" ? "flex-col gap-space-4" : "flex-wrap gap-x-space-10 gap-y-space-3"}`}>
        {options.map((opt) => (
          <label
            key={opt.value}
            className="inline-flex min-h-6.5 cursor-pointer items-start gap-space-4 text-body text-text-muted has-checked:text-text has-disabled:cursor-not-allowed has-disabled:text-text-disabled"
          >
            <span className="flex min-h-6.5 items-center">
              <input
                type="radio"
                name={name ?? id}
                value={opt.value}
                checked={value === opt.value}
                required={required}
                disabled={opt.disabled}
                onChange={() => onChange(opt.value)}
                // The mark: a ring at rest (danger when invalid), the accent with
                // an ink dot at its centre when chosen.
                className={`size-5 shrink-0 cursor-pointer appearance-none rounded-full bg-surface-2 transition-[background-color,box-shadow] checked:bg-accent checked:shadow-[inset_0_0_0_6px_var(--accent),inset_0_0_0_10px_var(--accent-ink)] disabled:cursor-not-allowed ${
                  error ? "shadow-edge-danger" : "shadow-edge"
                }`}
              />
            </span>
            <span className="flex min-h-6.5 flex-col justify-center">
              {opt.label}
              {opt.description && <span className="text-caption text-text-muted">{opt.description}</span>}
            </span>
          </label>
        ))}
      </div>
      {note && (
        <span id={noteId} aria-live={error ? "assertive" : "polite"} className={`px-space-5 text-caption ${error ? "text-danger" : success ? "text-success" : "text-text-faint"}`}>
          {note}
        </span>
      )}
    </fieldset>
  );
};

/** RadioGroup, by the UI library's name. */
const RadioGroup = RadioField;

export { RadioField, RadioGroup };
export type { RadioFieldProps, RadioOption };
