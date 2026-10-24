"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { usePresence } from "@/hooks/usePresence";
import { Icon } from "../../ui/primitives/Icon";
import { FieldLabel, FieldNote, inputClasses } from "../fields/InputField";

type ComboboxOption = { value: string; label: string; disabled?: boolean };

/** Offered when a search finds nothing, e.g. "Create “Acme”". */
type ComboboxAction = { label: string; onSelect: (search: string) => void };

type CommonProps = {
  label: string;
  hideLabel?: boolean;
  options: readonly ComboboxOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
  /** The filter-bar height instead of the form height. */
  compact?: boolean;
  emptyActions?: readonly ComboboxAction[];
  onBlur?: () => void;
};

type SingleProps = CommonProps & { multiple?: false; value: string; onChange: (value: string) => void };
type MultipleProps = CommonProps & { multiple: true; value: readonly string[]; onChange: (value: string[]) => void };
type ComboboxProps = SingleProps | MultipleProps;

/**
 * A select with a search box: one value, or several with `multiple`. Arrow
 * keys move through the matches, Enter picks, Escape closes, and a click
 * outside closes it too. The list grows open from the field.
 */
const Combobox = (props: ComboboxProps) => {
  const { label, hideLabel = false, options, placeholder = "Select…", searchPlaceholder = "Search…", error, hint, required = false, disabled = false, compact = false, emptyActions = [], onBlur } = props;
  const baseId = useId();
  const triggerId = `${baseId}-trigger`;
  const listId = `${baseId}-list`;
  const noteId = `${baseId}-note`;
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [active, setActive] = useState(0);
  const { mounted, closing } = usePresence(open);

  const selected = useMemo(() => (props.multiple ? props.value : props.value ? [props.value] : []), [props.multiple, props.value]);
  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;
  }, [options, search]);
  const summary = options.filter((o) => selected.includes(o.value)).map((o) => o.label).join(", ");

  const close = (refocus = false) => {
    setOpen(false);
    setSearch("");
    onBlur?.();
    if (refocus) triggerRef.current?.focus();
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close();
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
    // `close` is stable enough for an outside click; re-subscribing on every render isn't needed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const choose = (opt: ComboboxOption) => {
    if (opt.disabled) return;
    if (props.multiple) {
      props.onChange(selected.includes(opt.value) ? selected.filter((v) => v !== opt.value) : [...selected, opt.value]);
    } else {
      props.onChange(opt.value);
      close(true);
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, shown.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const opt = shown[active];
      if (opt) choose(opt);
    } else if (e.key === "Escape") {
      e.preventDefault();
      close(true);
    }
  };

  return (
    <div ref={rootRef} className={`relative flex w-full flex-col gap-space-2 ${compact ? "" : "min-h-field"}`}>
      {hideLabel ? (
        <label htmlFor={triggerId} className="sr-only">
          {label}
        </label>
      ) : (
        <FieldLabel htmlFor={triggerId} required={required}>
          {label}
        </FieldLabel>
      )}
      <button
        id={triggerId}
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        // The error is announced through the note it points at (a button
        // can't carry aria-invalid), and shown on the underline.
        aria-describedby={error ?? hint ? noteId : undefined}
        onClick={() => (open ? close() : (setActive(0), setOpen(true)))}
        className={`${inputClasses} flex cursor-pointer items-center justify-between gap-space-3 text-start ${error ? "border-danger" : ""} ${
          compact ? "text-caption" : ""
        }`}
      >
        <span className={`truncate ${summary ? "text-text" : "font-normal text-text-disabled"}`}>{summary || placeholder}</span>
        <Icon name={open ? "angle-up" : "angle-down"} size={16} className="shrink-0 text-text-muted" />
      </button>

      {mounted && (
        <div
          className={`absolute top-full z-dropdown mt-space-1 w-full rounded-card bg-surface-1 p-space-3 shadow-edge-pop ${
            closing ? "pointer-events-none animate-fade-out" : "animate-fade-in"
          }`}
        >
          <input
            type="search"
            autoFocus
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
            placeholder={searchPlaceholder}
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-activedescendant={shown[active] ? `${baseId}-opt-${shown[active].value}` : undefined}
            aria-label={`Search ${label}`}
            className="mk-underline mb-space-3 w-full"
          />
          <ul id={listId} role="listbox" aria-label={label} aria-multiselectable={props.multiple || undefined} className="max-h-60 overflow-y-auto">
            {shown.map((opt, i) => {
              const isSelected = selected.includes(opt.value);
              return (
                <li
                  key={opt.value}
                  id={`${baseId}-opt-${opt.value}`}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={opt.disabled || undefined}
                  onMouseEnter={() => setActive(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => choose(opt)}
                  className={`flex h-control-sm items-center gap-space-3 rounded-md px-space-4 text-body ${
                    opt.disabled ? "cursor-not-allowed text-text-disabled" : "cursor-pointer text-text"
                  } ${i === active && !opt.disabled ? "bg-surface-2" : ""}`}
                >
                  {props.multiple ? (
                    <span
                      aria-hidden
                      className={`flex size-5 shrink-0 items-center justify-center rounded-sm ${isSelected ? "bg-accent text-accent-ink" : "bg-surface-2 shadow-edge"}`}
                    >
                      {isSelected && <Icon name="check" size={16} />}
                    </span>
                  ) : (
                    <Icon name="check" size={16} className={`shrink-0 text-accent-text ${isSelected ? "" : "invisible"}`} />
                  )}
                  <span className="truncate">{opt.label}</span>
                </li>
              );
            })}
            {shown.length === 0 && (
              <li className="px-space-4 py-space-3 text-body text-text-muted" role="presentation">
                No results found
              </li>
            )}
          </ul>
          {shown.length === 0 && emptyActions.length > 0 && (
            <div className="mt-space-3 flex flex-col gap-space-1 pt-space-3 shadow-rule-t">
              {emptyActions.map((a) => (
                <button
                  key={a.label}
                  type="button"
                  onClick={() => {
                    a.onSelect(search);
                    close(true);
                  }}
                  className="flex h-control-sm items-center gap-space-3 rounded-md px-space-4 text-start text-body font-medium text-accent-text"
                >
                  <Icon name="plus" size={16} />
                  {a.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      <FieldNote id={noteId} error={error} hint={hint} />
    </div>
  );
};

export { Combobox };
export type { ComboboxAction, ComboboxOption, ComboboxProps };
