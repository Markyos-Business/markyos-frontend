"use client";

import { useId } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";

/** The box itself, shared with the other fields so they all look alike. */
const inputClasses = (error?: string) =>
  `w-full rounded-lg bg-surface-2 text-ui-lg text-text outline-none ring-1 ring-inset ${
    error ? "ring-danger" : "ring-hairline-strong"
  }`;

const labelClasses = "cursor-pointer text-ui-xs font-medium text-text-muted";

type FieldNoteProps = { id: string; error?: string; hint?: string };

/** The line under a field: an error, or a hint when there is none. */
const FieldNote = ({ id, error, hint }: FieldNoteProps) => {
  const note = error ?? hint;
  if (!note) return null;
  return (
    <span
      id={id}
      // Errors are announced the moment they appear. A hint is not: it is
      // there before you start and repeating it would talk over the field.
      role={error ? "alert" : undefined}
      className={`text-ui-xs ${error ? "text-danger" : "text-text-faint"}`}
    >
      {note}
    </span>
  );
};

type InputFieldSize = "sm" | "lg";

const sizes: Record<InputFieldSize, string> = {
  sm: "h-11.5",
  lg: "h-13",
};

type InputFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "className" | "size"> & {
  label?: string;
  /** Beside the label, e.g. a "Forgot?" link. */
  labelRight?: ReactNode;
  error?: string;
  hint?: string;
  size?: InputFieldSize;
};

/**
 * A labelled text box.
 *
 * The label is a real `<label>` tied to the input by id, so clicking the word
 * focuses the box and a screen reader names the field instead of reading its
 * placeholder, which disappears the moment you type. The error is linked with
 * `aria-describedby`, so a field announced as invalid can say why. `useId`
 * rather than a counter so the id matches between server and client render.
 */
const InputField = ({ label, labelRight, error, hint, size = "sm", ...inputProps }: InputFieldProps) => {
  const reactId = useId();
  const id = inputProps.id ?? `tf-${reactId}`;
  const noteId = `${id}-note`;

  return (
    <div className="flex w-full flex-col gap-1.5">
      {(label || labelRight) && (
        <div className="flex items-center justify-between">
          {label && (
            <label htmlFor={id} className={labelClasses}>
              {label}
            </label>
          )}
          {labelRight}
        </div>
      )}
      <input
        {...inputProps}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ?? hint ? noteId : undefined}
        className={`${inputClasses(error)} px-4 ${sizes[size]}`}
      />
      <FieldNote id={noteId} error={error} hint={hint} />
    </div>
  );
};

export { FieldNote, InputField, inputClasses, labelClasses };
export type { FieldNoteProps, InputFieldProps, InputFieldSize };
