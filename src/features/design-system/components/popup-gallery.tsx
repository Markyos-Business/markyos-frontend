"use client";
import { useState } from "react";
import Link from "next/link";
import { Button, FormDialog, InputField, Popup, Select, SelectField, ThemeToggle, UiStringsProvider, useDialog } from "@/components/ui";
function Examples({ isAr }: { isAr: boolean }) {
  const t = (en: string, ar: string) => isAr ? ar : en;
  const dir = isAr ? "rtl" : "ltr";
  const [basic, setBasic] = useState(false); const [sheet, setSheet] = useState(false); const [form, setForm] = useState(false); const [nested, setNested] = useState(false);
  const [name, setName] = useState("Riyadh Coffee"); const [city, setCity] = useState(""); const [fail, setFail] = useState(false); const [saved, setSaved] = useState("");
  const { confirm } = useDialog();
  const cities = [{value:"riyadh",label:t("Riyadh","الرياض")},{value:"dubai",label:t("Dubai","دبي")},{value:"cairo",label:t("Cairo","القاهرة")}];
  return <>
    <div className="flex flex-wrap gap-space-4">
      <Button onClick={() => setBasic(true)}>{t("Open popup", "فتح النافذة")}</Button>
      <Button variant="secondary" onClick={() => setSheet(true)}>{t("Open sheet", "فتح اللوحة الجانبية")}</Button>
      <Button variant="secondary" onClick={() => setForm(true)}>{t("Open form", "فتح النموذج")}</Button>
    </div>
    <p role="status" className="text-body text-text-muted">{saved}</p>
    <Popup open={basic} onOpenChange={setBasic} title={t("Brand details", "تفاصيل العلامة")} description={t("Review your brand before sharing it.", "راجع علامتك قبل مشاركتها.")} dir={dir} footer={<Button variant="secondary" onClick={() => setBasic(false)}>{t("Close popup", "إغلاق النافذة")}</Button>}>
      <InputField label={t("Brand name", "اسم العلامة")} value={name} onChange={event => setName(event.target.value)} />
      <Select label={t("City", "المدينة")} dir={dir} options={cities} value={city} onValueChange={setCity} />
      <SelectField label={t("Legacy city", "المدينة بالقائمة القديمة")} placeholder={t("Select a city", "اختر مدينة")} options={cities} value={city} onChange={setCity} />
      <Button variant="secondary" onClick={() => setNested(true)}>{t("Open nested popup", "فتح نافذة متداخلة")}</Button>
      <Button variant="secondary" onClick={() => void confirm({title:t("Discard changes?","تجاهل التغييرات؟"),body:t("Your unsaved edits will be removed.","ستُحذف تعديلاتك غير المحفوظة."),tone:"danger",isAr})}>{t("Open confirmation", "فتح التأكيد")}</Button>
      <Popup open={nested} onOpenChange={setNested} title={t("Nested details", "تفاصيل متداخلة")} dir={dir} size="sm"><p className="text-body">{t("Escape closes this layer first.", "يغلق مفتاح Escape هذه الطبقة أولًا.")}</p><Button onClick={() => setNested(false)}>{t("Return to details", "العودة إلى التفاصيل")}</Button></Popup>
    </Popup>
    <Popup open={sheet} onOpenChange={setSheet} title={t("Brand activity", "نشاط العلامة")} description={t("Recent changes for your team.", "آخر تغييرات فريقك.")} dir={dir} variant="sheet" size="sm" footer={<Button onClick={() => setSheet(false)}>{t("Done", "تم")}</Button>}>
      {Array.from({length:24},(_,index)=><p key={index} className="text-body">{t(`Review ${index+1}: Riyadh, Dubai and Cairo brand assets.`,`مراجعة ${index+1}: أصول العلامات في الرياض ودبي والقاهرة.`)}</p>)}
    </Popup>
    <FormDialog open={form} title={t("Save brand", "حفظ العلامة")} submitLabel={t("Save brand", "حفظ العلامة")} onClose={() => setForm(false)} onSubmit={async () => {await new Promise(resolve=>setTimeout(resolve,800));if(fail){setFail(false);throw new Error("Demo save failure");}setSaved(t("Brand saved.","تم حفظ العلامة."));}}>
      <InputField label={t("Brand name", "اسم العلامة")} value={name} onChange={event=>setName(event.target.value)} />
      <Button variant="secondary" onClick={() => setFail(true)}>{t("Fail next save", "إظهار خطأ الحفظ التالي")}</Button>
    </FormDialog>
  </>;
}
export function PopupGallery() {
  const [lang, setLang] = useState<"en"|"ar">("en"); const isAr=lang==="ar";
  return <UiStringsProvider lang={lang}><main data-popup-gallery lang={lang} dir={isAr?"rtl":"ltr"} className="min-h-screen bg-canvas px-space-6 py-space-8 text-text sm:px-space-10">
    <header className="mb-space-8 flex flex-wrap items-center justify-between gap-space-4"><div><Link href="/design-system" className="text-caption text-accent-text underline">{isAr?"مكتبة الواجهة":"UI library"}</Link><h1 className="text-h3 font-medium">{isAr?"النوافذ القابلة لإعادة الاستخدام":"Reusable popups"}</h1></div><div className="flex gap-space-3"><Button variant="secondary" onClick={()=>setLang(isAr?"en":"ar")} data-popup-language>{isAr?"English":"العربية"}</Button><ThemeToggle isAr={isAr}/></div></header>
    <Examples isAr={isAr}/>
  </main></UiStringsProvider>;
}
