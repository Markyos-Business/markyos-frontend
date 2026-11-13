"use client";

import { useEffect, useRef, useState, type InputHTMLAttributes } from "react";
import { IconButton } from "../button/icon-button";
import { useUiStrings } from "../ui-strings";
import { Icon } from "../icon";
import { Kbd } from "../kbd";
import { fieldClasses, type FieldSize } from "./input-field";

type SearchFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "className" | "type" | "size"> & {
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
  /** `sm` for a panel or picker toolbar. */
  size?: FieldSize;
  /** Fill the row instead of the list-header width. */
  fullWidth?: boolean;
  /** The clear button's name, e.g. "Clear search". Default from the kit's words. */
  clearLabel?: string;
};

/** The search field of list headers and pickers: the underline field with a search glyph. */
const SearchField = ({ label, onDebouncedChange, debounceMs = 300, shortcut = false, size = "md", fullWidth = false, clearLabel, ...rest }: SearchFieldProps) => {
  const ref = useRef<HTMLInputElement>(null);
  const initial = typeof rest.defaultValue === "string" ? rest.defaultValue : "";
  const [text, setText] = useState(initial);
  const debounced = onDebouncedChange !== undefined;
  // What the caller already has. The text it starts with isn't news, and
  // reporting it would reset whatever the caller resets on a new search.
  const sent = useRef(initial);
  // The callback as of the latest render. The wait outlives the render that
  // started it, and an old callback can hold old state: a filter chosen
  // during the pause would be written over by the search it closed over.
  const latest = useRef(onDebouncedChange);
  useEffect(() => {
    latest.current = onDebouncedChange;
  });

  useEffect(() => {
    if (!debounced || text === sent.current) return;
    const id = window.setTimeout(() => {
      sent.current = text;
      latest.current?.(text);
    }, debounceMs);
    return () => window.clearTimeout(id);
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

  const { t } = useUiStrings();
  // Whether there is anything to clear: the caller's value, or what's typed.
  const [typed, setTyped] = useState(initial !== "");
  const hasText = debounced ? text !== "" : rest.value !== undefined ? String(rest.value) !== "" : typed;

  /**
   * Clears through the input's own change event, so a controlled caller's
   * onChange, the debounced search and an uncontrolled field all hear it.
   */
  const clear = () => {
    const input = ref.current;
    if (!input) return;
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(input, "");
    input.dispatchEvent(new Event("input", { bubbles: true }));
    setTyped(false);
    input.focus();
  };

  const { defaultValue: _defaultValue, ...inputProps } = rest;
  return (
    <label className={`${fieldClasses(size)} flex items-center gap-space-3 ${fullWidth ? "" : "sm:w-65"}`}>
      <Icon name="search" size={size === "sm" ? 15 : 18} className="shrink-0 text-text-muted" />
      <span className="sr-only">{label}</span>
      <input
        ref={ref}
        {...inputProps}
        {...(debounced ? { value: text, onChange: (e) => setText(e.target.value) } : { defaultValue: rest.value === undefined ? _defaultValue : undefined })}
        type="search"
        onInput={(e) => {
          setTyped(e.currentTarget.value !== "");
          inputProps.onInput?.(e);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape" && hasText) {
            e.stopPropagation();
            clear();
          }
          inputProps.onKeyDown?.(e);
        }}
        className={`min-w-0 flex-1 bg-transparent font-medium ${size === "sm" ? "text-[12.5px]" : "text-body"} text-text outline-none placeholder:font-normal placeholder:text-text-disabled [&::-webkit-search-cancel-button]:hidden`}
      />
      {hasText && <IconButton icon="times" label={clearLabel ?? t.clearField(label)} onClick={clear} className="-me-space-2 shrink-0 text-text-muted" />}
      {shortcut && (
        <span aria-hidden className="hidden shrink-0 sm:inline">
          <Kbd>⌘K</Kbd>
        </span>
      )}
    </label>
  );
};

/** SearchInput, by the UI library's name. */
const SearchInput = SearchField;

export { SearchField, SearchInput };
export type { SearchFieldProps };
