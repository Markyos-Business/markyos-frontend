"use client";

import { useId } from "react";
import { FieldLabel, FieldNote } from "./InputField";
import { SelectInput, type SelectInputProps } from "./SelectInput";

type SelectFieldProps = Omit<SelectInputProps, "id"> & {
  label: string;
  hint?: string;
};

/** A labelled select for forms: the same label, note and error as InputField. */
const SelectField = ({ label, hint, error, required, placeholder = "Select …", ...rest }: SelectFieldProps) => {
  const id = `sf-${useId()}`;
  const noteId = `${id}-note`;
  return (
    <div className="flex min-h-field w-full flex-col gap-space-2">
      <FieldLabel htmlFor={id} required={required}>
        {label}
      </FieldLabel>
      <SelectInput
        {...rest}
        id={id}
        required={required}
        error={error}
        placeholder={placeholder}
        aria-describedby={error ?? hint ? noteId : undefined}
      />
      <FieldNote id={noteId} error={error} hint={hint} />
    </div>
  );
};

export { SelectField };
export type { SelectFieldProps };
