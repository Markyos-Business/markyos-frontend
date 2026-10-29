"use client";

import { useEffect, useRef, useState, type InputHTMLAttributes } from "react";
import { Icon } from "../../ui/primitives/Icon";
import { Kbd } from "../../ui/primitives/Kbd";

type SearchFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "className" | "type"> & {
  /** The field's accessible name; the field shows only a placeholder. */
  label: string;
  /**
   * Called with the text once typing pauses (`debounceMs`), for a search
   * that fetches. The field then keeps its own text; `value`/`onChange` stay
   * available for an instant, controlled filter instead.
   */
  onDebouncedChange?: (value: string) => void;
  /** Pause before `onDebouncedChange` fires, in ms. Default 300. */
  debounceMs?: number;
  /** ⌘K / Ctrl+K focuses the field, with the hint shown in it. Default false. */
  shortcut?: boolean;
};

/** The search field of list headers: the underline field with a search glyph. */
const SearchField = ({ label, onDebouncedChange, debounceMs = 300, shortcut = false, ...rest }: SearchFieldProps) => {
  const ref = useRef<HTMLInputElement>(null);
  const initial = typeof rest.defaultValue === "string" ? rest.defaultValue : "";
  const [text, setText] = useState(initial);
  const debounced = onDebouncedChange !== undefined;

  useEffect(() => {
    if (!debounced) return;
    const id = window.setTimeout(() => onDebouncedChange?.(text), debounceMs);
    return () => window.clearTimeout(id);
    // Only the text restarts the wait; a new callback each render shouldn't.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, debounceMs, debounced]);

  useEffect(() => {
    if (!shortcut) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        ref.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shortcut]);

  const { defaultValue: _defaultValue, ...inputProps } = rest;
  return (
    <label className="mk-underline flex w-full items-center gap-space-3 sm:w-65">
      <Icon name="search" size={18} className="text-text-muted" />
      <span className="sr-only">{label}</span>
      <input
        ref={ref}
        {...inputProps}
        {...(debounced ? { value: text, onChange: (e) => setText(e.target.value) } : { defaultValue: rest.value === undefined ? _defaultValue : undefined })}
        type="search"
        className="min-w-0 flex-1 bg-transparent text-body font-medium text-text outline-none placeholder:font-normal placeholder:text-text-disabled"
      />
      {shortcut && (
        <span aria-hidden className="hidden shrink-0 sm:inline">
          <Kbd>⌘K</Kbd>
        </span>
      )}
    </label>
  );
};

export { SearchField };
export type { SearchFieldProps };
