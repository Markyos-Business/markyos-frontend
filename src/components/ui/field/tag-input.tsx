"use client";

import { useRef, useState } from "react";
import type { ClipboardEvent, KeyboardEvent } from "react";
import { Icon } from "../icon";
import { useUiStrings } from "../ui-strings";
import { Field, type FieldState } from "./field";

/** Tags in pasted or typed text: split on commas (Latin or Arabic), semicolons and new lines. */
function splitTags(text: string): string[] {
  return text
    .split(/[,،;\n]/)
    .map((t) => t.trim().replace(/\s+/g, " "))
    .filter(Boolean);
}

/**
 * Adds `incoming` to `tags`: trimmed, without duplicates (case-insensitive),
 * up to `max`. Returns the new list and what was refused, and why.
 */
function addTags(tags: readonly string[], incoming: readonly string[], max = Infinity) {
  const next = [...tags];
  let duplicate: string | null = null;
  let overLimit = false;
  for (const tag of incoming) {
    if (next.some((t) => t.toLowerCase() === tag.toLowerCase())) duplicate ??= tag;
    else if (next.length >= max) overLimit = true;
    else next.push(tag);
  }
  return { next, duplicate, overLimit };
}

type TagInputProps = Omit<FieldState, "readOnly"> & {
  label: string;
  info?: string;
  value: readonly string[];
  onChange: (tags: string[]) => void;
  /** At most this many. */
  max?: number;
  placeholder?: string;
  onBlur?: () => void;
  className?: string;
  strings?: { remove?: (tag: string) => string; alreadyAdded?: (tag: string) => string; tagLimit?: (n: number) => string; hint?: string };
};

/**
 * Free tags as chips: Enter or a comma adds what's typed, Backspace in an
 * empty field takes the last one off, and a pasted list ("Riyadh, Dubai,
 * Cairo") becomes one chip each. A duplicate or a tag past `max` isn't added,
 * and the note says why. Each chip has its own remove button. Controlled.
 */
const TagInput = ({ label, info, value, onChange, max, placeholder, onBlur, className = "", strings, hint, warning, ...state }: TagInputProps) => {
  const { t } = useUiStrings();
  const input = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [refusal, setRefusal] = useState<string | null>(null);
  const full = max !== undefined && value.length >= max;
  const blocked = state.disabled || state.locked;

  const add = (incoming: string[]) => {
    if (!incoming.length) return;
    const { next, duplicate, overLimit } = addTags(value, incoming, max);
    if (next.length !== value.length) onChange(next);
    setRefusal(duplicate ? (strings?.alreadyAdded ?? t.alreadyAdded)(duplicate) : overLimit ? (strings?.tagLimit ?? t.tagLimit)(max!) : null);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Enter" || e.key === "," || e.key === "،") && !e.nativeEvent.isComposing) {
      e.preventDefault();
      add(splitTags(text));
      setText("");
    } else if (e.key === "Backspace" && text === "" && value.length) {
      e.preventDefault();
      onChange(value.slice(0, -1));
      setRefusal(null);
    }
  };

  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text");
    if (!/[,،;\n]/.test(pasted)) return;
    e.preventDefault();
    add(splitTags(text + pasted));
    setText("");
  };

  return (
    <Field
      bare
      label={label}
      info={info}
      {...state}
      warning={warning ?? refusal ?? undefined}
      hint={hint ?? (max !== undefined ? `${strings?.hint ?? t.tagHint} ${(strings?.tagLimit ?? t.tagLimit)(max)}` : (strings?.hint ?? t.tagHint))}
      className={className}
    >
      {(control) => (
        // The box is the field; clicking anywhere in it goes to the input.
        <div
          className="mk-field flex min-h-control-sm w-full cursor-text flex-wrap items-center gap-space-2"
          data-state={state.error ? "error" : warning || refusal ? "warning" : state.success ? "success" : undefined}
          data-readonly={state.locked ? "" : undefined}
          onClick={() => input.current?.focus()}
        >
          {value.map((tag) => (
            <span key={tag} className="flex h-6.5 items-center gap-space-1 rounded-md bg-surface-2 ps-space-3 pe-space-1 text-caption font-medium text-text shadow-edge" dir="auto">
              {tag}
              {!blocked && (
                <button
                  type="button"
                  aria-label={(strings?.remove ?? t.remove)(tag)}
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(value.filter((v) => v !== tag));
                    setRefusal(null);
                    input.current?.focus();
                  }}
                  className="mk-tap flex rounded-sm text-text-muted hover:text-text"
                >
                  <Icon name="times" size={16} />
                </button>
              )}
            </span>
          ))}
          <input
            ref={input}
            {...control}
            value={text}
            disabled={blocked}
            placeholder={value.length ? undefined : placeholder}
            enterKeyHint="enter"
            onChange={(e) => {
              setText(e.target.value);
              if (refusal) setRefusal(null);
            }}
            onKeyDown={onKeyDown}
            onPaste={onPaste}
            onBlur={() => {
              // What's left in the box when leaving becomes a tag too.
              if (text.trim()) {
                add(splitTags(text));
                setText("");
              }
              onBlur?.();
            }}
            aria-describedby={control["aria-describedby"]}
            className={`mk-field-control min-w-24 ${full ? "sr-only" : ""}`}
          />
        </div>
      )}
    </Field>
  );
};

export { TagInput, addTags, splitTags };
export type { TagInputProps };
