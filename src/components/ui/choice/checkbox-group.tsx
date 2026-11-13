"use client";

import { useId, useState } from "react";
import { CheckboxField, CheckboxInput } from "../field/checkbox-field";
import { labelClasses } from "../field/input-field";
import { useUiStrings } from "../ui-strings";

type CheckboxOption = { value: string; label: string; description?: string; disabled?: boolean };

type CheckboxGroupProps = {
  label: string;
  options: readonly CheckboxOption[];
  value: readonly string[];
  onChange: (value: string[]) => void;
  /** At least this many; said once the person has been through the group. */
  min?: number;
  /** At most this many; the rest are disabled once it's reached. */
  max?: number;
  /** A "Select all" box above the options, showing a dash when some are chosen. */
  selectAll?: boolean;
  orientation?: "vertical" | "horizontal";
  required?: boolean;
  disabled?: boolean;
  hint?: string;
  error?: string;
  success?: string;
  strings?: { selectAll?: string; chooseAtLeast?: (n: number) => string; chooseUpTo?: (n: number) => string };
};

/**
 * Several choices from a list: a real `<fieldset>` and `<legend>`, so the
 * group is announced with its name. `max` stops further picks and says why;
 * `min` waits until focus has left the group before calling a short choice an
 * error, so nobody is scolded before they start.
 */
const CheckboxGroup = ({
  label,
  options,
  value,
  onChange,
  min,
  max,
  selectAll = false,
  orientation = "vertical",
  required = false,
  disabled = false,
  hint,
  error,
  success,
  strings,
}: CheckboxGroupProps) => {
  const { t } = useUiStrings();
  const id = useId();
  const noteId = `${id}-note`;
  const [visited, setVisited] = useState(false);
  const chosen = new Set(value);
  const enabled = options.filter((o) => !o.disabled);
  const atMax = max !== undefined && chosen.size >= max;
  const short = min !== undefined && visited && chosen.size < min;
  const shownError = error ?? (short ? (strings?.chooseAtLeast ?? t.chooseAtLeast)(min!) : undefined);
  const note = shownError ?? success ?? (atMax ? (strings?.chooseUpTo ?? t.chooseUpTo)(max!) : hint);
  const allChosen = enabled.length > 0 && enabled.every((o) => chosen.has(o.value));
  // "Select all" can't keep its promise past a maximum, so it isn't offered then.
  const offerAll = selectAll && (max === undefined || max >= enabled.length);

  const toggle = (v: string, on: boolean) => {
    const next = on ? [...value, v] : value.filter((x) => x !== v);
    // In the options' order, not the order they were ticked.
    onChange(options.map((o) => o.value).filter((x) => next.includes(x)));
  };

  return (
    <fieldset
      disabled={disabled}
      aria-describedby={note ? noteId : undefined}
      aria-invalid={shownError ? true : undefined}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setVisited(true);
      }}
      className="flex w-full flex-col gap-space-3"
    >
      <legend className={labelClasses}>
        {label}
        {required && (
          <span aria-hidden className="ms-0.5 text-danger">
            *
          </span>
        )}
      </legend>
      {offerAll && (
        <label className="mt-space-3 inline-flex min-h-6.5 cursor-pointer select-none items-center gap-space-4 text-body font-medium text-text">
          <CheckboxInput
            checked={allChosen}
            indeterminate={!allChosen && chosen.size > 0}
            onChange={(e) => onChange(e.target.checked ? [...options.filter((o) => !o.disabled || chosen.has(o.value)).map((o) => o.value)] : value.filter((v) => options.find((o) => o.value === v)?.disabled))}
          />
          {strings?.selectAll ?? t.selectAllOptions}
        </label>
      )}
      <div className={`flex ${orientation === "vertical" ? "flex-col gap-space-4" : "flex-wrap gap-x-space-10 gap-y-space-3"} ${offerAll ? "ps-space-10" : "mt-space-3"}`}>
        {options.map((o) => (
          <CheckboxField
            key={o.value}
            label={o.label}
            description={o.description}
            checked={chosen.has(o.value)}
            disabled={o.disabled || (atMax && !chosen.has(o.value))}
            state={shownError ? "error" : "default"}
            onChange={(e) => toggle(o.value, e.target.checked)}
          />
        ))}
      </div>
      {note && (
        <span id={noteId} aria-live={shownError ? "assertive" : "polite"} className={`px-space-5 text-caption ${shownError ? "text-danger" : success ? "text-success" : "text-text-faint"}`}>
          {note}
        </span>
      )}
    </fieldset>
  );
};

export { CheckboxGroup };
export type { CheckboxGroupProps, CheckboxOption };
