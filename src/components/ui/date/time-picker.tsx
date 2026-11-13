"use client";

import { useRef } from "react";
import { useUiStrings } from "../ui-strings";
import { Field, type FieldState } from "../field/field";
import { SegmentInput } from "./segment-input";

type TimePickerProps = FieldState & {
  label: string;
  info?: string;
  /** "HH:mm" in 24 hours ("14:30"), or null. */
  value: string | null;
  onChange: (value: string | null) => void;
  /** Show 1–12 with AM and PM. Stored as 24 hours either way. Default false. */
  hour12?: boolean;
  /** Minutes the arrow keys move. Default 5. */
  minuteStep?: number;
  className?: string;
  strings?: { hour?: string; minute?: string; am?: string; pm?: string };
};

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * A time of day as hour and minute segments, each a spinbutton: arrows step
 * it, typing fills it and moves on. `hour12` adds an AM/PM switch; the value
 * is "HH:mm" in 24 hours regardless. Left to right in Arabic too, as times
 * are written. Controlled.
 */
const TimePicker = ({ label, info, value, onChange, hour12 = false, minuteStep = 5, className = "", strings, ...state }: TimePickerProps) => {
  const { t } = useUiStrings();
  const minuteRef = useRef<HTMLInputElement>(null);
  const [h24, m] = value ? value.split(":").map(Number) : [null, null];
  const pm = h24 !== null && h24 >= 12;
  const shownHour = h24 === null ? null : hour12 ? ((h24 + 11) % 12) + 1 : h24;
  const blocked = state.disabled || state.locked || state.readOnly;

  const emit = (hour: number | null, minute: number | null, isPm = pm) => {
    if (hour === null && minute === null) return onChange(null);
    const h = hour === null ? 0 : hour12 ? (hour % 12) + (isPm ? 12 : 0) : hour;
    onChange(`${pad(h)}:${pad(minute ?? 0)}`);
  };

  return (
    <Field label={label} info={info} {...state} boxDir="ltr" className={`min-h-field ${className}`}>
      {(control) => (
        <span className="flex items-center gap-space-1">
          <SegmentInput
            id={control.id}
            label={strings?.hour ?? t.hour}
            value={shownHour}
            min={hour12 ? 1 : 0}
            max={hour12 ? 12 : 23}
            onChange={(hour) => emit(hour, m)}
            onFilled={() => minuteRef.current?.focus()}
            disabled={state.disabled}
            readOnly={control.readOnly}
            invalid={!!state.error}
            describedBy={control["aria-describedby"]}
          />
          <span aria-hidden className="text-text-muted">
            :
          </span>
          <SegmentInput
            ref={minuteRef}
            label={strings?.minute ?? t.minute}
            value={m}
            min={0}
            max={59}
            step={minuteStep}
            onChange={(minute) => emit(shownHour, minute)}
            disabled={state.disabled}
            readOnly={control.readOnly}
            invalid={!!state.error}
            describedBy={control["aria-describedby"]}
          />
          {hour12 && (
            <button
              type="button"
              // A switch between the two halves of the day, named by what it shows.
              role="switch"
              aria-checked={pm}
              aria-label={`${strings?.am ?? t.am} / ${strings?.pm ?? t.pm}`}
              disabled={blocked}
              onClick={() => emit(shownHour ?? 12, m ?? 0, !pm)}
              className="ms-space-3 h-6 rounded-md bg-surface-2 px-space-3 text-caption font-medium text-text shadow-edge disabled:cursor-not-allowed disabled:text-text-disabled"
            >
              {pm ? (strings?.pm ?? t.pm) : (strings?.am ?? t.am)}
            </button>
          )}
        </span>
      )}
    </Field>
  );
};

export { TimePicker };
export type { TimePickerProps };
