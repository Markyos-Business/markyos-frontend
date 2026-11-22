"use client";

import { useId, useState } from "react";
import { Button } from "../button/button";
import { Icon } from "../icon";
import { Popover } from "../overlay/popover";
import { useUiStrings } from "../ui-strings";
import { labelClasses } from "../field/input-field";
import { Calendar, type CalendarProps } from "./calendar";
import {
  addDays,
  endOfMonth,
  formatIso,
  startOfMonth,
  toIso,
  type IsoDate,
} from "./date-utils";

type DateRangeValue = { from?: IsoDate; to?: IsoDate };
type RangePreset = "today" | "last7" | "thisMonth" | "custom";

type DateRangePickerProps = Pick<
  CalendarProps,
  "weekStart" | "min" | "max" | "isDisabled" | "hijri" | "digits"
> & {
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
function presetRange(
  preset: Exclude<RangePreset, "custom">,
  today: IsoDate,
): Required<DateRangeValue> {
  if (preset === "today") return { from: today, to: today };
  if (preset === "last7") return { from: addDays(today, -6), to: today };
  return { from: startOfMonth(today), to: endOfMonth(today) };
}

type Blocked = (day: IsoDate) => boolean;

/**
 * A preset inside the allowed days: clipped to min and max, its ends moved
 * inward past disabled days; null when nothing of it can be chosen.
 */
function allowedRange(
  range: Required<DateRangeValue>,
  min: IsoDate | undefined,
  max: IsoDate | undefined,
  blocked: Blocked,
): Required<DateRangeValue> | null {
  let from = min && range.from < min ? min : range.from;
  let to = max && range.to > max ? max : range.to;
  while (from <= to && blocked(from)) from = addDays(from, 1);
  while (to >= from && blocked(to)) to = addDays(to, -1);
  return from <= to ? { from, to } : null;
}

/**
 * A span of days: presets (Today, Last 7 days, This month) beside a month to
 * pick the two ends from, with Clear and Apply. Nothing changes until Apply,
 * so a half-picked range never reaches the page. Shows "12 Sep – 30 Sep 2026".
 */
const DateRangePicker = ({
  label,
  value,
  onChange,
  presets = ["today", "last7", "thisMonth", "custom"],
  placeholder,
  disabled = false,
  hint,
  error,
  className = "",
  today: givenToday,
  ...calendar
}: DateRangePickerProps) => {
  const { t, lang } = useUiStrings();
  const today = givenToday ?? toIso(new Date());
  const noteId = `${useId()}-note`;
  const textId = `${noteId}-value`;
  const [draft, setDraft] = useState<DateRangeValue>(value);
  // A range set from outside (a reset, another record) replaces the draft.
  const key = `${value.from ?? ""}|${value.to ?? ""}`;
  const [seen, setSeen] = useState(key);
  if (key !== seen) {
    setSeen(key);
    setDraft(value);
  }
  const blocked: Blocked = (day) =>
    (calendar.min !== undefined && day < calendar.min) ||
    (calendar.max !== undefined && day > calendar.max) ||
    (calendar.isDisabled?.(day) ?? false);
  const fitted = (p: Exclude<RangePreset, "custom">) =>
    allowedRange(presetRange(p, today), calendar.min, calendar.max, blocked);
  // Apply only what the calendar itself would let you choose.
  const valid =
    !!draft.from && !blocked(draft.from) && (!draft.to || !blocked(draft.to));
  const fmt = (iso: IsoDate) => formatIso(iso, lang, calendar.digits);
  const text = value.from
    ? `${fmt(value.from)} – ${value.to ? fmt(value.to) : "…"}`
    : (placeholder ?? t.anyTime);
  const names: Record<RangePreset, string> = {
    today: t.today,
    last7: t.last7Days,
    thisMonth: t.thisMonth,
    custom: t.customRange,
  };
  const pick = (day: IsoDate) =>
    setDraft(
      !draft.from || draft.to || day < draft.from
        ? { from: day }
        : { from: draft.from, to: day },
    );
  const active =
    presets.find(
      (p) =>
        p !== "custom" &&
        draft.from &&
        draft.to &&
        fitted(p)?.from === draft.from &&
        fitted(p)?.to === draft.to,
    ) ?? (draft.from ? "custom" : undefined);

  return (
    <div className={`flex flex-col gap-space-2 ${className}`}>
      <span className={labelClasses}>{label}</span>
      {disabled ? (
        <span
          className="mk-field flex h-control-sm items-center gap-space-3 text-text-disabled"
          aria-disabled="true"
        >
          <Icon name="calendar" size={18} />
          {text}
        </span>
      ) : (
        <Popover
          label={label}
          align="start"
          look="field"
          // The field is the trigger itself: one shape for hover, focus and open.
          triggerClassName={`h-control-sm gap-space-3 ${value.from ? "" : "text-text-disabled"}`}
          triggerData={{ "data-state": error ? "error" : undefined }}
          className="w-full"
          width={calendar.hijri ? 520 : 480}
          describedBy={[textId, error || hint ? noteId : null]
            .filter(Boolean)
            .join(" ")}
          onOpen={() => setDraft(value)}
          button={
            <>
              <Icon
                name="calendar"
                size={18}
                className="shrink-0 text-text-muted"
              />
              <span id={textId} className="truncate">
                {text}
              </span>
            </>
          }
        >
          {(close) => (
            <div className="flex flex-col gap-space-4 p-space-5 sm:flex-row">
              <div
                role="group"
                aria-label={label}
                className="flex shrink-0 flex-row flex-wrap gap-space-2 sm:w-36 sm:flex-col"
              >
                {presets.map((p) => {
                  const range = p === "custom" ? {} : fitted(p);
                  return (
                    <button
                      key={p}
                      type="button"
                      aria-pressed={active === p}
                      // A preset entirely outside the allowed days can't be chosen.
                      disabled={range === null}
                      onClick={() => range && setDraft(range)}
                      className={`rounded-lg px-space-4 py-space-2 text-start text-caption font-medium transition-colors disabled:cursor-not-allowed disabled:text-text-disabled ${active === p ? "bg-accent-soft text-accent-on-soft" : "text-text-muted enabled:hover:bg-ink-soft enabled:hover:text-text"}`}
                    >
                      {names[p]}
                    </button>
                  );
                })}
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-space-4">
                <Calendar
                  autoFocus
                  range={draft}
                  onPick={pick}
                  today={today}
                  {...calendar}
                />
                <div className="flex justify-end gap-space-3">
                  <Button
                    size="sm"
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
                    size="sm"
                    variant="primary"
                    disabled={!valid}
                    onClick={() => {
                      onChange(
                        draft.to ? draft : { from: draft.from, to: draft.from },
                      );
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
      {(error || hint) && (
        <span
          id={noteId}
          role={error ? "alert" : undefined}
          className={`px-space-5 text-caption ${error ? "text-danger" : "text-text-faint"}`}
        >
          {error ?? hint}
        </span>
      )}
    </div>
  );
};

export { DateRangePicker, allowedRange, presetRange };
export type { DateRangePickerProps, DateRangeValue, RangePreset };
