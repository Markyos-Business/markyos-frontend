"use client";

import { useId } from "react";
import { DIAL_CODES } from "@/constants/dialCodes";
import { FieldLabel, FieldNote } from "../fields/InputField";

type PhoneFieldProps = {
  label?: string;
  dialCode: string;
  number: string;
  onDialCodeChange: (code: string) => void;
  onNumberChange: (number: string) => void;
  onBlur?: () => void;
  required?: boolean;
  placeholder?: string;
  error?: string;
};

/**
 * A phone number: country code and number side by side in one box. The pair
 * stays left to right in Arabic, the way a phone number is written; the
 * number keeps only digits, spaces, brackets and dashes.
 */
const PhoneField = ({
  label = "Phone number",
  dialCode,
  number,
  onDialCodeChange,
  onNumberChange,
  onBlur,
  required = false,
  placeholder = "50 123 4567",
  error,
}: PhoneFieldProps) => {
  const id = `ph-${useId()}`;
  const noteId = `${id}-note`;
  return (
    <div className="flex min-h-field w-full flex-col gap-space-2">
      <FieldLabel htmlFor={id} required={required}>
        {label}
      </FieldLabel>
      <div
        dir="ltr"
        // The underline field around both parts, so the code and the number
        // read as one field and share its focus and error state.
        className="mk-underline flex gap-space-4"
      >
        <select
          aria-label="Country code"
          value={dialCode}
          onChange={(e) => onDialCodeChange(e.target.value)}
          className="shrink-0 cursor-pointer bg-transparent text-body font-medium text-text outline-none"
        >
          {DIAL_CODES.map((d) => (
            <option key={d.code} value={d.code}>
              {d.label}
            </option>
          ))}
        </select>
        <input
          id={id}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          value={number}
          required={required}
          placeholder={placeholder}
          onChange={(e) => onNumberChange(e.target.value.replace(/[^\d\s()-]/g, ""))}
          onBlur={onBlur}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? noteId : undefined}
          className="min-w-0 flex-1 bg-transparent text-body font-medium text-text outline-none placeholder:font-normal placeholder:text-text-disabled"
        />
      </div>
      <FieldNote id={noteId} error={error} />
    </div>
  );
};

export { PhoneField };
export type { PhoneFieldProps };
