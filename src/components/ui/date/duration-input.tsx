"use client";

import { useRef } from "react";
import { useUiStrings } from "../ui-strings";
import { Field, type FieldState } from "../field/field";
import { SegmentInput } from "./segment-input";

type DurationInputProps = FieldState & {
  label: string;
  info?: string;
  /** Total minutes, or null. */
  value: number | null;
  onChange: (minutes: number | null) => void;
  /** The most hours allowed. Default 99. */
  maxHours?: number;
  /** Minutes the arrow keys move. Default 5. */
  minuteStep?: number;
  className?: string;
  strings?: { hours?: string; minutes?: string; hoursUnit?: string; minutesUnit?: string };
};

/**
 * A length of time as hours and minutes ("2 hr 30 min"), each a spinbutton.
 * Stores total minutes, so 150 is 2 hr 30 min. Controlled.
 */
const DurationInput = ({ label, info, value, onChange, maxHours = 99, minuteStep = 5, className = "", strings, ...state }: DurationInputProps) => {
  const { t } = useUiStrings();
  const minutesRef = useRef<HTMLInputElement>(null);
  const hours = value === null ? null : Math.floor(value / 60);
  const minutes = value === null ? null : value % 60;
  const emit = (h: number | null, m: number | null) => onChange(h === null && m === null ? null : (h ?? 0) * 60 + (m ?? 0));

  return (
    <Field label={label} info={info} {...state} className={`min-h-field ${className}`}>
      {(control) => (
        <span className="flex items-center gap-space-2">
          <SegmentInput
            id={control.id}
            label={strings?.hours ?? t.hours}
            value={hours}
            min={0}
            max={maxHours}
            width={String(maxHours).length}
            onChange={(h) => emit(h, minutes)}
            onFilled={() => minutesRef.current?.focus()}
            disabled={state.disabled}
            readOnly={control.readOnly}
            invalid={!!state.error}
            describedBy={control["aria-describedby"]}
          />
          <span aria-hidden className="text-text-muted">
            {strings?.hoursUnit ?? t.hoursUnit}
          </span>
          <SegmentInput
            ref={minutesRef}
            label={strings?.minutes ?? t.minutes}
            value={minutes}
            min={0}
            max={59}
            step={minuteStep}
            onChange={(m) => emit(hours, m)}
            disabled={state.disabled}
            readOnly={control.readOnly}
            invalid={!!state.error}
            describedBy={control["aria-describedby"]}
          />
          <span aria-hidden className="text-text-muted">
            {strings?.minutesUnit ?? t.minutesUnit}
          </span>
        </span>
      )}
    </Field>
  );
};

export { DurationInput };
export type { DurationInputProps };
