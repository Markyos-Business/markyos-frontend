"use client";

import { useState } from "react";
import { useUiStrings } from "../../ui/i18n/uiStrings";
import { InputField, type InputFieldProps } from "../fields/InputField";

type EmailFieldProps = Omit<InputFieldProps, "type"> & {
  /** The message for an address that isn't one. Default "Enter an email like nour@studio.sa." */
  invalidMessage?: string;
};

/**
 * An email address. Left to right in either language, the email keyboard on
 * a phone, no spell-check, and the browser's own address check on leaving the
 * field, so a typo is caught before submit. Works with `register`.
 */
const EmailField = ({ error, invalidMessage, onBlur, onChange, ...rest }: EmailFieldProps) => {
  const { t } = useUiStrings();
  const [mismatch, setMismatch] = useState(false);
  return (
    <InputField
      type="email"
      inputMode="email"
      autoComplete="email"
      spellCheck={false}
      dir="ltr"
      {...rest}
      error={error ?? (mismatch ? (invalidMessage ?? t.invalidEmail) : undefined)}
      onBlur={(e) => {
        setMismatch(e.target.value !== "" && e.target.validity.typeMismatch);
        onBlur?.(e);
      }}
      onChange={(e) => {
        // Cleared as soon as it's fixed, not on the next blur.
        if (mismatch && !e.target.validity.typeMismatch) setMismatch(false);
        onChange?.(e);
      }}
    />
  );
};

/** EmailInput, by the UI library's name. */
const EmailInput = EmailField;

export { EmailField, EmailInput };
export type { EmailFieldProps };
