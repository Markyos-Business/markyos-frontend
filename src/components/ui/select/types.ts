import type { BadgeTone } from "../badge/variants";

export type SelectOption = {
  value: string;
  label: string;
  description?: string;
  group?: string;
  icon?: string;
  avatar?: { src?: string; initials: string };
  status?: { label: string; tone: BadgeTone };
  disabled?: boolean;
};
export type SelectLabels = {
  placeholder: string; search: string; noOptions: string; noResults: string;
  loading: string; loadError: string; retry: string; success: string;
  maxReached: (count: number) => string; create: (query: string) => string;
  remove: (label: string) => string; overflow: (count: number) => string;
  selected: (count: number) => string;
};
export const selectLabels: SelectLabels = {
  placeholder: "Select an option", search: "Search options", noOptions: "No options are available.",
  noResults: "No options match your search.", loading: "Loading options…", loadError: "Options could not be loaded.",
  retry: "Retry", success: "Selection saved.", maxReached: n => `You can select up to ${n} options.`,
  create: q => `Create “${q}”`, remove: label => `Remove ${label}`, overflow: n => `+${n}`,
  selected: n => `${n} selected`,
};
export const selectLabelsAr: SelectLabels = {
  placeholder: "اختر خيارًا", search: "ابحث في الخيارات", noOptions: "لا توجد خيارات متاحة.",
  noResults: "لا توجد خيارات تطابق بحثك.", loading: "جارٍ تحميل الخيارات…", loadError: "تعذّر تحميل الخيارات.",
  retry: "إعادة المحاولة", success: "حُفظ الاختيار.", maxReached: n => `يمكنك اختيار ${n} خيارات كحد أقصى.`,
  create: q => `إنشاء «${q}»`, remove: label => `إزالة ${label}`, overflow: n => `+${n}`,
  selected: n => `${n} مختارة`,
};
export type SelectCommonProps = {
  id?: string; name?: string; label?: string; hint?: string; error?: string; success?: boolean;
  disabled?: boolean; readOnly?: boolean; required?: boolean; dir?: "ltr" | "rtl";
  placeholder?: string; className?: string; labels?: Partial<SelectLabels>;
  "aria-label"?: string; "aria-labelledby"?: string; "aria-describedby"?: string;
  onBlur?: () => void; useNative?: boolean;
};
export type SelectProps = SelectCommonProps & {
  options: readonly SelectOption[]; value?: string; defaultValue?: string; onValueChange?: (value: string) => void;
};
export type ComboboxProps = SelectProps & {
  creatable?: boolean; onCreate?: (label: string) => SelectOption | Promise<SelectOption>;
  search?: string; onSearchChange?: (query: string) => void;
};
export type MultiSelectProps = SelectCommonProps & {
  options: readonly SelectOption[]; value?: string[]; defaultValue?: string[];
  onValueChange?: (values: string[]) => void; maxSelections?: number; maxVisibleTags?: number;
  creatable?: boolean; onCreate?: ComboboxProps["onCreate"];
};
export type AsyncSelectProps = Omit<ComboboxProps, "options"> & {
  loadOptions: (query: string, context: { signal: AbortSignal }) => Promise<readonly SelectOption[]>;
  debounceMs?: number;
};
