"use client";

import { useMemo } from "react";
import { Combobox } from "../select/combobox";
import { MultiSelect } from "../select/multi-select";
import { Select } from "../select/select";
import type { SelectCommonProps, SelectOption } from "../select/types";
import { useUiStrings } from "../ui-strings";
import { COUNTRIES, LOCALES, MENA, MENA_ZONES, allZones, localeName, offsetMinutes, regionName, zoneCity, zoneOffset } from "./regions";

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

type LocalePickerProps = Common & {
  value: string;
  onChange: (locale: string) => void;
  /** Locale codes to offer. Default ar-SA, en-US, ar-AE, en-GB, ar-EG, fr-FR. */
  locales?: readonly string[];
};

/**
 * A language and region, as its code ("ar-SA") with its name ("Arabic (Saudi
 * Arabia)") in the reader's language. Never a flag: a flag is a country, not
 * a language.
 */
const LocalePicker = ({ value, onChange, locales = LOCALES, label, ...rest }: LocalePickerProps) => {
  const { t, lang } = useUiStrings();
  const options = useMemo(() => locales.map((code) => ({ value: code, label: `${localeName(code, lang)} · ${code}` })), [locales, lang]);
  return <Select {...rest} label={label ?? t.languageRegion} options={options} value={value} onValueChange={onChange} />;
};

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

type MarketPickerProps = Common & {
  value: string[];
  onChange: (markets: string[]) => void;
  countries?: readonly string[];
  /** The most markets at once. */
  max?: number;
};

/** Several markets (countries) as removable chips: where a campaign runs. */
const MarketPicker = ({ value, onChange, countries = COUNTRIES, max, label, ...rest }: MarketPickerProps) => {
  const { t } = useUiStrings();
  const options = useCountryOptions(countries);
  return <MultiSelect {...rest} label={label ?? t.markets} options={options} value={value} onValueChange={onChange} maxSelections={max} labels={{ search: t.searchCountries, ...rest.labels }} />;
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

export { CountryPicker, LocalePicker, MarketPicker, TimezonePicker };
export type { CountryPickerProps, LocalePickerProps, MarketPickerProps, TimezonePickerProps };
