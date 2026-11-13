"use client";

import { useState } from "react";
import { Icon } from "../icon";
import { Popover } from "../overlay/popover";
import { useUiStrings } from "../ui-strings";
import { Field, type FieldState } from "../field/field";
import { describedBy } from "../field/input-field";
import { Calendar, type CalendarProps } from "./calendar";
import { formatIso, parseTypedDate, type IsoDate } from "./date-utils";

type DatePickerProps = Omit<FieldState, "readOnly"> &
  Pick<CalendarProps, "weekStart" | "min" | "max" | "isDisabled" | "hijri" | "digits"> & {
    label: string;
    info?: string;
    /** "YYYY-MM-DD", or null. */
    value: IsoDate | null;
    onChange: (value: IsoDate | null) => void;
    onBlur?: () => void;
    placeholder?: string;
    readOnly?: boolean;
    className?: string;
    strings?: { chooseDate?: string; invalidDate?: string; dateFrom?: (d: string) => string; dateUntil?: (d: string) => string; dateUnavailable?: string };
  };

/**
 * A date, typed or picked. Typing takes "12 Sep 2026", "12/09/2026" or
 * "2026-09-12" (day first, never US order), Arabic month names and digits
 * too, and is checked on leaving the field or Enter: a date that doesn't
 * exist, falls outside min and max, or is disabled is an error that says
 * which. The calendar button opens a month with focus on the chosen day.
 * Stores "YYYY-MM-DD". Controlled.
 */
const DatePicker = ({ label, info, value, onChange, onBlur, placeholder, weekStart, min, max, isDisabled, hijri, digits, readOnly, className = "", strings, error, ...state }: DatePickerProps) => {
  const { t, lang } = useUiStrings();
  const shown = value ? formatIso(value, lang, digits) : "";
  const [text, setText] = useState(shown);
  const [problem, setProblem] = useState<string | null>(null);
  // A value set from outside (the calendar, a reset), or a change of
  // language or digits, replaces the text with the date written anew.
  const shownKey = `${value}|${lang}|${digits}`;
  const [lastKey, setLastKey] = useState(shownKey);
  if (shownKey !== lastKey) {
    setLastKey(shownKey);
    setText(shown);
  }

  const check = (iso: IsoDate): string | null => {
    if (min && iso < min) return (strings?.dateFrom ?? t.dateFrom)(formatIso(min, lang, digits));
    if (max && iso > max) return (strings?.dateUntil ?? t.dateUntil)(formatIso(max, lang, digits));
    if (isDisabled?.(iso)) return strings?.dateUnavailable ?? t.dateUnavailable;
    return null;
  };

  const commit = () => {
    if (!text.trim()) {
      setProblem(null);
      if (value !== null) onChange(null);
      return;
    }
    const iso = parseTypedDate(text);
    if (!iso) return setProblem(strings?.invalidDate ?? t.invalidDate);
    const why = check(iso);
    setProblem(why);
    if (!why) {
      onChange(iso);
      setText(formatIso(iso, lang, digits));
    }
  };

  const blocked = state.disabled || state.locked || readOnly;

  return (
    <Field
      label={label}
      info={info}
      {...state}
      readOnly={readOnly}
      error={error ?? problem ?? undefined}
      className={`min-h-field ${className}`}
      action={
        !blocked && (
          <Popover label={strings?.chooseDate ?? t.chooseDate} align="end" width={hijri ? 340 : 300} button={<Icon name="calendar" size={18} className="text-text-muted" />}>
            {(close) => (
              <div className="p-space-5">
                <Calendar
                  autoFocus
                  selected={value}
                  weekStart={weekStart}
                  min={min}
                  max={max}
                  isDisabled={isDisabled}
                  hijri={hijri}
                  digits={digits}
                  onPick={(day) => {
                    setProblem(null);
                    onChange(day);
                    close();
                  }}
                />
              </div>
            )}
          </Popover>
        )
      }
    >
      {(control) => (
        <input
          {...control}
          type="text"
          autoComplete="off"
          value={text}
          placeholder={placeholder ?? formatIso("2026-09-12", lang, digits)}
          aria-describedby={describedBy(undefined, control)}
          onChange={(e) => {
            setText(e.target.value);
            if (problem) setProblem(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            }
          }}
          onBlur={() => {
            commit();
            onBlur?.();
          }}
          className="mk-field-control"
        />
      )}
    </Field>
  );
};

export { DatePicker };
export type { DatePickerProps };
