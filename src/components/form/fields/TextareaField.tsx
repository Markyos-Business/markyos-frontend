"use client";

import { useId } from "react";
import type { TextareaHTMLAttributes } from "react";
import { FieldLabel, FieldNote, fieldBlockClasses, fieldClasses, type FieldSize } from "./InputField";

type TextareaFieldProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "className"> & {
  /** Layout only, on the outer block. */
  className?: string;
  /** Optional for a box that has an aria-label instead (a note under a row). */
  label?: string;
  error?: string;
  hint?: string;
  size?: FieldSize;
  /** Let the person drag it taller. Default true. */
  resizable?: boolean;
};

/** A labelled multi-line field that the person can make taller. */
const TextareaField = ({ label, error, hint, size = "md", resizable = true, className = "", ...rest }: TextareaFieldProps) => {
  const reactId = useId();
  const id = rest.id ?? `ta-${reactId}`;
  const noteId = `${id}-note`;
  return (
    <div className={`${size === "sm" ? fieldBlockClasses("sm") : "flex w-full flex-col gap-space-2"} ${className}`}>
      {label && (
        <FieldLabel htmlFor={id} required={rest.required}>
          {label}
        </FieldLabel>
      )}
      <textarea
        {...rest}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ?? hint ? noteId : undefined}
        className={`${fieldClasses(size)} ${size === "sm" ? "min-h-16" : "min-h-24"} ${resizable ? "resize-y" : "resize-none"}`}
      />
      <FieldNote id={noteId} error={error} hint={hint} />
    </div>
  );
};

export { TextareaField };
export type { TextareaFieldProps };
