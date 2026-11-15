"use client";

import { useMemo } from "react";
import { Combobox } from "../select/combobox";
import { MultiSelect } from "../select/multi-select";
import { Select } from "../select/select";
import type { SelectCommonProps, SelectOption } from "../select/types";
import { regionName } from "../special/regions";
import { useUiStrings } from "../ui-strings";

/** The region's Arabic locales first, then English. */
const DEFAULT_LOCALES = ["ar-SA", "ar-AE", "ar-EG", "en-US", "en-GB"] as const;

/** "العربية" for ar-SA, "English" for en-US: a language named in itself. */
function ownName(locale: string): string {
  const base = locale.split("-")[0];
  try {
    const name = new Intl.DisplayNames([base], { type: "language" }).of(base) ?? base;
    return name.charAt(0).toLocaleUpperCase(base) + name.slice(1);
  } catch {
    return locale;
  }
}

type Common = Omit<SelectCommonProps, "label"> & {
  label?: string;
  /** Locale codes to offer. Default ar-SA, ar-AE, ar-EG, en-US, en-GB. */
  locales?: readonly string[];
};

type LocalePickerProps = Common &
  (
    | { multiple?: false; value?: string; defaultValue?: string; onChange?: (locale: string) => void }
    | { multiple: true; value?: string[]; defaultValue?: string[]; onChange?: (locales: string[]) => void; max?: number }
  );

/**
 * A language and region: each locale in its own language with its code,
 * "العربية (ar-SA)", "English (en-US)", so a reader finds theirs whatever
 * the page's language, and is read in that language's voice. The region is
 * the line under it, in the reader's language. Never a flag: a flag is a
 * country, not a language. Searchable past 6 locales; `multiple` for several.
 */
const LocalePicker = (props: LocalePickerProps) => {
  const { t, lang } = useUiStrings();
  const { locales = DEFAULT_LOCALES, label, ...rest } = props;
  const options = useMemo<SelectOption[]>(
    () =>
      locales.map((code) => {
        const [base, region] = code.split("-");
        return { value: code, label: `${ownName(code)} (${code})`, lang: base, description: region ? regionName(region, lang) : undefined };
      }),
    [locales, lang],
  );

  if (rest.multiple) {
    const { multiple, value, defaultValue, onChange, max, ...field } = rest;
    void multiple; // narrowed the union; not a prop of the select
    return (
      <MultiSelect {...field} label={label ?? t.languages} options={options} value={value} defaultValue={defaultValue} onValueChange={onChange} maxSelections={max} labels={{ search: t.searchLanguages, ...field.labels }} />
    );
  }
  const { multiple, value, defaultValue, onChange, ...field } = rest;
  void multiple;
  const common = { ...field, label: label ?? t.languageRegion, options, value, defaultValue, onValueChange: onChange };
  return options.length > 6 ? <Combobox {...common} labels={{ search: t.searchLanguages, ...field.labels }} /> : <Select {...common} />;
};

export { DEFAULT_LOCALES, LocalePicker, ownName as localeOwnName };
export type { LocalePickerProps };
