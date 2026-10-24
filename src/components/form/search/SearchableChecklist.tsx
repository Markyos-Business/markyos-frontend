"use client";

import { useId, useMemo, useState } from "react";
import { Badge } from "../../ui/badges/Badge";
import { Icon } from "../../ui/primitives/Icon";
import { CheckboxInput } from "../fields/CheckboxField";

type SearchableChecklistItem = {
  id: string;
  label: string;
  /** A second line, searched too (an email). */
  sublabel?: string | null;
  /** A short tag beside the label ("Company"). */
  badge?: string | null;
  /** A muted explanatory line. */
  hint?: string | null;
};

type SearchableChecklistProps = {
  items: SearchableChecklistItem[];
  /** The ticked ids; the caller owns them. The search term is internal. */
  selected: ReadonlySet<string>;
  onChange: (next: Set<string>) => void;
  /** Plural noun for the counter and empty states: "advisors". */
  itemNoun?: string;
  /** The group's accessible name; the search box becomes "Search <label>". */
  label?: string;
  searchPlaceholder?: string;
  /** Rows with details, or compact chips for short labels. */
  layout?: "list" | "chips";
  disabled?: boolean;
  className?: string;
};

const normalise = (v: string | null | undefined) => (v ?? "").trim().toLowerCase();

/**
 * A checklist with a search box. Searching filters what is shown and never
 * touches what is ticked: ticks made before a search survive it, and "Select
 * all shown" adds only the rows in view.
 */
const SearchableChecklist = ({
  items,
  selected,
  onChange,
  itemNoun = "items",
  label,
  searchPlaceholder = "Search by name or email…",
  layout = "list",
  disabled = false,
  className = "",
}: SearchableChecklistProps) => {
  const [search, setSearch] = useState("");
  const baseId = useId();
  const query = normalise(search);
  const shown = useMemo(
    () => (query ? items.filter((i) => normalise(i.label).includes(query) || normalise(i.sublabel).includes(query)) : items),
    [items, query]
  );
  const allShownSelected = shown.length > 0 && shown.every((i) => selected.has(i.id));
  const groupLabel = label ?? itemNoun;

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(next);
  };
  const selectShown = () => onChange(new Set([...selected, ...shown.map((i) => i.id)]));
  // The spec's link button (§6.4): an overline in the accent.
  const textButton = "text-overline uppercase text-accent-text disabled:text-text-disabled";

  return (
    <div className={`overflow-hidden rounded-card bg-surface-1 shadow-edge ${className}`}>
      <div className="flex flex-col gap-space-3 px-space-6 py-space-5 shadow-rule-b sm:flex-row sm:items-center sm:justify-between">
        <label className="mk-underline flex min-w-0 flex-1 items-center gap-space-3">
          <Icon name="search" size={18} className="pointer-events-none text-text-muted" />
          <span className="sr-only">{`Search ${groupLabel}`}</span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            disabled={disabled}
            className="min-w-0 flex-1 bg-transparent text-body font-medium text-text outline-none placeholder:font-normal placeholder:text-text-disabled"
          />
        </label>
        <div className="flex shrink-0 items-center gap-space-5">
          <span className="text-caption text-text-muted" aria-live="polite">
            {selected.size} of {items.length} selected
          </span>
          <button type="button" onClick={selectShown} disabled={disabled || shown.length === 0 || allShownSelected} className={textButton}>
            Select all shown
          </button>
          <button type="button" onClick={() => onChange(new Set())} disabled={disabled || selected.size === 0} className={textButton}>
            Clear
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="px-space-6 py-space-8 text-center text-body text-text-muted">No {itemNoun} to choose from.</p>
      ) : shown.length === 0 ? (
        <p className="px-space-6 py-space-8 text-center text-body text-text-muted">
          No {itemNoun} match{search.trim() ? ` “${search.trim()}”` : ""}.
        </p>
      ) : layout === "chips" ? (
        <div role="group" aria-label={groupLabel} className="flex flex-wrap gap-space-3 p-space-6">
          {shown.map((item) => {
            const checked = selected.has(item.id);
            return (
              <label
                key={item.id}
                // A tag that toggles (spec §6.7): grey at rest, the accent tint
                // when chosen. The checkbox stays real, hidden behind it.
                className={`flex h-tag cursor-pointer items-center gap-space-3 rounded-lg px-space-5 text-body font-medium transition-[background-color,box-shadow] has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent ${
                  checked ? "bg-accent-soft text-accent-on-soft shadow-edge-accent" : "bg-surface-2 text-text-secondary"
                }`}
              >
                <input type="checkbox" checked={checked} disabled={disabled} onChange={() => toggle(item.id)} className="sr-only" />
                {checked && <Icon name="check" size={16} />}
                {item.label}
              </label>
            );
          })}
        </div>
      ) : (
        <ul role="group" aria-label={groupLabel} className="max-h-80 overflow-y-auto">
          {shown.map((item) => {
            const inputId = `${baseId}-${item.id}`;
            const checked = selected.has(item.id);
            return (
              <li key={item.id} className="shadow-rule-t first:shadow-none">
                <label
                  htmlFor={inputId}
                  className={`flex cursor-pointer items-start gap-space-4 px-space-6 py-space-4 text-body transition-colors ${checked ? "bg-surface-highlight" : ""}`}
                >
                  <CheckboxInput id={inputId} checked={checked} onChange={() => toggle(item.id)} disabled={disabled} />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-space-3">
                      <span className="truncate font-medium text-text">{item.label}</span>
                      {item.badge && <Badge>{item.badge}</Badge>}
                    </span>
                    {item.sublabel && <span className="block truncate text-caption text-text-muted">{item.sublabel}</span>}
                    {item.hint && <span className="block text-caption text-text-faint">{item.hint}</span>}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export { SearchableChecklist };
export type { SearchableChecklistItem, SearchableChecklistProps };
