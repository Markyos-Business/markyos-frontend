"use client";

import { useState } from "react";
import { Popover } from "../../ui/overlays/Popover";
import { Icon } from "../../ui/primitives/Icon";
import { Button } from "../../ui/buttons/Button";
import { formatDayMonth } from "../../ui/date/dateFormat";
import { useUiStrings } from "../../ui/i18n/uiStrings";

type DateRange = { from?: string; to?: string };

type DateRangeButtonProps = {
  /** ISO dates, "2026-10-01". */
  value: DateRange;
  onChange: (range: DateRange) => void;
  /** The button's accessible name. Default: the kit's "Date range". */
  label?: string;
  /** What the button says with no range. Default: the kit's "Any time". */
  placeholder?: string;
};

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const parse = (s: string) => new Date(`${s}T00:00:00`);

/** An outlined button showing the range ("1 Oct – 28 Oct"), with a month calendar to pick it. */
const DateRangeButton = ({ value, onChange, label, placeholder }: DateRangeButtonProps) => {
  const { t, lang } = useUiStrings();
  // "12 Sep", never US order (spec §7); Western digits in Arabic too.
  const fmt = { format: (d: Date) => formatDayMonth(d, lang) };
  const [draft, setDraft] = useState<DateRange>(value);
  const [month, setMonth] = useState(() => (value.from ? parse(value.from) : new Date()));
  const text = value.from ? `${fmt.format(parse(value.from))} – ${value.to ? fmt.format(parse(value.to)) : "…"}` : placeholder ?? t.anyTime;

  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const lead = (first.getDay() + 6) % 7; // weeks start on Monday
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => iso(new Date(month.getFullYear(), month.getMonth(), i + 1)))];
  const pick = (day: string) => setDraft(!draft.from || draft.to || day < draft.from ? { from: day } : { from: draft.from, to: day });
  const inRange = (day: string) => !!draft.from && !!draft.to && day > draft.from && day < draft.to;
  const locale = lang === "ar" ? "ar-SA-u-nu-latn-ca-gregory" : "en-GB";
  const monthName = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(month);
  const dayName = new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  // Monday to Sunday: 5 Jan 2026 was a Monday. Arabic names are long, so one letter each.
  const weekdayFmt = new Intl.DateTimeFormat(locale, { weekday: lang === "ar" ? "narrow" : "short" });
  const weekdays = Array.from({ length: 7 }, (_, i) => weekdayFmt.format(new Date(2026, 0, 5 + i)));

  return (
    <Popover
      label={label ?? t.dateRange}
      align="start"
      width={300}
      button={
        <span className="flex h-control-sm items-center gap-space-3 rounded-lg bg-ink-soft px-space-5 text-body font-medium text-text shadow-edge">
          <Icon name="calendar" size={16} className="text-text-muted" />
          {text}
        </span>
      }
    >
      {(close) => (
        <div className="flex flex-col gap-space-4 p-space-5">
          <div className="flex items-center justify-between">
            <button type="button" aria-label={t.previousMonth} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="grid size-8 place-items-center rounded-lg hover:bg-ink-soft">
              <Icon name="angle-left" size={16} className="rtl:-scale-x-100" />
            </button>
            <span className="text-body font-medium text-text">{monthName}</span>
            <button type="button" aria-label={t.nextMonth} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="grid size-8 place-items-center rounded-lg hover:bg-ink-soft">
              <Icon name="angle-right" size={16} className="rtl:-scale-x-100" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {weekdays.map((d, i) => (
              <span key={i} aria-hidden className="text-ui-2xs text-text-muted">
                {d}
              </span>
            ))}
            {cells.map((day, i) =>
              day ? (
                <button
                  key={day}
                  type="button"
                  aria-label={dayName.format(parse(day))}
                  aria-pressed={day === draft.from || day === draft.to}
                  onClick={() => pick(day)}
                  className={`h-8 rounded-md text-caption ${
                    day === draft.from || day === draft.to ? "bg-accent font-medium text-accent-ink" : inRange(day) ? "bg-accent-soft text-accent-on-soft" : "text-text hover:bg-ink-soft"
                  }`}
                >
                  {Number(day.slice(8))}
                </button>
              ) : (
                <span key={`gap-${i}`} />
              )
            )}
          </div>
          <div className="flex justify-end gap-space-3">
            <Button size="xs" variant="ghost" onClick={() => { setDraft({}); onChange({}); close(); }}>{t.clear}</Button>
            <Button size="xs" variant="primary" disabled={!draft.from} onClick={() => { onChange(draft); close(); }}>{t.apply}</Button>
          </div>
        </div>
      )}
    </Popover>
  );
};

export { DateRangeButton };
export type { DateRange, DateRangeButtonProps };
