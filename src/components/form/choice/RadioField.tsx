"use client";

import { useId } from "react";
import { FieldNote, labelClasses } from "../fields/InputField";

type RadioOption = { value: string; label: string };

type RadioFieldProps = {
  label: string;
  options: readonly RadioOption[];
  value: string;
  onChange: (value: string) => void;
  /** Groups the radios; defaults to a unique id. */
  name?: string;
  required?: boolean;
  error?: string;
};

/**
 * One choice from a few (spec §6.6): real radios, each a 20px round mark with
 * its label. The chosen one fills with the accent; its label goes from muted
 * to heading. Arrow keys move between them, as with any radio group.
 */
const RadioField = ({ label, options, value, onChange, name, required = false, error }: RadioFieldProps) => {
  const id = useId();
  const noteId = `${id}-note`;
  return (
    <fieldset className="flex w-full flex-col gap-space-3" aria-describedby={error ? noteId : undefined}>
      <legend className={labelClasses}>
        {label}
        {required && (
          <span aria-hidden className="ms-0.5 text-danger">
            *
          </span>
        )}
      </legend>
      <div className="mt-space-3 flex flex-wrap gap-x-space-10 gap-y-space-3">
        {options.map((opt) => (
          <label
            key={opt.value}
            className="inline-flex min-h-6.5 cursor-pointer items-center gap-space-4 text-body text-text-muted has-checked:text-text"
          >
            <input
              type="radio"
              name={name ?? id}
              value={opt.value}
              checked={value === opt.value}
              required={required}
              onChange={() => onChange(opt.value)}
              // The mark: a ring at rest (danger when invalid), the accent with
              // an ink dot at its centre when chosen.
              className={`size-5 shrink-0 cursor-pointer appearance-none rounded-full bg-surface-2 transition-[background-color,box-shadow] checked:bg-accent checked:shadow-[inset_0_0_0_6px_var(--accent),inset_0_0_0_10px_var(--accent-ink)] ${
                error ? "shadow-edge-danger" : "shadow-edge"
              }`}
            />
            {opt.label}
          </label>
        ))}
      </div>
      <FieldNote id={noteId} error={error} />
    </fieldset>
  );
};

export { RadioField };
export type { RadioFieldProps, RadioOption };
