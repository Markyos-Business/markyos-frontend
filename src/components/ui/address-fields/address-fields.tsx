"use client";

import { useState } from "react";
import type { ChangeEvent, FocusEvent, Ref } from "react";
import { Fieldset } from "../field/field";
import { InputField } from "../field/input-field";
import { Select } from "../select/select";
import { CountryPicker } from "../special/region-pickers";
import { useUiStrings, type UiStrings } from "../ui-strings";
import { addressIssues, digitsOnly, linesFor, type Address, type AddressIssue, type AddressKey, type LineLabel } from "./validate";

const EMIRATES = [
  ["Abu Dhabi", "أبوظبي"], ["Dubai", "دبي"], ["Sharjah", "الشارقة"], ["Ajman", "عجمان"],
  ["Umm Al Quwain", "أم القيوين"], ["Ras Al Khaimah", "رأس الخيمة"], ["Fujairah", "الفجيرة"],
] as const;

/** What react-hook-form's `register(name)` returns, or anything shaped like it. */
type LineProps = {
  name?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement> | { target: { name?: string; value: string }; type?: string }) => unknown;
  onBlur?: (e: FocusEvent<HTMLInputElement>) => unknown;
  ref?: Ref<HTMLInputElement>;
};

type AddressFieldsProps = {
  legend?: string;
  /** One typed object. Controlled with `onChange`; or `defaultValue`. */
  value?: Address;
  defaultValue?: Address;
  onChange?: (value: Address) => void;
  /** When focus leaves the whole address: one react-hook-form field. */
  onBlur?: () => void;
  /** Names the lines "<name>.street"… for a native form. */
  name?: string;
  /**
   * Separate fields instead: each line's `register`, e.g.
   * `lineProps={(k) => register(\`address.${k}\`)}`. The country is a line too.
   */
  lineProps?: (key: keyof Address) => LineProps;
  /** Errors from the form, by line; they win over the built-in checks. */
  errors?: Partial<Record<keyof Address, string>>;
  /** Every line the country needs must be filled (checked on leaving it). Default true. */
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  locked?: boolean;
  lockedReason?: string;
  loading?: boolean;
  /** Countries the picker offers. */
  countries?: readonly string[];
  /** Lines side by side from the small breakpoint (2), or one under another (1). Default 2. */
  columns?: 1 | 2;
  labels?: Partial<Record<LineLabel | "address" | "country", string>> & { enterField?: (label: string) => string; digitsError?: (label: string, n: number) => string; digitsHint?: (n: number) => string };
};

const EMPTY: Address = { country: "SA" };

/**
 * A postal address in the shape each country uses, as one typed object.
 *
 * Saudi Arabia is the National Address: building number (4 digits), street,
 * district, city, postal code (5) and additional number (4). The UAE is
 * emirate, area, street and building; Egypt governorate, city, district,
 * street and building; elsewhere street, building, city, region and postal
 * code. Changing the country keeps only the country. Each line has its own
 * label and error; number lines are left to right with a numeric keyboard,
 * take Arabic-Indic digits, and check their length on leaving.
 *
 * With react-hook-form: one `Controller` over the object (value, onChange,
 * onBlur, `errors` from the field's sub-errors), or separate fields through
 * `lineProps` and `register`. `addressIssues` runs the same rules in a zod
 * `superRefine`.
 */
const AddressFields = ({
  legend,
  value,
  defaultValue = EMPTY,
  onChange,
  onBlur,
  name,
  lineProps,
  errors,
  required = true,
  disabled = false,
  readOnly = false,
  locked = false,
  lockedReason,
  loading = false,
  countries,
  columns = 2,
  labels,
}: AddressFieldsProps) => {
  const { t, lang } = useUiStrings();
  const [own, setOwn] = useState<Address>(defaultValue);
  const [touched, setTouched] = useState<Partial<Record<keyof Address, boolean>>>({});
  const address = value ?? own;
  const word = (k: LineLabel | "country") => labels?.[k] ?? t[k];
  const issues = addressIssues(address, { required });
  const message = (k: keyof Address, label: string, issue?: AddressIssue) =>
    errors?.[k] ?? (touched[k] && issue ? (issue.code === "digits" ? (labels?.digitsError ?? t.digitsError)(label, issue.digits) : (labels?.enterField ?? t.enterField)(label)) : undefined);

  const commit = (next: Address) => {
    if (value === undefined) setOwn(next);
    onChange?.(next);
  };
  const setLine = (key: AddressKey, v: string) => {
    commit({ ...address, [key]: v });
    lineProps?.(key).onChange?.({ target: { name: lineProps(key).name, value: v }, type: "change" });
  };
  const leave = (key: keyof Address) => setTouched((x) => ({ ...x, [key]: true }));
  const state = { disabled, readOnly, locked, lockedReason, loading };

  const line = ({ key, label: labelKey, digits, optional, autoComplete }: ReturnType<typeof linesFor>[number]) => {
    const label = word(labelKey);
    const reg = lineProps?.(key);
    if (key === "region" && address.country === "AE") {
      return (
        <Select
          key={`${address.country}-${key}`}
          label={label}
          name={reg?.name ?? (name ? `${name}.${key}` : undefined)}
          required={required && !optional}
          {...state}
          options={EMIRATES.map(([en, ar]) => ({ value: en, label: lang === "ar" ? ar : en }))}
          value={address.region ?? ""}
          onValueChange={(v) => setLine(key, v)}
          onBlur={() => leave(key)}
          error={message(key, label, issues[key])}
        />
      );
    }
    return (
      <InputField
        key={`${address.country}-${key}`}
        label={label}
        name={reg?.name ?? (name ? `${name}.${key}` : undefined)}
        ref={reg?.ref}
        value={address[key] ?? ""}
        required={required && !optional}
        optional={!required || optional}
        autoComplete={autoComplete}
        {...state}
        {...(digits ? { inputMode: "numeric" as const, dir: "ltr", boxDir: "ltr" as const, maxLength: digits, hint: (labels?.digitsHint ?? t.digitsHint)(digits) } : {})}
        error={message(key, label, issues[key])}
        onChange={(e) => setLine(key, digits ? digitsOnly(e.target.value) : e.target.value)}
        onBlur={(e) => {
          leave(key);
          reg?.onBlur?.(e);
        }}
      />
    );
  };

  return (
    <div
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) onBlur?.();
      }}
    >
      <Fieldset legend={legend ?? labels?.address ?? t.address} columns={columns} disabled={disabled}>
        <div className={columns === 2 ? "sm:col-span-2" : ""}>
          <CountryPicker
            label={word("country")}
            name={lineProps?.("country").name ?? (name ? `${name}.country` : undefined)}
            value={address.country}
            countries={countries}
            onChange={(country) => {
              commit({ country });
              setTouched({});
              lineProps?.("country").onChange?.({ target: { name: lineProps("country").name, value: country }, type: "change" });
            }}
            error={errors?.country}
            required={required}
            {...state}
          />
        </div>
        {linesFor(address.country).map(line)}
      </Fieldset>
    </div>
  );
};

/** The label words AddressFields uses, for a caller passing its own. */
type AddressLabels = Pick<UiStrings, LineLabel | "address" | "country">;

export { AddressFields };
export type { AddressFieldsProps, AddressLabels, LineProps as AddressLineProps };
