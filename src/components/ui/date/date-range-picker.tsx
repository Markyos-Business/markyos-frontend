"use client";

import { useState } from "react";
import { Button } from "../button/button";
import { Icon } from "../icon";
import { Popover } from "../overlay/popover";
import { useUiStrings } from "../ui-strings";
import { labelClasses } from "../field/input-field";
import { Calendar, type CalendarProps } from "./calendar";
import { addDays, endOfMonth, formatIso, startOfMonth, toIso, type IsoDate } from "./date-utils";

type DateRangeValue = { from?: IsoDate; to?: IsoDate };
type RangePreset = "today" | "last7" | "thisMonth" | "custom";

type DateRangePickerProps = Pick<CalendarProps, "weekStart" | "min" | "max" | "isDisabled" | "hijri" | "digits"> & {
  label: string;
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
  /** Which presets to offer, in order. Default all four. */
  presets?: RangePreset[];
  placeholder?: string;
  disabled?: boolean;
  hint?: string;
  error?: string;
  className?: string;
  /** For tests and stories: what "today" is. */
  today?: IsoDate;
};

/** The span a preset stands for, counted back from today. */
function presetRange(preset: Exclude<RangePreset, "custom">, today: IsoDate): Required<DateRangeValue> {
  if (preset === "today") return { from: today, to: today };
  if (preset === "last7") return { from: addDays(today, -6), to: today };
  return { from: startOfMonth(today), to: endOfMonth(today) };
}

/**
 * A span of days: presets (Today, Last 7 days, This month) beside a month to
 * pick the two ends from, with Clear and Apply. Nothing changes until Apply,
 * so a half-picked range never reaches the page. Shows "12 Sep – 30 Sep 2026".
 */
const DateRangePicker = ({ label, value, onChange, presets = ["today", "last7", "thisMonth", "custom"], placeholder, disabled = false, hint, error, className = "", today: givenToday, ...calendar }: DateRangePickerProps) => {
  const { t, lang } = useUiStrings();
  const today = givenToday ?? toIso(new Date());
  const [draft, setDraft] = useState<DateRangeValue>(value);
  const fmt = (iso: IsoDate) => formatIso(iso, lang, calendar.digits);
  const text = value.from ? `${fmt(value.from)} – ${value.to ? fmt(value.to) : "…"}` : (placeholder ?? t.anyTime);
  const names: Record<RangePreset, string> = { today: t.today, last7: t.last7Days, thisMonth: t.thisMonth, custom: t.customRange };
  const pick = (day: IsoDate) => setDraft(!draft.from || draft.to || day < draft.from ? { from: day } : { from: draft.from, to: day });
  const active = presets.find((p) => p !== "custom" && draft.from && draft.to && presetRange(p, today).from === draft.from && presetRange(p, today).to === draft.to) ?? (draft.from ? "custom" : undefined);

  return (
    <div className={`flex flex-col gap-space-2 ${className}`}>
      <span className={labelClasses}>{label}</span>
      {disabled ? (
        <span className="mk-field flex h-control-sm items-center gap-space-3 text-text-disabled" aria-disabled="true">
          <Icon name="calendar" size={18} />
          {text}
        </span>
      ) : (
        <Popover
          label={label}
          align="start"
          trigger="block"
          className="w-full"
          width={calendar.hijri ? 520 : 480}
          button={
            <span className={`mk-field flex h-control-sm w-full items-center gap-space-3 text-start ${value.from ? "" : "text-text-disabled"}`} data-state={error ? "error" : undefined}>
              <Icon name="calendar" size={18} className="shrink-0 text-text-muted" />
              <span className="truncate">{text}</span>
            </span>
          }
        >
          {(close) => (
            <div className="flex flex-col gap-space-4 p-space-5 sm:flex-row">
              <div role="group" aria-label={label} className="flex shrink-0 flex-row flex-wrap gap-space-2 sm:w-36 sm:flex-col">
                {presets.map((p) => (
                  <button
                    key={p}
                    type="button"
                    aria-pressed={active === p}
                    onClick={() => setDraft(p === "custom" ? {} : presetRange(p, today))}
                    className={`rounded-lg px-space-4 py-space-2 text-start text-caption font-medium transition-colors ${active === p ? "bg-accent-soft text-accent-on-soft" : "text-text-muted hover:bg-ink-soft hover:text-text"}`}
                  >
                    {names[p]}
                  </button>
                ))}
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-space-4">
                <Calendar autoFocus range={draft} onPick={pick} today={today} {...calendar} />
                <div className="flex justify-end gap-space-3">
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => {
                      setDraft({});
                      onChange({});
                      close();
                    }}
                  >
                    {t.clear}
                  </Button>
                  <Button
                    size="xs"
                    variant="primary"
                    disabled={!draft.from}
                    onClick={() => {
                      onChange(draft.to ? draft : { from: draft.from, to: draft.from });
                      close();
                    }}
                  >
                    {t.apply}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Popover>
      )}
      {(error || hint) && <span className={`px-space-5 text-caption ${error ? "text-danger" : "text-text-faint"}`}>{error ?? hint}</span>}
    </div>
  );
};

export { DateRangePicker, presetRange };
export type { DateRangePickerProps, DateRangeValue, RangePreset };
