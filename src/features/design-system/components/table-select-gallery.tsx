"use client";
import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { AsyncSelect, Badge, Button, Combobox, DataTable, MultiSelect, NativeSelect, Select, UiStringsProvider, type DataColumn, type DataTableState, type RowState, type SelectLabels, type SelectOption } from "@/components/ui";
import type { TableLabels } from "@/components/ui";
import { ThemeToggle } from "@/components/ui";

type Asset = { id: string; name: string; owner: string; city: string; budget: number; date: string; status: string };
const owners = ["Nour Haddad", "Omar Aziz", "Lina Mansour", "Yousef Ali"];
const cities = ["Riyadh", "Dubai", "Cairo"];
const assetNames = ["Ramadan campaign", "Riyadh identity", "Dubai launch", "Cairo photography"];
const rowsOf = (count: number): Asset[] => Array.from({ length: count }, (_, i) => ({ id: `asset-${i + 1}`, name: `${assetNames[i % 4]} ${i + 1}`, owner: owners[i % 4], city: cities[i % 3], budget: 500 + i * 25, date: "2027-02-15", status: i % 5 ? "Ready" : "In review" }));
const modes = ["all", "basic", "selectable", "sortable", "filterable", "paginated", "infinite", "expandable", "nested", "grouped", "editable", "actions", "sticky", "columns", "density", "virtualized", "media", "reorder", "row-states"];
const arabicModes = ["كل المزايا", "أساسي", "التحديد", "الترتيب", "التصفية", "الصفحات", "تحميل المزيد", "تفاصيل الصف", "صفوف متداخلة", "التجميع", "التحرير", "الإجراءات", "أعمدة ثابتة", "إدارة الأعمدة", "الكثافة", "١٠ آلاف صف", "الوسائط", "إعادة الترتيب", "حالات الصف"];
const arTable: Partial<TableLabels> = {
  search: "البحث في الصفوف", filters: "التصفية", clearFilters: "مسح التصفية", columns: "الأعمدة", density: "الكثافة", compact: "مضغوطة", comfortable: "مريحة",
  retry: "إعادة المحاولة", error: "تعذر تحميل هذه الصفوف.", empty: "لا توجد أصول لعرضها.", noPermission: "ليس لديك صلاحية الوصول إلى هذه الأصول.", stale: "نعرض البيانات المحفوظة. أعد الاتصال للتحديث.",
  loadMore: "تحميل المزيد", loadingMore: "جارٍ تحميل صفوف إضافية…", noResults: q => `لا توجد أصول تطابق «${q}».`, selected: n => `تم تحديد ${n}`, results: n => `تم تحميل ${n} نتائج`,
  selectAll: "تحديد كل صفوف الصفحة", selectRow: name => `تحديد ${name}`, selectAllMatching: n => `تحديد الكل (${n})`, clearSelection: "إلغاء التحديد",
  actions: name => `إجراءات ${name}`, expand: name => `عرض تفاصيل ${name}`, collapse: name => `إخفاء تفاصيل ${name}`, groupCount: n => `${n} صفوف`, save: "حفظ", cancel: "إلغاء", edit: name => `تعديل ${name}`,
  saving: "جارٍ الحفظ…", saved: "تم الحفظ", failed: "تعذر حفظ هذا الصف.", moveRow: "إعادة ترتيب الصف", moveEarlier: name => `نقل ${name} قبل السابق`, moveLater: name => `نقل ${name} بعد التالي`, resize: name => `تغيير عرض ${name}`, pageSize: "صفوف الصفحة", range: (a,b,n) => `${a}–${b} من ${n}`,
};
const arSelect: Partial<SelectLabels> = { placeholder: "اختر خيارًا", search: "البحث في الخيارات", noOptions: "لا توجد خيارات متاحة.", noResults: "لا توجد خيارات تطابق البحث.", loading: "جارٍ تحميل الخيارات…", loadError: "تعذر تحميل الخيارات.", retry: "إعادة المحاولة", success: "تم حفظ الاختيار.", maxReached: n => `يمكنك تحديد ${n} خيارات بحد أقصى.`, create: q => `إنشاء «${q}»`, remove: name => `إزالة ${name}`, overflow: n => `+${n}`, selected: n => `تم تحديد ${n}` };
const stateOptions = ["idle", "loading", "empty", "no-results", "error", "stale", "no-permission", "refetching"];
const arStates = ["جاهز", "التحميل", "فارغ", "لا نتائج", "خطأ", "غير متصل", "دون صلاحية", "تحديث البيانات"];
const selectStates = ["default", "disabled", "read-only", "invalid", "success", "loading", "no-options", "no-results", "max", "error"];
const arSelectStates = ["افتراضي", "معطل", "للقراءة فقط", "غير صالح", "نجاح", "تحميل", "دون خيارات", "لا نتائج", "الحد الأقصى", "خطأ"];

