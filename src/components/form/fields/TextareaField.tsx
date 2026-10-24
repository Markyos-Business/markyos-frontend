"use client";

import { useId } from "react";
import type { TextareaHTMLAttributes } from "react";
import { FieldLabel, FieldNote, inputClasses } from "./InputField";

type TextareaFieldProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "className"> & {
  label: string;
  error?: string;
  hint?: string;
};

/** A labelled multi-line field that the person can make taller. */
const TextareaField = ({ label, error, hint, ...rest }: TextareaFieldProps) => {
  const reactId = useId();
  const id = rest.id ?? `ta-${reactId}`;
  const noteId = `${id}-note`;
  return (
    <div className="flex w-full flex-col gap-space-2">
      <FieldLabel htmlFor={id} required={rest.required}>
        {label}
      </FieldLabel>
      <textarea
        {...rest}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ?? hint ? noteId : undefined}
        className={`${inputClasses} min-h-24 resize-y`}
      />
      <FieldNote id={noteId} error={error} hint={hint} />
    </div>
  );
};

export { TextareaField };
export type { TextareaFieldProps };
