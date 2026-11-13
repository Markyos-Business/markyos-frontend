"use client";

import { useState } from "react";
import { AsYouType, isValidPhoneNumber, parsePhoneNumberFromString } from "libphonenumber-js";
import { DEFAULT_DIAL_CODE, DIAL_CODES } from "@/constants/dialCodes";
import { useUiStrings } from "../ui-strings";
import { Field, type FieldState } from "./field";
import { Listbox } from "../listbox/listbox";
import { describedBy } from "./input-field";

type PhoneFieldProps = Omit<FieldState, "success"> & {
  label?: string;
  info?: string;
  /** "+966". */
  dialCode: string;
  /** The national number as typed; formatted as you go ("50 123 4567"). */
  number: string;
  onDialCodeChange: (code: string) => void;
  onNumberChange: (number: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  success?: string;
  invalidMessage?: string;
  className?: string;
};

const isoFor = (code: string) => DIAL_CODES.find((d) => d.code === code)?.iso;

/**
 * A phone number: country code and number side by side in one box. The pair
 * stays left to right in Arabic, the way a phone number is written. The
 * number is formatted for its country as you type, and an incomplete one is
 * flagged on leaving the field.
 */
const PhoneField = ({
  label,
  info,
  dialCode,
  number,
  onDialCodeChange,
  onNumberChange,
  onBlur,
  placeholder = "50 123 4567",
  invalidMessage,
  error,
  className = "",
  ...state
}: PhoneFieldProps) => {
  const { t } = useUiStrings();
  const [invalid, setInvalid] = useState(false);
  const iso = isoFor(dialCode);
  const digits = number.replace(/\D/g, "");

  return (
    <Field
      label={label ?? t.phoneNumber}
      info={info}
      {...state}
      error={error ?? (invalid ? (invalidMessage ?? t.invalidPhone) : undefined)}
      boxDir="ltr"
      className={`min-h-field ${className}`}
      prefix={
        <Listbox
          aria-label={t.countryCode}
          value={dialCode}
          onChange={(code) => {
            onDialCodeChange(code);
            const nextIso = isoFor(code);
            if (digits) onNumberChange(nextIso ? new AsYouType(nextIso).input(digits) : digits);
          }}
          options={DIAL_CODES.map((d) => ({ value: d.code, label: d.label }))}
          panelWidth={200}
          disabled={state.disabled || state.locked || state.readOnly}
          triggerClassName="h-full bg-transparent font-medium text-text outline-none"
        />
      }
    >
      {(control) => (
        <input
          {...control}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          dir="ltr"
          value={number}
          placeholder={placeholder}
          aria-describedby={describedBy(undefined, control)}
          onChange={(e) => {
            const typed = e.target.value.replace(/[^\d\s()+-]/g, "");
            // Deleting a space or bracket shouldn't fight the formatter.
            const deleting = typed.length < number.length;
            onNumberChange(iso && !deleting ? new AsYouType(iso).input(typed) : typed);
            if (invalid) setInvalid(false);
          }}
          onBlur={() => {
            setInvalid(digits !== "" && !isValidPhoneNumber(`${dialCode}${digits}`));
            onBlur?.();
          }}
          className="mk-field-control"
        />
      )}
    </Field>
  );
};

type PhoneInputProps = Omit<PhoneFieldProps, "dialCode" | "number" | "onDialCodeChange" | "onNumberChange"> & {
  /** E.164, "+966501234567", or "". */
  value: string;
  onChange: (e164: string) => void;
  /** The code to start on when the value has none. Default +966. */
  defaultDialCode?: string;
};

/**
 * PhoneInput: one value in E.164 ("+966501234567"), the form a backend and
 * libphonenumber store, with the same field. Controlled.
 */
const PhoneInput = ({ value, onChange, defaultDialCode = DEFAULT_DIAL_CODE, ...rest }: PhoneInputProps) => {
  const parsed = value ? parsePhoneNumberFromString(value) : undefined;
  const [dialCode, setDialCode] = useState(() => (parsed ? `+${parsed.countryCallingCode}` : defaultDialCode));
  const [number, setNumber] = useState(() => (parsed ? parsed.formatNational() : ""));
  const emit = (code: string, typed: string) => {
    const digits = typed.replace(/\D/g, "").replace(/^0+/, "");
    onChange(digits ? `${code}${digits}` : "");
  };
  return (
    <PhoneField
      {...rest}
      dialCode={dialCode}
      number={number}
      onDialCodeChange={(code) => {
        setDialCode(code);
        emit(code, number);
      }}
      onNumberChange={(typed) => {
        setNumber(typed);
        emit(dialCode, typed);
      }}
    />
  );
};

export { PhoneField, PhoneInput };
export type { PhoneFieldProps, PhoneInputProps };