export function TableSelectGallery() {
  const [lang, setLang] = useState<"en" | "ar">("en"); const isAr = lang === "ar"; const dir: "ltr" | "rtl" = isAr ? "rtl" : "ltr";
  const t = (en: string, ar: string) => isAr ? ar : en;
  const [mode, setMode] = useState("all"); const [state, setState] = useState("idle"); const [selectState, setSelectState] = useState("default");
  const [data, setData] = useState(() => rowsOf(500)); const virtualData = useMemo(() => rowsOf(10000), []);
  const [search, setSearch] = useState(""); const [limit, setLimit] = useState(40); const [loadingMore, setLoadingMore] = useState(false);
  const [lastAction, setLastAction] = useState(""); const [recovered, setRecovered] = useState<string[]>([]);
  const active = (feature: string) => mode === feature || mode === "all";
  const cityOptions: SelectOption[] = cities.map((city, i) => ({ value: city, label: isAr ? ["الرياض", "دبي", "القاهرة"][i] : city, group: isAr ? "المدن" : "Cities", description: isAr ? ["المملكة العربية السعودية", "الإمارات العربية المتحدة", "مصر"][i] : ["Saudi Arabia", "United Arab Emirates", "Egypt"][i] }));
  const people: SelectOption[] = owners.map((name,i) => ({ value: name, label: isAr ? ["نور حداد", "عمر عزيز", "لينا منصور", "يوسف علي"][i] : name, avatar: { initials: name.split(" ").map(p => p[0]).join("") }, status: { label: t("Available", "متاح"), tone: "success" }, description: cityOptions[i % 3].label }));
  const columns: DataColumn<Asset>[] = [
    { key: "name", header: t("Asset", "الأصل"), width: 260, sortValue: r => r.name, editable: "text", media: active("media") ? r => ({ src: "/icon.svg", name: r.name, meta: t("Brand asset", "أصل العلامة") }) : undefined },
    { key: "owner", header: t("Owner", "المسؤول"), sortable: true, editable: "select", editOptions: people, filterable: true },
    { key: "city", header: t("City", "المدينة"), sortable: true, filterable: true, filterOptions: cityOptions, cell: r => <bdi>{cityOptions.find(o => o.value === r.city)?.label}</bdi> },
    { key: "budget", header: t("Budget", "الميزانية"), sortValue: r => r.budget, cell: r => <bdi dir="ltr">{r.budget.toLocaleString("en-US")} SAR</bdi> },
    { key: "date", header: t("Due date", "تاريخ التسليم"), editable: "date", cell: r => <bdi dir="ltr">{r.date}</bdi> },
    { key: "status", header: t("Status", "الحالة"), cell: r => <Badge dot tone={r.status === "Ready" ? "success" : "warning"}>{r.status === "Ready" ? t("Ready", "جاهز") : t("In review", "قيد المراجعة")}</Badge> },
  ];
  const loadOptions = useCallback(async (query: string, { signal }: { signal: AbortSignal }) => {
    await new Promise<void>((resolve, reject) => { const timer = setTimeout(resolve, 400); signal.addEventListener("abort", () => { clearTimeout(timer); reject(new DOMException("Aborted", "AbortError")); }, { once: true }); });
    return owners.filter(name => name.toLowerCase().includes(query.toLowerCase())).map(name => ({ value: name, label: name, description: "Markyos" }));
  }, []);
  const stateLoader = useCallback(async (query: string, context: { signal: AbortSignal }) => {
    if (selectState === "error") throw new Error("Demo request failure");
    if (selectState === "loading") await new Promise<void>((resolve, reject) => { const timer = setTimeout(resolve, 20000); context.signal.addEventListener("abort", () => { clearTimeout(timer); reject(new DOMException("Aborted", "AbortError")); }, { once: true }); });
    return loadOptions(query, context);
  }, [loadOptions, selectState]);
  const loadMore = useCallback(() => { setLoadingMore(true); setTimeout(() => { setLimit(n => Math.min(n + 40, 500)); setLoadingMore(false); }, 600); }, []);
  const rowStates: RowState[] = ["idle", "disabled", "locked", "highlighted", "unread", "saving", "saved", "failed"];
  const selectLabels = isAr ? arSelect : undefined;
  const common = { labels: selectLabels, dir };
  return <UiStringsProvider lang={lang}><main lang={lang} dir={dir} data-table-select-gallery className="min-h-screen min-w-0 bg-canvas text-text">
    <header className="sticky top-0 z-sticky flex flex-wrap items-center justify-between gap-space-4 bg-canvas px-space-6 py-space-4 shadow-rule-b">
      <div><Link href="/design-system" className="text-caption text-accent-text underline">{t("UI library", "مكتبة الواجهة")}</Link><h1 className="text-h3 font-medium">{t("Tables & selects", "الجداول والاختيار")}</h1></div>
      <div className="flex items-center gap-space-3"><Button variant="outline" size="sm" onClick={() => setLang(lang === "en" ? "ar" : "en")} data-gallery-language>{isAr ? "English" : "العربية"}</Button><ThemeToggle isAr={isAr} /></div>
    </header>
    <div className="mx-auto flex max-w-[1440px] min-w-0 flex-col gap-space-8 px-space-4 py-space-8 sm:px-space-8">
      <section aria-label={t("Table playground", "تجربة الجدول")} className="flex min-w-0 flex-col gap-space-5">
        <div className="flex flex-wrap gap-space-5"><Select {...common} label={t("Table type", "نوع الجدول")} value={mode} options={modes.map((value,i) => ({value,label:isAr ? arabicModes[i] : value === "all" ? "All features" : value[0].toUpperCase()+value.slice(1)}))} onValueChange={setMode} /><Select {...common} label={t("Table state", "حالة الجدول")} value={state} options={stateOptions.map((value,i) => ({value,label:isAr ? arStates[i] : value[0].toUpperCase()+value.slice(1)}))} onValueChange={setState} /></div>
        <p className="text-body text-text-muted">{t("500 MENA assets; 10,000 in virtualized mode. Shift-click sorts multiple columns; use arrows on resize and reorder handles.", "٥٠٠ أصل من المنطقة؛ و١٠ آلاف في العرض الافتراضي. استخدم Shift للترتيب المتعدد والأسهم لتغيير العرض وإعادة الترتيب.")}</p>
        <DataTable key={mode} dir={dir} label={t("Brand assets", "أصول العلامة")} columns={columns} data={state === "empty" ? [] : mode === "virtualized" ? virtualData : mode === "infinite" ? data.slice(0,limit) : mode === "row-states" ? data.slice(0,8) : data} getRowId={row => row.id} getRowLabel={row => row.name}
          labels={isAr ? arTable : undefined} itemLabel={t("assets", "أصول")} state={state === "no-results" ? "idle" : state as DataTableState}
          onRetry={() => setState("idle")} emptyAction={<Button onClick={() => setState("idle")}>{t("Add assets", "إضافة أصول")}</Button>}
          selectable={active("selectable")} sortable={active("sortable")} filterable={active("filterable")} search={state === "no-results" ? "Jeddah" : search} onSearchChange={query => { setSearch(query); if(state === "no-results") setState("idle"); }}
          pagination={mode === "virtualized" || mode === "infinite" ? false : true} pageSizes={[20,50,100]}
          infinite={mode === "infinite" ? { hasMore: limit < 500, loading: loadingMore, onLoadMore: loadMore, auto: true } : undefined}
          expandable={active("expandable") ? row => <p className="text-body">{t("Review the campaign assets with", "راجع أصول الحملة مع")} <bdi>{row.owner}</bdi>.</p> : undefined}
          getSubRows={mode === "nested" ? row => row.id === "asset-1" ? [{ ...row, id: "child-1", name: "Ramadan story format" }] : undefined : undefined}
          groupBy={mode === "grouped" ? "city" : undefined} editable={active("editable")} onEdit={async (row,key,value) => { await new Promise(resolve => setTimeout(resolve, 350)); if(value === "fail") throw new Error("Demo save failure"); setData(previous => previous.map(item => item.id === row.id ? {...item,[key]:value} : item)); }}
          rowActions={active("actions") ? row => [{ label:t("Open asset", "فتح الأصل"),icon:"external-link-alt",onSelect:()=>setLastAction(row.name) }] : undefined}
          rowHoverActions={active("actions") ? row => <Button size="xs" variant="outline" onClick={()=>setLastAction(row.name)}>{t("Open", "فتح")}</Button> : undefined}
          stickyHeader stickyColumns={active("sticky") ? {first:true,actions:true} : undefined} columnControls={active("columns")} resizable={active("columns")} reorderColumns={active("columns")} densityControl={active("density")}
          virtualized={mode === "virtualized" ? { height:480 } : false} mobileCard={{primary:"name",secondary:["owner","city","budget","date","status"]}}
          onReorderRows={mode === "reorder" ? setData : undefined}
          getRowState={mode === "row-states" ? row => recovered.includes(row.id) ? "idle" : rowStates[Number(row.id.split("-")[1])-1] : undefined} onRowRetry={row=>setRecovered(previous=>[...previous,row.id])}
          bulkActions={[{label:t("Move assets", "نقل الأصول"),progressLabel:n=>t(`Moving ${n} assets…`,`جارٍ نقل ${n} أصل…`),onSelect:async selection=>{await new Promise(resolve=>setTimeout(resolve,800));setLastAction(t(`Moved ${selection.count} assets.`,`تم نقل ${selection.count} أصل.`));}}]} />
        <p role="status" className="text-caption text-text-muted">{lastAction}</p>
      </section>
      <section aria-label={t("Select families", "عائلات الاختيار")} className="flex min-w-0 flex-col gap-space-5">
        <h2 className="text-h4 font-medium">{t("Select families", "عائلات الاختيار")}</h2>
        <div className="grid min-w-0 gap-space-6 rounded-card bg-surface-1 p-space-5 shadow-edge min-[720px]:grid-cols-2">
          <Select {...common} label={t("Basic select", "اختيار أساسي")} options={cityOptions} hint={t("Select a city.", "اختر مدينة.")} />
          <Combobox {...common} label={t("Searchable single", "اختيار واحد قابل للبحث")} options={cityOptions} />
          <MultiSelect {...common} label={t("Multi-select chips", "اختيار متعدد")} options={[...cityOptions,...people]} defaultValue={["Riyadh","Dubai","Cairo",owners[0],owners[1]]} maxVisibleTags={2} />
          <AsyncSelect {...common} label={t("Async people search", "بحث غير متزامن عن الأشخاص")} loadOptions={loadOptions} />
          <Select {...common} label={t("Grouped options", "خيارات مجمعة")} options={[...cityOptions,...people.map(o=>({...o,group:t("People","الأشخاص")}))]} />
          <Combobox {...common} label={t("Create a campaign", "إنشاء حملة")} options={[{value:"ramadan",label:t("Ramadan 2027","رمضان ٢٠٢٧")}]} creatable />
          <Combobox {...common} label={t("Rich people options", "خيارات الأشخاص المفصلة")} options={people} />
          <NativeSelect {...common} label={t("Native city select", "اختيار المدينة الأصلي")} options={cityOptions} />
          <Select {...common} label={t("Native on touch", "اختيار أصلي باللمس")} options={cityOptions} useNative />
        </div>
      </section>
      <section aria-label={t("Select states", "حالات الاختيار")} className="flex min-w-0 flex-col gap-space-5 rounded-card bg-surface-1 p-space-5 shadow-edge">
        <h2 className="text-h4 font-medium">{t("Select states", "حالات الاختيار")}</h2>
        <Select {...common} label={t("Select state", "حالة الاختيار")} value={selectState} options={selectStates.map((value,i)=>({value,label:isAr?arSelectStates[i]:value}))} onValueChange={setSelectState} />
        {selectState === "loading" || selectState === "error" ? <AsyncSelect key={selectState} {...common} label={t("State example", "مثال الحالة")} loadOptions={stateLoader} /> : selectState === "max" ? <MultiSelect {...common} label={t("State example", "مثال الحالة")} options={cityOptions} defaultValue={["Riyadh","Dubai"]} maxSelections={2} /> : selectState === "no-results" ? <Combobox {...common} label={t("State example", "مثال الحالة")} options={cityOptions} search="Jeddah" /> : <Select key={selectState} {...common} label={t("State example", "مثال الحالة")} hint={t("Select the campaign city.", "اختر مدينة الحملة.")} options={selectState === "no-options" ? [] : cityOptions} disabled={selectState === "disabled"} readOnly={selectState === "read-only"} error={selectState === "invalid" ? t("Select a city to continue.", "اختر مدينة للمتابعة.") : undefined} success={selectState === "success"} defaultValue={["read-only","success"].includes(selectState)?"Riyadh":""} />}
      </section>
    </div>
  </main></UiStringsProvider>;
}
