"use client";

import { useState } from "react";
import { Popover } from "../overlay/popover";
import { Icon } from "../icon";
import { Button } from "../button/button";
import { formatDayMonth } from "../app-date/date-format";
import { useUiStrings } from "../ui-strings";
import { Calendar } from "../date/calendar";

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

const parse = (s: string) => new Date(`${s}T00:00:00`);

/** An outlined button showing the range ("1 Oct – 28 Oct"), with a month calendar to pick it. */
const DateRangeButton = ({ value, onChange, label, placeholder }: DateRangeButtonProps) => {
  const { t, lang } = useUiStrings();
  // "12 Sep", never US order (spec §7); Western digits in Arabic too.
  const fmt = { format: (d: Date) => formatDayMonth(d, lang) };
  const [draft, setDraft] = useState<DateRange>(value);
  const text = value.from ? `${fmt.format(parse(value.from))} – ${value.to ? fmt.format(parse(value.to)) : "…"}` : placeholder ?? t.anyTime;

  const pick = (day: string) => setDraft(!draft.from || draft.to || day < draft.from ? { from: day } : { from: draft.from, to: day });

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
          {/* The kit's calendar; weeks start on Monday here, as they always have. */}
          <Calendar autoFocus range={draft} onPick={pick} weekStart={1} />
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
