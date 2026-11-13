"use client";

import { useState } from "react";
import type { ComponentProps, ReactNode } from "react";
import { Icon } from "../icon";
import { Field, fieldClasses, labelClasses, type ControlProps, type FieldSize, type FieldState } from "./field";

/**
 * The field's own look (spec §6.5), shared with every other field so they all
 * look alike: a 14px value at weight 500 over a 1px underline whose colour is
 * the field's state (`.mk-field` in tailwind/base.js).
 */
const inputClasses = "mk-field w-full";

/** The block around a field: the 72px form block, or just a stack when compact. */
const fieldBlockClasses = (size: FieldSize = "md", labelled = true) =>
  size === "sm" ? "flex w-full flex-col gap-space-1" : `flex w-full flex-col gap-space-2 ${labelled ? "min-h-field" : ""}`;

type FieldLabelProps = { htmlFor?: string; required?: boolean; children: ReactNode };

/**
 * A field's label, for a control that doesn't go through `Field`. A required
 * field gets an asterisk; the native `required` on the control is what tells
 * assistive tech, so the mark itself is hidden.
 */
const FieldLabel = ({ htmlFor, required = false, children }: FieldLabelProps) => (
  <label htmlFor={htmlFor} className={labelClasses}>
    {children}
    {required && (
      <span aria-hidden className="ms-0.5 text-danger">
        *
      </span>
    )}
  </label>
);

type FieldNoteProps = { id: string; error?: string; hint?: string };

/** The line under a field, 12px in the state's colour: an error, or a hint. */
const FieldNote = ({ id, error, hint }: FieldNoteProps) => {
  const note = error ?? hint;
  if (!note) return null;
  return (
    <span
      id={id}
      // Errors are announced the moment they appear. A hint is not: it is
      // there before you start and repeating it would talk over the field.
      role={error ? "alert" : undefined}
      className={`px-space-5 text-caption ${error ? "text-danger" : "text-text-faint"}`}
    >
      {note}
    </span>
  );
};

/** Merges a control's own `aria-describedby` with the Field's note and counter. */
const describedBy = (own: string | undefined, control: ControlProps) =>
  [own, control["aria-describedby"]].filter(Boolean).join(" ") || undefined;

type InputFieldProps = Omit<ComponentProps<"input">, "className" | "size" | "prefix"> &
  Omit<FieldState, "required" | "disabled" | "readOnly"> & {
    label?: string;
    /** A short explanation behind an ⓘ next to the label. */
    info?: string;
    /** Beside the label, e.g. a "Forgot?" link. */
    labelRight?: ReactNode;
    /** An 18px icon name, inside the field on the side `iconSide` names. */
    icon?: string;
    iconSide?: "start" | "end";
    /** Inside the field before the value: "SAR", "https://", an icon. */
    prefix?: ReactNode;
    /** Inside the field after the value: a unit. */
    suffix?: ReactNode;
    /** A button at the field's end: Copy, Generate, Clear. */
    action?: ReactNode;
    /** Show `length/maxLength` under the field. Needs `maxLength`. */
    showCount?: boolean;
    layout?: "vertical" | "horizontal";
    size?: FieldSize;
    /** Layout only (a width, `flex-1`), on the field's outer block. */
    className?: string;
    /** Classes on the input itself, e.g. `font-mono`. */
    inputClassName?: string;
    /** For a value written left to right in any language: see Field's `boxDir`. */
    boxDir?: "ltr" | "rtl";
    /** Between the field and its note: a meter, a preview. */
    below?: ReactNode;
    strings?: { optional?: string; locked?: string; checking?: string };
  };

/**
 * A labelled text field: the spec's 72px input block, and TextInput in the
 * UI library's terms.
 *
 * The label is a real `<label>` tied to the input by id, so clicking the word
 * focuses the field and a screen reader names the field instead of reading its
 * placeholder, which disappears the moment you type. Works controlled,
 * uncontrolled, and with react-hook-form's `register` (its `ref` lands on the
 * input).
 */
const InputField = ({
  label,
  info,
  labelRight,
  error,
  warning,
  success,
  hint,
  validating,
  locked,
  lockedReason,
  optional,
  loading,
  icon,
  iconSide = "start",
  prefix,
  suffix,
  action,
  showCount = false,
  layout = "vertical",
  size = "md",
  className = "",
  inputClassName = "",
  boxDir,
  below,
  strings,
  ...inputProps
}: InputFieldProps) => {
  // Only read when uncontrolled; a controlled field counts its `value`.
  const [typed, setTyped] = useState(() => String(inputProps.defaultValue ?? "").length);
  const controlled = inputProps.value !== undefined;
  const length = controlled ? String(inputProps.value ?? "").length : typed;
  const glyph = icon ? <Icon name={icon} size={size === "sm" ? 16 : 18} /> : null;

  return (
    <Field
      id={inputProps.id}
      label={label}
      info={info}
      labelRight={labelRight}
      error={error}
      warning={warning}
      success={success}
      hint={hint}
      validating={validating}
      locked={locked}
      lockedReason={lockedReason}
      optional={optional}
      loading={loading}
      required={inputProps.required}
      disabled={inputProps.disabled}
      readOnly={inputProps.readOnly}
      prefix={iconSide === "start" && glyph ? glyph : prefix}
      suffix={iconSide === "end" && glyph ? (
        <>
          {suffix}
          {glyph}
        </>
      ) : suffix}
      action={action}
      count={showCount && inputProps.maxLength ? { current: length, max: inputProps.maxLength } : undefined}
      layout={layout}
      size={size}
      boxDir={boxDir}
      below={below}
      strings={strings}
      className={`${layout === "vertical" && size === "md" && label ? "min-h-field" : ""} ${className}`}
    >
      {(control) => (
        <input
          {...control}
          {...inputProps}
          id={control.id}
          readOnly={control.readOnly ?? inputProps.readOnly}
          aria-describedby={describedBy(inputProps["aria-describedby"], control)}
          onChange={(e) => {
            if (!controlled) setTyped(e.target.value.length);
            inputProps.onChange?.(e);
          }}
          className={`mk-field-control ${inputClassName}`}
        />
      )}
    </Field>
  );
};

/** TextInput, by the UI library's name. */
const TextInput = InputField;

export { FieldLabel, FieldNote, InputField, TextInput, describedBy, fieldBlockClasses, fieldClasses, inputClasses, labelClasses };
export type { FieldLabelProps, FieldNoteProps, FieldSize, InputFieldProps };
