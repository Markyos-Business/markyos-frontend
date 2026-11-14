"use client";
import { useState } from "react";
import Link from "next/link";
import { BackButton, BadgeButton, Button, ButtonGroup, CloseButton, ConfirmButton, CopyButton, Fab, HoldToConfirmButton, Icon, IconButton, LinkButton, MenuButton, ProviderButton, SplitButton, ToggleButton, ToggleGroup, UploadButton, useAsyncButton, type ButtonVariant } from "@/components/ui";
const variants: ButtonVariant[] = ["primary", "secondary", "outline", "ghost", "destructive", "link"];
const states = ["default", "hover", "focus", "pressed", "disabled", "loading", "success", "error", "locked", "skeleton"] as const;
/** The matrix simulates visual states; the examples below it are interactive. */
export function ButtonsGallery() {
  const [ar, setAr] = useState(false);
  const [view, setView] = useState<string | string[]>("list");
  const [message, setMessage] = useState("");
  const [showFab, setShowFab] = useState(false);
  const save = useAsyncButton(async () => { await new Promise((resolve) => setTimeout(resolve, 700)); setMessage(ar ? "حُفظ الملف" : "File saved"); });
  const t = (en: string, arabic: string) => ar ? arabic : en;
  const words = { loadingText: t("Saving", "جارٍ الحفظ"), successText: t("Saved", "تم الحفظ"), errorText: t("Try again", "حاول مجددًا"), lockedReason: t("Ask for access", "اطلب صلاحية الوصول") };
  const items = [{ label: t("Save draft", "احفظ المسودة"), icon: "check", shortcut: "⌘S", onSelect: () => setMessage(t("Draft saved", "حُفظت المسودة")) }, { separator: true as const }, { label: t("Export file", "صدّر الملف"), icon: "download", disabled: true }, { label: t("Delete file", "احذف الملف"), icon: "trash", destructive: true, onSelect: () => setMessage(t("File deleted", "حُذف الملف")) }];
  return <section id="buttons" data-gallery-section="Button family" dir={ar ? "rtl" : "ltr"} lang={ar ? "ar" : "en"} className="mk-surface min-w-0 rounded-card bg-surface-1 p-4 text-text sm:p-6">
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><h2 className="text-h4 font-medium">{t("Buttons", "الأزرار")}</h2><Button onClick={() => { setAr(!ar); setMessage(""); }} data-button-language>{t("Use Arabic", "استخدم الإنجليزية")}</Button></div>
    <p className="mb-4 text-body text-text-muted">{t("Six variants and ten states. Scroll the matrix to compare.", "ستة أنماط وعشر حالات. مرّر الجدول للمقارنة.")}</p>
    <div className="max-w-full overflow-x-auto rounded-lg shadow-edge" tabIndex={0} role="region" aria-label={t("Button states", "حالات الأزرار")}>
      <table className="w-full text-start text-caption"><caption className="sr-only">{t("Button state matrix", "جدول حالات الأزرار")}</caption><thead><tr><th scope="col" className="p-3 text-start">{t("Variant", "النمط")}</th>{states.map((state, index) => <th key={state} scope="col" className="p-3 text-start">{ar ? ["عادي", "تحويم", "تركيز", "مضغوط", "معطّل", "تحميل", "نجاح", "خطأ", "مقفل", "هيكل"][index] : state}</th>)}</tr></thead><tbody>{variants.map((variant, index) => <tr key={variant}><th scope="row" className="p-3 text-start font-medium">{ar ? ["أساسي", "ثانوي", "محدّد", "خفيف", "حذف", "رابط"][index] : variant}</th>{states.map((state) => <td key={state} className="p-3"><Button {...words} variant={variant} size="sm" data-state={state} disabled={state === "disabled"} status={state === "loading" || state === "success" || state === "error" ? state : "idle"} locked={state === "locked"} skeleton={state === "skeleton"} icon={<Icon name="check" size={16} />}>{t("Save file", "احفظ الملف")}</Button></td>)}</tr>)}</tbody></table>
    </div>
    <div className="mt-6 flex flex-wrap items-center gap-3" data-button-examples>
      <Button {...words} variant="primary" status={save.status} onClick={() => void save.run()}>{t("Save changes", "احفظ التغييرات")}</Button>
      <ButtonGroup label={t("Asset actions", "إجراءات الأصول")}><Button>{t("Add asset", "أضف أصلًا")}</Button><Button>{t("Edit asset", "عدّل الأصل")}</Button></ButtonGroup>
      <ButtonGroup orientation="vertical" label={t("File actions", "إجراءات الملف")}><Button>{t("Open file", "افتح الملف")}</Button><Button>{t("Export file", "صدّر الملف")}</Button></ButtonGroup>
      <IconButton icon="plus" label={t("Add asset", "أضف أصلًا")} shape="round" />
      <SplitButton {...words} items={items} menuLabel={t("Open options", "افتح الخيارات")} onClick={() => setMessage(t("Changes saved", "حُفظت التغييرات"))}>{t("Save file", "احفظ الملف")}</SplitButton>
      <MenuButton label={t("Open actions", "افتح الإجراءات")} items={items} />
      <MenuButton label={t("Export options", "خيارات التصدير")} items={items} disabledReason={t("Select an asset first", "حدّد أصلًا أولًا")} />
      <MenuButton label={t("Open more", "افتح المزيد")} items={items} iconOnly />
      <ToggleButton>{t("Show grid", "اعرض الشبكة")}</ToggleButton>
      <ToggleGroup label={t("Choose view", "اختر العرض")} options={[{ value: "list", label: t("List view", "عرض القائمة") }, { value: "grid", label: t("Grid view", "عرض الشبكة") }, { value: "map", label: t("Map view", "عرض الخريطة"), disabled: true }]} value={view} onValueChange={setView} />
      <ToggleGroup type="multiple" label={t("Choose formatting", "اختر التنسيق")} options={[{ value: "bold", label: t("Use bold", "استخدم العريض") }, { value: "italic", label: t("Use italic", "استخدم المائل") }]} />
      <CopyButton {...words} value="https://markyos.com" label={t("Copy link", "انسخ الرابط")} copiedLabel={t("Copied", "تم النسخ")} />
      <UploadButton accept="image/*" multiple onFiles={(files) => setMessage(`${files.length} ${t("files selected", "ملفات محددة")}`)}>{t("Upload files", "ارفع ملفات")}</UploadButton>
      <ConfirmButton {...words} confirmText={t("Click again to delete", "اضغط مجددًا للحذف")} onConfirm={() => setMessage(t("Item deleted", "حُذف العنصر"))}>{t("Delete item", "احذف العنصر")}</ConfirmButton>
      <ConfirmButton {...words} mode="dialog" dialogTitle={t("Delete file?", "حذف الملف؟")} dialogDescription={t("This action cannot be undone.", "لا يمكن التراجع عن هذا الإجراء.")} cancelLabel={t("Cancel", "إلغاء")} confirmLabel={t("Delete file", "احذف الملف")} onConfirm={() => setMessage(t("File deleted", "حُذف الملف"))}>{t("Delete file", "احذف الملف")}</ConfirmButton>
      <HoldToConfirmButton {...words} holdLabel={t("Hold to delete", "اضغط مطولًا للحذف")} onConfirm={() => setMessage(t("Hold confirmed", "تم التأكيد بالضغط"))} />
      {(["google", "microsoft", "apple"] as const).map((provider) => <ProviderButton key={provider} provider={provider} label={ar ? `تابع باستخدام ${provider}` : undefined} />)}
      <Button asChild><Link href="#buttons">{t("View buttons", "اعرض الأزرار")}</Link></Button>
      <LinkButton href="https://markyos.com" external>{t("Visit website", "زر الموقع")}</LinkButton>
      <CloseButton label={t("Close panel", "أغلق اللوحة")} />
      <BackButton>{t("Go back", "ارجع للخلف")}</BackButton>
      <BadgeButton count={12}>{t("View reviews", "اعرض المراجعات")}</BadgeButton>
      <BadgeButton unread unreadLabel={t("Unread items", "عناصر غير مقروءة")}>{t("Read messages", "اقرأ الرسائل")}</BadgeButton>
      <Button disabledReason={t("Select an asset first", "حدّد أصلًا أولًا")}>{t("Export asset", "صدّر الأصل")}</Button>
      <Fab icon="plus" label={t("Add item", "أضف عنصرًا")} className="!static" onClick={() => setMessage(t("Item added", "أُضيف العنصر"))} />
      <Button onClick={() => setShowFab(!showFab)}>{t("Toggle floating action", "بدّل الزر العائم")}</Button>
      {showFab && <Fab icon="plus" label={t("Add item", "أضف عنصرًا")} onClick={() => setMessage(t("Item added", "أُضيف العنصر"))} />}
    </div>
    <div className="mt-5 flex flex-wrap gap-3">{(["xs", "sm", "md", "lg"] as const).map((size) => <Button key={size} size={size}>{t("Add asset", "أضف أصلًا")} · {size}</Button>)}</div>
    <p role="status" className="mt-4 min-h-6 text-body text-success">{message}</p>
  </section>;
}
