"use client";

/**
 * MarketPicker: where a campaign runs, as regions → countries → cities.
 *
 * Built on Combobox / MultiSelect, not CountryPicker: CountryPicker takes a
 * list of ISO codes and groups them itself (the region, then the rest), so it
 * can't take a custom list with our own groups or cities under a country.
 * Wrapping it would mean adding both to it for one caller; the select family
 * already has groups, search and chips, plus the `indent` option flag for a
 * city under its country.
 */

import { useMemo } from "react";
import { Combobox } from "../select/combobox";
import { MultiSelect } from "../select/multi-select";
import type { SelectCommonProps, SelectOption } from "../select/types";
import { regionName } from "../special/regions";
import { useUiStrings, type UiStrings } from "../ui-strings";

type MarketRegion = keyof UiStrings["marketGroups"];

/** A market: a country (ISO code) or "global", with its cities. Values are "SA" and "SA-riyadh". */
type Market = { country: string; region: MarketRegion; cities?: readonly { id: string; en: string; ar: string }[] };

const MARKETS: readonly Market[] = [
  { country: "SA", region: "gcc", cities: [{ id: "riyadh", en: "Riyadh", ar: "الرياض" }, { id: "jeddah", en: "Jeddah", ar: "جدة" }, { id: "dammam", en: "Dammam", ar: "الدمام" }] },
  { country: "AE", region: "gcc", cities: [{ id: "dubai", en: "Dubai", ar: "دبي" }, { id: "abu-dhabi", en: "Abu Dhabi", ar: "أبوظبي" }, { id: "sharjah", en: "Sharjah", ar: "الشارقة" }] },
  { country: "KW", region: "gcc", cities: [{ id: "kuwait-city", en: "Kuwait City", ar: "مدينة الكويت" }] },
  { country: "QA", region: "gcc", cities: [{ id: "doha", en: "Doha", ar: "الدوحة" }] },
  { country: "BH", region: "gcc", cities: [{ id: "manama", en: "Manama", ar: "المنامة" }] },
  { country: "OM", region: "gcc", cities: [{ id: "muscat", en: "Muscat", ar: "مسقط" }] },
  { country: "JO", region: "levant", cities: [{ id: "amman", en: "Amman", ar: "عمّان" }] },
  { country: "LB", region: "levant", cities: [{ id: "beirut", en: "Beirut", ar: "بيروت" }] },
  { country: "EG", region: "northAfrica", cities: [{ id: "cairo", en: "Cairo", ar: "القاهرة" }, { id: "alexandria", en: "Alexandria", ar: "الإسكندرية" }] },
  { country: "MA", region: "northAfrica", cities: [{ id: "casablanca", en: "Casablanca", ar: "الدار البيضاء" }] },
  { country: "global", region: "global" },
  { country: "GB", region: "global", cities: [{ id: "london", en: "London", ar: "لندن" }] },
  { country: "US", region: "global" },
];

type Common = Omit<SelectCommonProps, "label"> & {
  label?: string;
  /** Markets to offer. Default the GCC, the Levant, North Africa and global. */
  markets?: readonly Market[];
  /** Offer cities under each country. Default true. */
  cities?: boolean;
};

type MarketPickerProps = Common &
  (
    | { multiple?: false; value?: string; defaultValue?: string; onChange?: (market: string) => void }
    | { multiple: true; value?: string[]; defaultValue?: string[]; onChange?: (markets: string[]) => void; max?: number }
  );

/**
 * Markets grouped by region (GCC, Levant, North Africa, Global), each
 * country followed by its cities, indented; search finds a city by its
 * country too. One market, or several as chips with `multiple`.
 */
const MarketPicker = (props: MarketPickerProps) => {
  const { t, lang } = useUiStrings();
  const { markets = MARKETS, cities = true, label, ...rest } = props;
  const options = useMemo<SelectOption[]>(
    () =>
      markets.flatMap((m) => {
        const group = t.marketGroups[m.region];
        const country = m.country === "global" ? t.worldwide : regionName(m.country, lang);
        const head: SelectOption = { value: m.country, label: country, group, description: m.country === "global" ? undefined : m.country };
        const sub = cities ? (m.cities ?? []).map((c) => ({ value: `${m.country}-${c.id}`, label: lang === "ar" ? c.ar : c.en, description: country, group, indent: true })) : [];
        return [head, ...sub];
      }),
    [markets, cities, lang, t],
  );

  if (rest.multiple) {
    const { multiple, value, defaultValue, onChange, max, ...field } = rest;
    void multiple; // narrowed the union; not a prop of the select
    return <MultiSelect {...field} label={label ?? t.markets} options={options} value={value} defaultValue={defaultValue} onValueChange={onChange} maxSelections={max} labels={{ search: t.searchCountries, ...field.labels }} />;
  }
  const { multiple, value, defaultValue, onChange, ...field } = rest;
  void multiple;
  return <Combobox {...field} label={label ?? t.market} options={options} value={value} defaultValue={defaultValue} onValueChange={onChange} labels={{ search: t.searchCountries, ...field.labels }} />;
};

export { MARKETS, MarketPicker };
export type { Market, MarketPickerProps, MarketRegion };
