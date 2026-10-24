"use client";

import { useId } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { Icon } from "../../ui/primitives/Icon";

/**
 * The text field's own look (spec §6.5), shared with the other fields so they
 * all look alike: no box and no fill, a 14px value at weight 500 over a 1px
 * underline whose colour is the field's state (`.mk-underline` in
 * tailwind/base.js), read from `aria-invalid`.
 */
const inputClasses = "mk-underline w-full";

/** A field's title: 12px, muted, weight 400. */
const labelClasses = "cursor-pointer text-caption text-text-muted";

type FieldLabelProps = { htmlFor?: string; required?: boolean; children: ReactNode };

/**
 * A field's label. A required field gets an asterisk; the native `required`
 * on the control is what tells assistive tech, so the mark itself is hidden.
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
      className={`text-caption ${error ? "text-danger" : "text-text-faint"}`}
    >
      {note}
    </span>
  );
};

type InputFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "className" | "size"> & {
  label?: string;
  /** Beside the label, e.g. a "Forgot?" link. */
  labelRight?: ReactNode;
  error?: string;
  hint?: string;
  /** An 18px icon name, inside the field on the side `iconSide` names. */
  icon?: string;
  iconSide?: "start" | "end";
};

/**
 * A labelled text field: the spec's 72px input block.
 *
 * The label is a real `<label>` tied to the input by id, so clicking the word
 * focuses the field and a screen reader names the field instead of reading its
 * placeholder, which disappears the moment you type. The error is linked with
 * `aria-describedby`, so a field announced as invalid can say why. `useId`
 * rather than a counter so the id matches between server and client render.
 */
const InputField = ({ label, labelRight, error, hint, icon, iconSide = "start", ...inputProps }: InputFieldProps) => {
  const reactId = useId();
  const id = inputProps.id ?? `tf-${reactId}`;
  const noteId = `${id}-note`;

  return (
    <div className="flex min-h-field w-full flex-col gap-space-2">
      {(label || labelRight) && (
        <div className="flex items-center justify-between">
          {label && (
            <FieldLabel htmlFor={id} required={inputProps.required}>
              {label}
            </FieldLabel>
          )}
          {labelRight}
        </div>
      )}
      <span className="relative flex items-center">
        {icon && (
          <Icon
            name={icon}
            size={18}
            className={`pointer-events-none absolute text-text-muted ${iconSide === "start" ? "start-0" : "end-0"}`}
          />
        )}
        <input
          {...inputProps}
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ?? hint ? noteId : undefined}
          className={`${inputClasses} ${icon ? (iconSide === "start" ? "ps-space-9" : "pe-space-9") : ""}`}
        />
      </span>
      <FieldNote id={noteId} error={error} hint={hint} />
    </div>
  );
};

export { FieldLabel, FieldNote, InputField, inputClasses, labelClasses };
export type { FieldLabelProps, FieldNoteProps, InputFieldProps };
