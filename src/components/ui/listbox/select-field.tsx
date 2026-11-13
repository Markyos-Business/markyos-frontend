"use client";

import { useId } from "react";
import { FieldLabel, FieldNote, fieldBlockClasses } from "../field/input-field";
import { SelectInput, type SelectInputProps } from "./select-input";

type SelectFieldProps = Omit<SelectInputProps, "id"> & {
  label: string;
  hint?: string;
};

/** A labelled select for forms: the same label, underline, note and error as InputField. */
const SelectField = ({ label, hint, error, required, placeholder = "Select…", size = "md", ...rest }: SelectFieldProps) => {
  const id = `sf-${useId()}`;
  const noteId = `${id}-note`;
  return (
    <div className={fieldBlockClasses(size)}>
      <FieldLabel htmlFor={id} required={required}>
        {label}
      </FieldLabel>
      <SelectInput
        {...rest}
        id={id}
        required={required}
        error={error}
        placeholder={placeholder}
        size={size}
        aria-describedby={error ?? hint ? noteId : undefined}
      />
      <FieldNote id={noteId} error={error} hint={hint} />
    </div>
  );
};

export { SelectField };
export type { SelectFieldProps };
