"use client";

import { useMemo } from "react";
import { Combobox } from "../select/combobox";
import type { SelectCommonProps, SelectOption } from "../select/types";
import { useUiStrings } from "../ui-strings";
import { COUNTRIES, MENA, MENA_ZONES, allZones, offsetMinutes, regionName, zoneCity, zoneOffset } from "./regions";

type Common = Omit<SelectCommonProps, "label"> & { label?: string };

/** The countries as options, the region's first, in the reader's language. */
function useCountryOptions(codes: readonly string[]) {
  const { lang } = useUiStrings();
  return useMemo<SelectOption[]>(
    () =>
      codes.map((code) => ({
        value: code,
        label: regionName(code, lang),
        description: code,
        group: MENA.includes(code) ? (lang === "ar" ? "المنطقة" : "Region") : lang === "ar" ? "دول أخرى" : "Other countries",
      })),
    [codes, lang],
  );
}

type CountryPickerProps = Common & {
  value: string;
  onChange: (country: string) => void;
  /** ISO codes to offer. Default the region, then common others. */
  countries?: readonly string[];
};

/** One country, searchable, named in the reader's language with its ISO code. */
const CountryPicker = ({ value, onChange, countries = COUNTRIES, label, ...rest }: CountryPickerProps) => {
  const { t } = useUiStrings();
  const options = useCountryOptions(countries);
  return <Combobox {...rest} label={label ?? t.country} options={options} value={value} onValueChange={onChange} labels={{ search: t.searchCountries, ...rest.labels }} />;
};

type TimezonePickerProps = Common & {
  /** An IANA zone. Default "Asia/Riyadh". */
  value?: string;
  onChange: (zone: string) => void;
};

/**
 * A time zone, searchable by city: the region's zones first, then every zone
 * the browser knows, sorted by offset. Each shows its offset now ("GMT+3").
 */
const TimezonePicker = ({ value = "Asia/Riyadh", onChange, label, ...rest }: TimezonePickerProps) => {
  const { t, lang } = useUiStrings();
  const options = useMemo<SelectOption[]>(() => {
    const now = new Date();
    const region = lang === "ar" ? "المنطقة" : "Region";
    const others = lang === "ar" ? "مناطق أخرى" : "Other zones";
    return allZones()
      .map((zone) => ({ zone, mena: MENA_ZONES.includes(zone), offset: offsetMinutes(zone, now) }))
      .sort((a, b) => (a.mena === b.mena ? (a.mena ? 0 : a.offset - b.offset) : a.mena ? -1 : 1))
      .map(({ zone, mena }) => ({ value: zone, label: `${zoneCity(zone)} · ${zoneOffset(zone, now)}`, description: zone, group: mena ? region : others }));
  }, [lang]);
  return <Combobox {...rest} label={label ?? t.timeZone} options={options} value={value} onValueChange={onChange} labels={{ search: t.searchTimeZones, ...rest.labels }} />;
};

export { CountryPicker, TimezonePicker };
export type { CountryPickerProps, TimezonePickerProps };
