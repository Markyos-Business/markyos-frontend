"use client";

import { createContext, useContext, type ReactNode } from "react";

/**
 * The words the kit's own components say — "Retry", "Clear filters", "3
 * selected" — in English and Arabic. Everything a feature says comes in
 * through props; this is only the kit's built-in chrome, so no component
 * hardcodes a language.
 */
const en = {
  errorTitle: "Something went wrong",
  errorBody: "This couldn't load. Try again.",
  retry: "Retry",
  search: "Search",
  clearFilters: "Clear filters",
  selected: (n: number) => `${n} selected`,
  clearSelection: "Clear selection",
  selectAll: "Select all rows on this page",
  selectRow: "Select row",
  rowActions: "Row actions",
  rowsPerPage: "Rows per page",
  sortedAscending: "sorted ascending",
  sortedDescending: "sorted descending",
  dateRange: "Date range",
  anyTime: "Any time",
  from: "From",
  to: "To",
  apply: "Apply",
  clear: "Clear",
  cancel: "Cancel",
  save: "Save",
  saving: "Saving…",
  close: "Close",
  more: (n: number) => `+${n}`,
  previousMonth: "Previous month",
  nextMonth: "Next month",
  openMenu: "Open menu",
  prev: "Prev",
  next: "Next",
  page: (n: number) => `Page ${n}`,
  pagesOf: (items: string) => `${items} pages`,
  showing: (first: number, last: number, total: number, items: string): (string | number)[] => [`Showing `, first, ` to `, last, ` of `, total, ` ${items}`],
};

type UiStrings = typeof en;

const ar: UiStrings = {
  errorTitle: "حدث خطأ ما",
  errorBody: "تعذّر التحميل. حاول مرة أخرى.",
  retry: "إعادة المحاولة",
  search: "بحث",
  clearFilters: "مسح عوامل التصفية",
  selected: (n) => `${n} محدد`,
  clearSelection: "إلغاء التحديد",
  selectAll: "تحديد كل الصفوف في هذه الصفحة",
  selectRow: "تحديد الصف",
  rowActions: "إجراءات الصف",
  rowsPerPage: "صفوف في الصفحة",
  sortedAscending: "مرتب تصاعديًا",
  sortedDescending: "مرتب تنازليًا",
  dateRange: "نطاق التاريخ",
  anyTime: "أي وقت",
  from: "من",
  to: "إلى",
  apply: "تطبيق",
  clear: "مسح",
  cancel: "إلغاء",
  save: "حفظ",
  saving: "جارٍ الحفظ…",
  close: "إغلاق",
  more: (n) => `+${n}`,
  previousMonth: "الشهر السابق",
  nextMonth: "الشهر التالي",
  openMenu: "فتح القائمة",
  prev: "السابق",
  next: "التالي",
  page: (n) => `الصفحة ${n}`,
  pagesOf: (items) => `صفحات ${items}`,
  showing: (first, last, total, items) => [`عرض `, first, ` إلى `, last, ` من `, total, ` ${items}`],
};

type UiLang = "en" | "ar";

const UiStringsContext = createContext<UiLang>("en");

type UiStringsProviderProps = { lang: UiLang; children: ReactNode };

/** Sets the language of the kit's built-in words below it. English by default. */
const UiStringsProvider = ({ lang, children }: UiStringsProviderProps) => (
  <UiStringsContext.Provider value={lang}>{children}</UiStringsContext.Provider>
);

/** The kit's built-in words in the current language, and that language. */
const useUiStrings = () => {
  const lang = useContext(UiStringsContext);
  return { t: lang === "ar" ? ar : en, lang, isAr: lang === "ar" };
};

export { UiStringsProvider, useUiStrings };
export type { UiLang, UiStrings };
