"use client";

import { useUiStrings } from "../ui-strings";
import type { FieldState } from "../field/field";
import { DatePicker, type DatePickerProps } from "./date-picker";
import { TimePicker } from "./time-picker";

type DateTimePickerProps = FieldState &
  Pick<DatePickerProps, "weekStart" | "min" | "max" | "isDisabled" | "hijri" | "digits"> & {
    label: string;
    /** "YYYY-MM-DDTHH:mm" in local time, or null. */
    value: string | null;
    onChange: (value: string | null) => void;
    hour12?: boolean;
    minuteStep?: number;
    className?: string;
    strings?: { date?: string; time?: string };
  };

/**
 * A date and a time together, under one legend: the date picker and the time
 * segments side by side from 640px up. A time without a date keeps the time
 * until a date is chosen. Stores "YYYY-MM-DDTHH:mm". Controlled.
 */
const DateTimePicker = ({ label, value, onChange, hour12, minuteStep, className = "", strings, error, warning, success, hint, required, ...rest }: DateTimePickerProps) => {
  const { t } = useUiStrings();
  const [date, time] = value ? value.split("T") : [null, null];
  const { weekStart, min, max, isDisabled, hijri, digits, ...state } = rest;
  return (
    <fieldset className={`flex min-w-0 flex-col gap-space-2 ${className}`}>
      <legend className="mb-space-2 px-space-5 text-caption text-text-muted">
        {label}
        {required && (
          <span aria-hidden className="ms-0.5 text-danger">
            *
          </span>
        )}
      </legend>
      <div className="grid grid-cols-1 gap-x-space-6 gap-y-space-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,11rem)]">
        <DatePicker
          label={strings?.date ?? t.date}
          value={date}
          onChange={(d) => onChange(d ? `${d}T${time ?? "09:00"}` : null)}
          {...{ weekStart, min, max, isDisabled, hijri, digits }}
          {...state}
          required={required}
          error={error}
          warning={warning}
          success={success}
          hint={hint}
        />
        <TimePicker
          label={strings?.time ?? t.time}
          value={time}
          onChange={(tm) => onChange(date ? `${date}T${tm ?? "00:00"}` : null)}
          hour12={hour12}
          minuteStep={minuteStep}
          {...state}
          disabled={state.disabled || !date}
        />
      </div>
    </fieldset>
  );
};

export { DateTimePicker };
export type { DateTimePickerProps };
