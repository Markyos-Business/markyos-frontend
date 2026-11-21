"use client";

import { useId, useState } from "react";
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
  const { t, lang } = useUiStrings(); const valueId = useId(); const active = !!(value.from || value.to);
  // "12 Sep", never US order (spec §7); Western digits in Arabic too.
  const fmt = { format: (d: Date) => formatDayMonth(d, lang) };
  const [draft, setDraft] = useState<DateRange>(value);
  const text = value.from ? `${fmt.format(parse(value.from))} – ${value.to ? fmt.format(parse(value.to)) : "…"}` : placeholder ?? t.anyTime;

  const pick = (day: string) => setDraft(!draft.from || draft.to || day < draft.from ? { from: day } : { from: draft.from, to: day });

  return (
    <Popover
      label={label ?? t.dateRange}
      className="min-w-0 w-full"
      trigger="block"
      describedBy={active ? valueId : undefined}
      onOpen={() => setDraft(value)}
      align="start"
      width={300}
      button={
        // The field shape (MARKYOS_UI §2.6), like the filter selects beside it;
        // an active range takes the accent tint and underline.
        <span data-filter-control data-active={active || undefined} className={`mk-field flex w-full min-w-0 items-center gap-ctl-icon text-body font-medium ${active ? "text-accent-on-soft" : "text-text"}`}>
          <Icon name="calendar" size={16} className="shrink-0 text-text-muted" />
          <span id={valueId} dir="auto" className="min-w-0 flex-1 truncate text-start">{text}</span>
          <Icon name="angle-down" size={16} className="shrink-0 text-text-muted" />
        </span>
      }
    >
      {(close) => (
        <div className="flex flex-col gap-space-4 p-space-5">
          {/* The kit's calendar; weeks start on Monday here, as they always have. */}
          <Calendar autoFocus range={draft} onPick={pick} weekStart={1} />
          <div className="flex justify-end gap-space-3">
            <Button size="sm" variant="ghost" onClick={() => { setDraft({}); onChange({}); close(); }}>{t.clear}</Button>
            <Button size="sm" variant="primary" disabled={!draft.from} onClick={() => { onChange(draft); close(); }}>{t.apply}</Button>
          </div>
        </div>
      )}
    </Popover>
  );
};

export { DateRangeButton };
export type { DateRange, DateRangeButtonProps };
