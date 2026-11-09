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
  upload: "Upload",
  fileLimit: (kind: string, limit: string) => `${kind} – max ${limit}`,
  wrongFileType: (name: string, kind: string) => `"${name}" isn't a ${kind} file.`,
  fileTooLarge: (name: string, limit: string) => `"${name}" is larger than ${limit}.`,
  dragOrBrowse: "Drag and drop, or",
  browse: "browse",
  remove: (name: string) => `Remove ${name}`,
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
  colorArea: "Saturation and brightness",
  hue: "Hue",
  colorFormat: "Colour format",
  eyedropper: "Pick from screen",
  channels: { rgb: ["Red", "Green", "Blue"], hsl: ["Hue", "Saturation", "Lightness"], cmyk: ["Cyan", "Magenta", "Yellow", "Black"] },
  cmykNote: "Approximate, without an ICC profile. Confirm with your printer.",
  invalidHex: "Enter a hex like #0099FF.",
  copy: "Copy",
  copied: "Copied",
  valueCopied: (v: string) => `${v} copied`,
  copyFailed: "Couldn't copy. Select the value and copy it.",
  brandColours: "Brand colours",
  chooseColour: "Choose a colour",
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
  upload: "رفع",
  fileLimit: (kind, limit) => `${kind}، بحد أقصى ${limit}`,
  wrongFileType: (name, kind) => `«${name}» ليس ملف ${kind}.`,
  fileTooLarge: (name, limit) => `«${name}» أكبر من ${limit}.`,
  dragOrBrowse: "اسحب وأفلت، أو",
  browse: "اختر ملفًا",
  remove: (name) => `إزالة ${name}`,
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
  colorArea: "التشبّع والسطوع",
  hue: "درجة اللون",
  colorFormat: "صيغة اللون",
  eyedropper: "التقط من الشاشة",
  channels: { rgb: ["أحمر", "أخضر", "أزرق"], hsl: ["الدرجة", "التشبّع", "الإضاءة"], cmyk: ["سماوي", "أرجواني", "أصفر", "أسود"] },
  cmykNote: "قيمة تقريبية بدون ملف ألوان ICC. تأكّد منها مع المطبعة.",
  invalidHex: "أدخل قيمة سداسية مثل ‎#0099FF.",
  copy: "نسخ",
  copied: "تم النسخ",
  valueCopied: (v) => `تم نسخ ${v}`,
  copyFailed: "تعذّر النسخ. حدّد القيمة وانسخها.",
  brandColours: "ألوان الهوية",
  chooseColour: "اختر لونًا",
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
