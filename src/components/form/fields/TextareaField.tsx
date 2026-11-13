"use client";

import { useLayoutEffect, useRef, useState } from "react";
import type { ComponentProps, Ref } from "react";
import { Field, type FieldSize, type FieldState } from "../field/Field";
import { describedBy } from "./InputField";

type TextareaFieldProps = Omit<ComponentProps<"textarea">, "className"> &
  Omit<FieldState, "required" | "disabled" | "readOnly"> & {
    /** Layout only, on the outer block. */
    className?: string;
    /** Optional for a box that has an aria-label instead (a note under a row). */
    label?: string;
    info?: string;
    size?: FieldSize;
    /** Let the person drag it taller. Default true; off when it grows by itself. */
    resizable?: boolean;
    /** Grow with the text, from `rows` up to `maxRows`, then scroll. */
    autoGrow?: boolean;
    maxRows?: number;
    /** Show `length/maxLength` under the field. Needs `maxLength`. */
    showCount?: boolean;
    layout?: "vertical" | "horizontal";
    /** Classes on the textarea itself. */
    textareaClassName?: string;
  };

/** Hands `node` to a caller's ref, function or object (react-hook-form's, say). */
function assignRef<T>(ref: Ref<T> | undefined, node: T | null) {
  if (typeof ref === "function") ref(node);
  else if (ref) (ref as { current: T | null }).current = node;
}

/** A labelled multi-line field, optionally growing with what is typed. */
const TextareaField = ({
  label,
  info,
  error,
  warning,
  success,
  hint,
  validating,
  locked,
  lockedReason,
  optional,
  loading,
  size = "md",
  resizable = true,
  autoGrow = false,
  maxRows = 10,
  showCount = false,
  layout = "vertical",
  className = "",
  textareaClassName = "",
  ref,
  ...rest
}: TextareaFieldProps) => {
  const el = useRef<HTMLTextAreaElement | null>(null);
  const [typed, setTyped] = useState(() => String(rest.defaultValue ?? "").length);
  const controlled = rest.value !== undefined;
  const length = controlled ? String(rest.value ?? "").length : typed;

  // Height from the content, between the rows asked for and `maxRows`.
  const fit = () => {
    const node = el.current;
    if (!autoGrow || !node) return;
    const line = parseFloat(getComputedStyle(node).lineHeight) || 21;
    node.style.height = "auto";
    const rows = Math.min(maxRows, Math.max(rest.rows ?? 3, Math.round(node.scrollHeight / line)));
    node.style.height = `${rows * line}px`;
    node.style.overflowY = node.scrollHeight > rows * line + 1 ? "auto" : "hidden";
  };
  useLayoutEffect(fit);

  return (
    <Field
      id={rest.id}
      label={label}
      info={info}
      error={error}
      warning={warning}
      success={success}
      hint={hint}
      validating={validating}
      locked={locked}
      lockedReason={lockedReason}
      optional={optional}
      loading={loading}
      required={rest.required}
      disabled={rest.disabled}
      readOnly={rest.readOnly}
      count={showCount && rest.maxLength ? { current: length, max: rest.maxLength } : undefined}
      layout={layout}
      size={size}
      className={className}
    >
      {(control) => (
        <textarea
          {...control}
          {...rest}
          ref={(node) => {
            el.current = node;
            assignRef(ref, node);
          }}
          id={control.id}
          readOnly={control.readOnly ?? rest.readOnly}
          aria-describedby={describedBy(rest["aria-describedby"], control)}
          rows={rest.rows ?? 3}
          onChange={(e) => {
            if (!controlled) setTyped(e.target.value.length);
            fit();
            rest.onChange?.(e);
          }}
          className={`mk-field-control ${autoGrow || !resizable ? "resize-none" : "resize-y"} ${textareaClassName}`}
        />
      )}
    </Field>
  );
};

/** Textarea, by the UI library's name. */
const Textarea = TextareaField;

export { Textarea, TextareaField, assignRef };
export type { TextareaFieldProps };
