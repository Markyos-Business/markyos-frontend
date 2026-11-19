import { plural } from "@/lib/i18n/plural";
import type { TableLabels } from "./types";

/**
 * The table's own words. Generic on purpose: a screen that lists assets says
 * "No assets match" through `labels`, the kit doesn't assume what a row is.
 */
export const tableLabels: TableLabels = {
  search: "Search rows", filters: "Filters", clearFilters: "Clear filters", columns: "Columns", density: "Density", compact: "Compact", comfortable: "Comfortable",
  retry: "Retry", error: "These rows couldn't be loaded.", empty: "Nothing to show yet.", noPermission: "You don't have access to this.", stale: "Showing saved data. Reconnect to refresh.",
  loadMore: "Load more", loadingMore: "Loading more rows…", noResults: q => `Nothing matches “${q}”.`, selected: n => `${n} selected`,
  results: n => plural("en", n, { one: "{n} result loaded", other: "{n} results loaded" }),
  selectAll: "Select all rows on this page", selectRow: label => `Select ${label}`, selectAllMatching: n => `Select all ${n}`, clearSelection: "Clear selection",
  actions: label => `Actions for ${label}`, expand: label => `Expand ${label}`, collapse: label => `Collapse ${label}`,
  groupCount: n => plural("en", n, { one: "{n} row", other: "{n} rows" }),
  save: "Save", cancel: "Cancel", edit: label => `Edit ${label}`, saving: "Saving…", saved: "Saved", failed: "This row couldn't be saved.", moveRow: "Reorder row",
  moveEarlier: label => `Move ${label} earlier`, moveLater: label => `Move ${label} later`, resize: label => `Resize ${label}`, pageSize: "Rows per page", rows: "rows", range: (a, b, n) => `${a}–${b} of ${n}`,
};

export const arTableLabels: TableLabels = {
  search: "البحث في الصفوف", filters: "التصفية", clearFilters: "مسح التصفية", columns: "الأعمدة", density: "الكثافة", compact: "مضغوطة", comfortable: "مريحة",
  retry: "إعادة المحاولة", error: "تعذّر تحميل هذه الصفوف.", empty: "لا يوجد ما يُعرض بعد.", noPermission: "ليست لديك صلاحية الوصول إلى هذا.", stale: "نعرض البيانات المحفوظة. أعد الاتصال للتحديث.",
  loadMore: "تحميل المزيد", loadingMore: "جارٍ تحميل صفوف إضافية…", noResults: q => `لا توجد نتائج تطابق «${q}».`, selected: n => `تم تحديد ${n}`,
  results: n => plural("ar", n, { one: "تم تحميل نتيجة واحدة", two: "تم تحميل نتيجتين", few: "تم تحميل {n} نتائج", other: "تم تحميل {n} نتيجة" }),
  selectAll: "تحديد كل صفوف الصفحة", selectRow: name => `تحديد ${name}`, selectAllMatching: n => `تحديد الكل (${n})`, clearSelection: "إلغاء التحديد",
  actions: name => `إجراءات ${name}`, expand: name => `عرض تفاصيل ${name}`, collapse: name => `إخفاء تفاصيل ${name}`,
  groupCount: n => plural("ar", n, { one: "صف واحد", two: "صفّان", few: "{n} صفوف", many: "{n} صفًا", other: "{n} صف" }),
  save: "حفظ", cancel: "إلغاء", edit: name => `تعديل ${name}`, saving: "جارٍ الحفظ…", saved: "تم الحفظ", failed: "تعذّر حفظ هذا الصف.", moveRow: "إعادة ترتيب الصف",
  moveEarlier: name => `نقل ${name} إلى الأعلى`, moveLater: name => `نقل ${name} إلى الأسفل`, resize: name => `تغيير عرض ${name}`, pageSize: "صفوف الصفحة", rows: "صفوف", range: (a, b, n) => `${a}–${b} من ${n}`,
};
