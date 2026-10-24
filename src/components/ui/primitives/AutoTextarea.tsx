"use client";

import { CSSProperties, KeyboardEvent, useCallback, useRef } from "react";

type AutoTextareaProps = {
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  /** Called on Enter without Shift. Omit to let Enter insert a newline. */
  onEnter?: () => void;
  placeholder?: string;
  minRows?: number;
  autoFocus?: boolean;
  caretAtEnd?: boolean;
  className?: string;
  style?: CSSProperties;
  dir?: "auto" | "ltr" | "rtl";
  id?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
};

/**
 * A textarea that is always exactly as tall as its content.
 *
 * A fixed `rows` is wrong for brand copy: a mission statement is one line for
 * one brand and eight for another, and a three-row box clips the rest the
 * moment someone clicks in to edit — so the field visibly shrinks and hides
 * text at the exact moment they wanted to read it.
 *
 * Sizing happens in a callback ref rather than an effect so the first measured
 * height is applied in the commit phase, before the browser paints: the field
 * never flashes at the wrong size on its way to the right one.
 */
const AutoTextarea = ({
  value,
  onChange,
  onBlur,
  onEnter,
  placeholder,
  minRows = 3,
  autoFocus = false,
  /** Place the caret at the end on focus, so clicking a filled field continues it. */
  caretAtEnd = true,
  className = "",
  style,
  dir = "auto",
  /**
   * Lets a real `<label htmlFor>` point here. Worth a prop rather than falling
   * back to `aria-label`: a label that does not focus its field on click is the
   * same defect, and an aria-label also hides the help text from a screen
   * reader that `aria-describedby` would have carried.
   */
  id,
  "aria-label": ariaLabel,
  "aria-describedby": ariaDescribedBy,
}: AutoTextareaProps) => {
  const elRef = useRef<HTMLTextAreaElement | null>(null);

  const resize = useCallback((el: HTMLTextAreaElement) => {
    // Collapse first: without this the box can only ever grow, because
    // scrollHeight of an already-tall element includes the empty space.
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  const attach = useCallback(
    (el: HTMLTextAreaElement | null) => {
      elRef.current = el;
      if (!el) return;
      resize(el);
      if (autoFocus) {
        el.focus();
        if (caretAtEnd) {
          const end = el.value.length;
          el.setSelectionRange(end, end);
        }
      }
    },
    [resize, autoFocus, caretAtEnd]
  );

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (onEnter && e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onEnter();
    }
  }

  return (
    <textarea
      ref={attach}
      id={id}
      dir={dir}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      value={value}
      placeholder={placeholder}
      rows={minRows}
      onChange={(e) => {
        onChange(e.target.value);
        resize(e.target);
      }}
      onBlur={onBlur}
      onKeyDown={handleKeyDown}
      className={`resize-none overflow-hidden bidi-auto ${className}`}
      style={{ minHeight: `calc(${minRows} * 1.6em + 1.5rem)`, ...style }}
    />
  );
};

export { AutoTextarea };
export type { AutoTextareaProps };
