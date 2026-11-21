"use client";
import { useState } from "react";
import Link from "next/link";
import { Button, DateRangeButton, FilterBar, FilterSelectField, SearchField, ThemeToggle, UiStringsProvider } from "@/components/ui";
const empty = { q:"", role:"", status:"", type:"", lang:"", from:"", to:"" };
function Examples({ isAr }: { isAr:boolean }) {
  const [values,setValues]=useState(empty);const t=(en:string,ar:string)=>isAr?ar:en;
  const set=(key:keyof typeof empty,value:string)=>setValues(previous=>({...previous,[key]:value}));
  const count=[values.role,values.status,values.type,values.lang,values.from||values.to].filter(Boolean).length;
  const options = [
    {key:"role" as const,label:t("Role","الدور"),icon:"user-shield",choices:[["",t("All roles","كل الأدوار")],["admin",t("Admin","مسؤول")],["member",t("Member","عضو")],["content",t("Content manager","مدير المحتوى")]]},
    {key:"status" as const,label:t("Status","الحالة"),icon:"filter",choices:[["",t("All statuses","كل الحالات")],["active",t("Active","نشط")],["waiting",t("Waiting to join","بانتظار الانضمام")],["deactivated",t("Deactivated","معطل")]]},
    {key:"type" as const,label:t("Account type","نوع الحساب"),icon:"users",choices:[["",t("All types","كل الأنواع")],["studio",t("Studio","استوديو")],["company",t("Company","شركة")],["freelancer",t("Freelancer","مستقل")]]},
    {key:"lang" as const,label:t("Language","اللغة"),icon:"language",choices:[["",t("All languages","كل اللغات")],["en","English"],["ar","العربية"],["none",t("Follows the brand","حسب العلامة")]]},
  ];
  return <><FilterBar search={<SearchField label={t("Search users","البحث عن المستخدمين")} placeholder={t("Search name or email","ابحث بالاسم أو البريد")} value={values.q} onChange={event=>set("q",event.target.value)} shortcut/>} active={Object.values(values).some(Boolean)} filterCount={count} onClear={()=>setValues(empty)}>
    {options.map(option=><FilterSelectField key={option.key} label={option.label} hideLabel icon={option.icon} active={!!values[option.key]} value={values[option.key]} onChange={value=>set(option.key,value)} options={option.choices.map(([value,label])=>({value,label}))}/>)}
    <DateRangeButton label={t("Last active","آخر نشاط")} placeholder={t("Last active","آخر نشاط")} value={{from:values.from||undefined,to:values.to||undefined}} onChange={range=>setValues(previous=>({...previous,from:range.from??"",to:range.to??""}))}/>
  </FilterBar><p role="status" className="mt-space-6 text-body text-text-muted">{t("Filters update immediately; close the panel to review the results.","تُحدّث عوامل التصفية فورًا؛ أغلق اللوحة لمراجعة النتائج.")}</p><output data-filter-values className="sr-only">{JSON.stringify(values)}</output></>;
}
export function FilterGallery(){const [lang,setLang]=useState<"en"|"ar">("en");const isAr=lang==="ar";return <UiStringsProvider lang={lang}><main data-filter-gallery dir={isAr?"rtl":"ltr"} lang={lang} className="min-h-screen bg-canvas px-space-5 py-space-8 text-text sm:px-space-10"><header className="mb-space-8 flex flex-wrap items-center justify-between gap-space-4"><div><Link href="/design-system" className="text-caption text-accent-text underline">{isAr?"مكتبة الواجهة":"UI library"}</Link><h1 className="text-h3 font-medium">{isAr?"عوامل تصفية المستخدمين":"User filters"}</h1></div><div className="flex gap-space-3"><Button data-filter-language variant="outline" onClick={()=>setLang(isAr?"en":"ar")}>{isAr?"English":"العربية"}</Button><ThemeToggle isAr={isAr}/></div></header><Examples key={lang} isAr={isAr}/></main></UiStringsProvider>}
