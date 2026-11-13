"use client";

import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { Icon } from "../icon";
import { useUiStrings } from "../ui-strings";
import { addDays, addMonths, dateLocale, fromIso, hijriOf, monthGrid, startOfMonth, startOfWeek, toIso, type IsoDate, type WeekStart } from "./date-utils";

type CalendarProps = {
  /** The chosen day (single choice). */
  selected?: IsoDate | null;
  /** The chosen span (range choice); its ends are drawn solid, the days between tinted. */
  range?: { from?: IsoDate; to?: IsoDate };
  /** A day was chosen, by click, Enter or Space. */
  onPick: (day: IsoDate) => void;
  /** Sunday (0), Monday (1) or Saturday (6). Default Sunday. */
  weekStart?: WeekStart;
  min?: IsoDate;
  max?: IsoDate;
  /** Days that can't be chosen besides those outside min and max. */
  isDisabled?: (day: IsoDate) => boolean;
  /** Show the Umm al-Qura Hijri date under each day and the Hijri month in the title. */
  hijri?: boolean;
  /** Arabic-Indic digits in the Arabic interface (spec §8: Western by default). */
  digits?: "latn" | "arab";
  /** Mark the day that should take focus when the calendar opens in a popover. */
  autoFocus?: boolean;
  /** For tests and stories: what "today" is. */
  today?: IsoDate;
};

/**
 * A month of days to choose from (spec §6.16 CalendarMonth). A real grid: one
 * Tab stop, arrows move a day or a week (and mirror in Arabic), Home and End
 * go to the week's ends, Page Up and Page Down a month (Shift: a year), Enter
 * or Space chooses. The whole grid follows the page's direction.
 */
const Calendar = ({ selected, range, onPick, weekStart = 0, min, max, isDisabled, hijri = false, digits = "latn", autoFocus = false, today: givenToday }: CalendarProps) => {
  const { t, lang } = useUiStrings();
  const today = givenToday ?? toIso(new Date());
  const anchor = selected ?? range?.from ?? today;
  const [focused, setFocused] = useState<IsoDate>(anchor);
  const [month, setMonth] = useState<IsoDate>(startOfMonth(anchor));
  const grid = useRef<HTMLTableElement>(null);
  const moved = useRef(false);

  // Keyboard moves focus with the day; a click or an outside change doesn't.
  useEffect(() => {
    if (!moved.current) return;
    moved.current = false;
    grid.current?.querySelector<HTMLButtonElement>(`[data-day="${focused}"]`)?.focus();
  }, [focused, month]);

  const locale = dateLocale(lang, digits);
  const title = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(fromIso(month));
  const hijriTitle = hijri ? `${hijriOf(month, lang, digits).monthYear} – ${hijriOf(addDays(addMonths(month, 1), -1), lang, digits).monthYear}` : null;
  const dayName = new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const weekday = new Intl.DateTimeFormat(locale, { weekday: lang === "ar" ? "narrow" : "short" });
  const weekdayLong = new Intl.DateTimeFormat(locale, { weekday: "long" });
  const number = new Intl.NumberFormat(locale);
  const weeks = monthGrid(month, weekStart);
  const blocked = (day: IsoDate) => (min !== undefined && day < min) || (max !== undefined && day > max) || (isDisabled?.(day) ?? false);
  const inMonth = (day: IsoDate) => day.slice(0, 7) === month.slice(0, 7);

  const go = (day: IsoDate) => {
    moved.current = true;
    setFocused(day);
    if (!inMonth(day)) setMonth(startOfMonth(day));
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, day: IsoDate) => {
    const rtl = grid.current ? getComputedStyle(grid.current).direction === "rtl" : false;
    const next: Record<string, () => IsoDate> = {
      ArrowRight: () => addDays(day, rtl ? -1 : 1),
      ArrowLeft: () => addDays(day, rtl ? 1 : -1),
      ArrowDown: () => addDays(day, 7),
      ArrowUp: () => addDays(day, -7),
      Home: () => startOfWeek(day, weekStart),
      End: () => addDays(startOfWeek(day, weekStart), 6),
      PageUp: () => addMonths(day, e.shiftKey ? -12 : -1),
      PageDown: () => addMonths(day, e.shiftKey ? 12 : 1),
    };
    if (!next[e.key]) return;
    e.preventDefault();
    go(next[e.key]());
  };

  const step = (n: number) => {
    const target = addMonths(month, n);
    setMonth(target);
    setFocused(startOfMonth(target));
  };

  // The day the grid's one Tab stop sits on: the focused day if it's shown.
  const stop = weeks.flat().includes(focused) ? focused : startOfMonth(month);

  return (
    <div className="flex flex-col gap-space-4">
      <div className="flex items-center justify-between gap-space-3">
        <button type="button" aria-label={t.previousMonth} onClick={() => step(-1)} className="grid size-8 place-items-center rounded-lg text-text-muted hover:bg-ink-soft hover:text-text">
          <Icon name="angle-left" size={16} />
        </button>
        <div className="flex flex-col items-center">
          <span aria-live="polite" className="text-body font-medium text-text">
            {title}
          </span>
          {hijriTitle && <span className="text-caption text-text-muted">{hijriTitle}</span>}
        </div>
        <button type="button" aria-label={t.nextMonth} onClick={() => step(1)} className="grid size-8 place-items-center rounded-lg text-text-muted hover:bg-ink-soft hover:text-text">
          <Icon name="angle-right" size={16} />
        </button>
      </div>
      <table ref={grid} role="grid" aria-label={title} className="w-full border-collapse text-center">
        <thead>
          <tr>
            {weeks[0].map((day) => (
              <th key={day} scope="col" abbr={weekdayLong.format(fromIso(day))} className="pb-space-2 text-ui-2xs font-normal text-text-muted">
                {weekday.format(fromIso(day))}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week) => (
            <tr key={week[0]}>
              {week.map((day) => {
                const isSelected = day === selected || day === range?.from || day === range?.to;
                const between = !!range?.from && !!range?.to && day > range.from && day < range.to;
                const off = blocked(day);
                const h = hijri ? hijriOf(day, lang, digits) : null;
                return (
                  <td key={day} role="gridcell" aria-selected={isSelected || between || undefined} className="p-0.5">
                    <button
                      type="button"
                      data-day={day}
                      data-autofocus={autoFocus && day === stop ? "" : undefined}
                      tabIndex={day === stop ? 0 : -1}
                      disabled={off}
                      aria-label={`${dayName.format(fromIso(day))}${h ? `${lang === "ar" ? "، " : ", "}${h.day} ${h.monthYear}` : ""}`}
                      aria-current={day === today ? "date" : undefined}
                      onClick={() => {
                        setFocused(day);
                        onPick(day);
                      }}
                      onKeyDown={(e) => onKeyDown(e, day)}
                      className={`flex w-full flex-col items-center justify-center rounded-md text-caption transition-colors ${h ? "h-11" : "h-8"} disabled:cursor-not-allowed disabled:text-text-disabled disabled:line-through ${
                        isSelected
                          ? "bg-accent font-medium text-accent-ink"
                          : between
                            ? "bg-accent-soft text-accent-on-soft"
                            : `${inMonth(day) ? "text-text" : "text-text-faint"} hover:bg-ink-soft ${day === today ? "font-medium shadow-edge-accent" : ""}`
                      }`}
                    >
                      {number.format(Number(day.slice(8)))}
                      {h && <span className={`text-ui-2xs ${isSelected ? "text-accent-ink" : "text-text-faint"}`}>{h.day}</span>}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export { Calendar };
export type { CalendarProps };
