"use client";

import { useState } from "react";
import { Fieldset } from "../field/field";
import { InputField } from "../field/input-field";
import { Select } from "../select/select";
import { useUiStrings } from "../ui-strings";
import { CountryPicker } from "./region-pickers";

type Address = {
  /** ISO code: "SA", "AE", "EG"… */
  country: string;
  building?: string;
  street?: string;
  /** District (SA, EG) or area (AE). */
  district?: string;
  city?: string;
  /** Emirate (AE), governorate (EG) or region elsewhere. */
  region?: string;
  postalCode?: string;
  /** Saudi national address: the 4-digit additional number. */
  additional?: string;
  poBox?: string;
};

type AddressKey = Exclude<keyof Address, "country">;

type AddressFieldsProps = {
  legend?: string;
  value: Address;
  onChange: (value: Address) => void;
  /** Errors from the form, by field. */
  errors?: Partial<Record<keyof Address, string>>;
  required?: boolean;
  disabled?: boolean;
};

const EMIRATES = [
  ["Abu Dhabi", "أبوظبي"], ["Dubai", "دبي"], ["Sharjah", "الشارقة"], ["Ajman", "عجمان"],
  ["Umm Al Quwain", "أم القيوين"], ["Ras Al Khaimah", "رأس الخيمة"], ["Fujairah", "الفجيرة"],
] as const;

/** Which digits-only fields each country has, and how many digits. */
const DIGITS: Record<string, Partial<Record<AddressKey, number>>> = {
  SA: { building: 4, postalCode: 5, additional: 4 },
  EG: { postalCode: 5 },
};

/**
 * A postal address in the shape each country uses: the Saudi national
 * address (building number, street, district, city, postal code, additional
 * number), the UAE's (building, street, area, city, emirate, PO box) and
 * Egypt's (building, street, district, city, governorate, postal code), and a
 * general one elsewhere. Number fields are left to right with a numeric
 * keyboard and check their length on leaving. Controlled.
 */
const AddressFields = ({ legend, value, onChange, errors, required = false, disabled = false }: AddressFieldsProps) => {
  const { t, lang } = useUiStrings();
  const [lengthErrors, setLengthErrors] = useState<Partial<Record<AddressKey, string>>>({});
  const c = value.country;
  const set = (key: AddressKey, v: string) => onChange({ ...value, [key]: v });
  const digits = DIGITS[c] ?? {};

  const field = (key: AddressKey, label: string, opts: { optional?: boolean; autoComplete?: string } = {}) => {
    const n = digits[key];
    return (
      <InputField
        key={`${c}-${key}`}
        label={label}
        value={value[key] ?? ""}
        disabled={disabled}
        required={required && !opts.optional}
        optional={opts.optional}
        autoComplete={opts.autoComplete}
        {...(n ? { inputMode: "numeric" as const, dir: "ltr", maxLength: n, hint: t.digitsHint(n) } : {})}
        error={errors?.[key] ?? lengthErrors[key]}
        onChange={(e) => {
          set(key, n ? e.target.value.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x660)).replace(/\D/g, "") : e.target.value);
          if (lengthErrors[key]) setLengthErrors((x) => ({ ...x, [key]: undefined }));
        }}
        onBlur={(e) => {
          if (n && e.target.value && e.target.value.length !== n) setLengthErrors((x) => ({ ...x, [key]: t.digitsError(label, n) }));
        }}
      />
    );
  };

  return (
    <Fieldset legend={legend ?? t.address} columns={2} disabled={disabled}>
      <div className="sm:col-span-2">
        <CountryPicker value={c} onChange={(country) => onChange({ country })} error={errors?.country} required={required} />
      </div>
      {c === "SA" ? (
        <>
          {field("building", t.buildingNumber)}
          {field("street", t.street, { autoComplete: "address-line1" })}
          {field("district", t.district)}
          {field("city", t.city, { autoComplete: "address-level2" })}
          {field("postalCode", t.postalCode, { autoComplete: "postal-code" })}
          {field("additional", t.additionalNumber)}
        </>
      ) : c === "AE" ? (
        <>
          {field("building", t.buildingNumber)}
          {field("street", t.street, { autoComplete: "address-line1" })}
          {field("district", t.area)}
          {field("city", t.city, { autoComplete: "address-level2" })}
          <Select
            label={t.emirate}
            required={required}
            disabled={disabled}
            options={EMIRATES.map(([en, ar]) => ({ value: en, label: lang === "ar" ? ar : en }))}
            value={value.region}
            onValueChange={(v) => set("region", v)}
            error={errors?.region}
          />
          {field("poBox", t.poBox, { optional: true })}
        </>
      ) : c === "EG" ? (
        <>
          {field("building", t.buildingNumber)}
          {field("street", t.street, { autoComplete: "address-line1" })}
          {field("district", t.district)}
          {field("city", t.city, { autoComplete: "address-level2" })}
          {field("region", t.governorate, { autoComplete: "address-level1" })}
          {field("postalCode", t.postalCode, { autoComplete: "postal-code" })}
        </>
      ) : (
        <>
          {field("building", t.buildingNumber, { optional: true })}
          {field("street", t.street, { autoComplete: "address-line1" })}
          {field("city", t.city, { autoComplete: "address-level2" })}
          {field("region", t.district, { optional: true, autoComplete: "address-level1" })}
          {field("postalCode", t.postalCode, { optional: true, autoComplete: "postal-code" })}
        </>
      )}
    </Fieldset>
  );
};

export { AddressFields };
export type { Address, AddressFieldsProps };
