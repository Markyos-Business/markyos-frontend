"use client";

import { useState, type ReactNode } from "react";
import {
  Button,
  DatePicker,
  FilterSelectField,
  Icon,
  IconButton,
  InputField,
  SearchField,
  SegmentedControl,
  SelectField,
  SelectInput,
  SortControl,
  TextareaField,
  type ButtonVariant,
} from "@/components/ui";

/**
 * Every form control in every size, variant and state, side by side, in
 * English and Arabic, light and dark (UX-CON-001, MARKYOS_UI §2.6). The four
 * panels scope the theme and the direction themselves, so one screen shows
 * all of them; hover and focus are drawn statically (`data-state` on buttons,
 * `data-preview` on fields) so they can be compared without a mouse.
 */

type Lang = "en" | "ar";
const T = {
  en: { sizes: "Sizes", variants: "Button variants and states", fields: "Field states", rows: "Rows that must line up", choose: "Choose one", search: "Search brands…", sort: "Sort", last: "Last edited", name: "Name A–Z", newBrand: "New brand", save: "Save", cancel: "Cancel", email: "Email", password: "Password", copy: "Copy", generate: "Generate", role: "Role", editor: "Editor", client: "Client", date: "Closes on", notes: "Notes", value: "Nadeen Studio", hint: "Shown on the guideline.", error: "Enter a valid email address.", success: "Available.", warning: "Close to the limit.", status: "Status", all: "All", draft: "Draft", mode: "Mode", edit: "Edit", read: "Read", remove: "Remove", label: "Label" },
  ar: { sizes: "المقاسات", variants: "أنواع الأزرار وحالاتها", fields: "حالات الحقول", rows: "صفوف يجب أن تتحاذى", choose: "اختيار واحد", search: "ابحث في العلامات…", sort: "ترتيب", last: "آخر تعديل", name: "الاسم أ–ي", newBrand: "علامة جديدة", save: "حفظ", cancel: "إلغاء", email: "البريد الإلكتروني", password: "كلمة المرور", copy: "نسخ", generate: "توليد", role: "الدور", editor: "محرّر", client: "عميل", date: "يُغلق في", notes: "ملاحظات", value: "استوديو نادين", hint: "يظهر في الدليل.", error: "أدخل بريدًا إلكترونيًا صحيحًا.", success: "متاح.", warning: "قريب من الحد.", status: "الحالة", all: "الكل", draft: "مسودة", mode: "الوضع", edit: "تحرير", read: "قراءة", remove: "إزالة", label: "التسمية" },
} as const;

const VARIANTS: ButtonVariant[] = ["primary", "outline", "soft", "ghost", "link", "solid", "danger", "danger-soft", "success-soft"];
const STATES = ["default", "hover", "focus", "disabled", "loading"] as const;
const noop = () => {};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-space-5">
      <h3 className="text-caption font-medium uppercase text-text-muted">{title}</h3>
      {children}
    </section>
  );
}

/** A static field box in a given state, for the states a pointer would otherwise have to produce. */
function FieldSpecimen({ state, children }: { state: "hover" | "focus"; children: ReactNode }) {
  return (
    <div className="mk-field flex items-center" data-preview={state}>
      {children}
    </div>
  );
}

function Panel({ lang, theme }: { lang: Lang; theme: "light" | "dark" }) {
  const t = T[lang];
  const [text, setText] = useState("");
  const [sort, setSort] = useState("");
  const [mode, setMode] = useState<"edit" | "read">("edit");
  const roles = [{ value: "editor", label: t.editor }, { value: "client", label: t.client }];
  return (
    <div dir={lang === "ar" ? "rtl" : "ltr"} lang={lang} className={`mk-theme-${theme} flex flex-col gap-space-10 rounded-card bg-canvas p-space-8 text-text shadow-edge`}>
      <h2 className="text-h4 font-medium">
        {lang === "ar" ? "العربية" : "English"} · {theme === "dark" ? (lang === "ar" ? "داكن" : "Dark") : lang === "ar" ? "فاتح" : "Light"}
      </h2>

      <Section title={t.sizes}>
        {(["xs", "sm", "md", "lg"] as const).map((size) => (
          <div key={size} className="flex flex-wrap items-center gap-ctl-row">
            <span className="w-8 font-mono text-caption text-text-muted">{size}</span>
            {(size === "sm" || size === "md") && (
              <>
                <div className="w-48"><SearchField fullWidth size={size} label={t.search} placeholder={t.search} value={text} onChange={(e) => setText(e.target.value)} /></div>
                <div className="w-40"><SelectInput size={size} aria-label={t.role} options={roles} value="editor" onChange={noop} /></div>
                <FilterSelectField size={size} label={t.status} hideLabel value="all" options={[{ value: "all", label: t.all }, { value: "draft", label: t.draft }]} onChange={noop} />
              </>
            )}
            <Button size={size} variant="primary" icon={<Icon name="plus" size={size === "xs" || size === "sm" ? 16 : 18} />}>{t.newBrand}</Button>
            <Button size={size} variant="outline">{t.cancel}</Button>
            <IconButton size={size} variant="outline" icon="ellipsis-h" label={t.label} />
          </div>
        ))}
      </Section>

      <Section title={t.variants}>
        <div className="grid grid-cols-[auto_repeat(5,auto)] items-center justify-start gap-x-form-col gap-y-ctl-row">
          <span />
          {STATES.map((s) => <span key={s} className="font-mono text-caption text-text-muted">{s}</span>)}
          {VARIANTS.map((variant) => (
            <div key={variant} className="contents">
              <span className="font-mono text-caption text-text-muted">{variant}</span>
              {STATES.map((s) => (
                <Button
                  key={s}
                  variant={variant}
                  size="md"
                  disabled={s === "disabled"}
                  loading={s === "loading"}
                  data-state={s === "hover" || s === "focus" ? s : undefined}
                  style={s === "focus" ? { outline: "var(--focus-ring-width) solid var(--focus-ring-color)", outlineOffset: "var(--focus-ring-offset)" } : undefined}
                >
                  {t.save}
                </Button>
              ))}
            </div>
          ))}
        </div>
      </Section>

      <Section title={t.fields}>
        <div className="grid grid-cols-1 gap-x-form-col gap-y-field-stack sm:grid-cols-2 xl:grid-cols-3">
          <InputField label={`${t.email} · default`} placeholder="you@studio.com" hint={t.hint} value={text} onChange={(e) => setText(e.target.value)} />
          <div className="flex flex-col gap-field-label"><span className="px-space-5 text-caption text-text-muted">hover</span><FieldSpecimen state="hover">{t.value}</FieldSpecimen></div>
          <div className="flex flex-col gap-field-label"><span className="px-space-5 text-caption text-text-muted">focus</span><FieldSpecimen state="focus">{t.value}</FieldSpecimen></div>
          <InputField label={`${t.email} · error`} value="nadeen@" onChange={noop} error={t.error} />
          <InputField label={`${t.label} · success`} value="nadeen-studio" onChange={noop} success={t.success} />
          <InputField label={`${t.label} · warning`} value={t.value} onChange={noop} warning={t.warning} />
          <InputField label={`${t.label} · disabled`} value={t.value} onChange={noop} disabled />
          <InputField label={`${t.label} · read-only`} value={t.value} onChange={noop} readOnly />
          <SelectField label={t.role} options={roles} value="client" onChange={noop} />
          <DatePicker label={t.date} value="2026-12-31" onChange={noop} />
          <TextareaField label={t.notes} value="" onChange={noop} placeholder="…" rows={3} />
          <InputField size="sm" label={`${t.label} · sm`} value={t.value} onChange={noop} />
        </div>
      </Section>

      <Section title={t.rows}>
        <div className="flex flex-wrap items-center gap-ctl-row">
          <div className="w-56"><SearchField fullWidth label={t.search} placeholder={t.search} value={text} onChange={(e) => setText(e.target.value)} /></div>
          <SortControl label={t.sort} value={sort} defaultLabel={t.last} options={[{ value: "name", label: t.name }]} onChange={setSort} />
          <FilterSelectField label={t.status} hideLabel active value="draft" options={[{ value: "all", label: t.all }, { value: "draft", label: t.draft }]} onChange={noop} />
          <Button variant="primary" icon={<Icon name="plus" size={18} />}>{t.newBrand}</Button>
        </div>
        <div className="mk-field-row max-w-xl">
          <InputField label={t.password} value="nadeen2026" onChange={noop} hint={t.hint} />
          <Button variant="soft" icon={<Icon name="copy" size={18} />}>{t.copy}</Button>
          <Button variant="outline">{t.generate}</Button>
        </div>
        <div className="flex flex-wrap items-center gap-ctl-row">
          <Button variant="soft" size="sm" icon={<Icon name="key" size={16} />}>{t.role}</Button>
          <FilterSelectField size="sm" label={t.role} hideLabel value="editor" options={roles} onChange={noop} />
          <IconButton size="sm" icon="times" label={t.remove} />
          <div className="w-64"><InputField size="sm" aria-label={t.label} placeholder={t.label} value="" onChange={noop} /></div>
          <Button variant="soft" size="sm">{t.save}</Button>
        </div>
      </Section>

      <Section title={t.choose}>
        <div className="flex flex-wrap items-center gap-ctl-row">
          <SegmentedControl label={t.mode} options={[{ value: "edit", label: t.edit, icon: "pen" }, { value: "read", label: t.read, icon: "book" }]} value={mode} onChange={setMode} />
          <div className="w-56"><SegmentedControl fullWidth label={t.mode} options={[{ value: "edit", label: t.edit }, { value: "read", label: t.read }]} value={mode} onChange={setMode} /></div>
        </div>
      </Section>
    </div>
  );
}

export function ControlsGallery() {
  return (
    <main className="flex flex-col gap-space-8 p-space-8">
      <header className="flex flex-col gap-space-2">
        <h1 className="text-h2 font-medium">Form controls</h1>
        <p className="max-w-3xl text-body text-text-muted">
          Every control in every size, variant and state, in English and Arabic, light and dark (MARKYOS_UI §2.6). Controls of one size share a height,
          a corner and a focus treatment; hover and focus are drawn statically for comparison.
        </p>
      </header>
      <div className="grid grid-cols-1 gap-space-8 2xl:grid-cols-2">
        <Panel lang="en" theme="light" />
        <Panel lang="en" theme="dark" />
        <Panel lang="ar" theme="light" />
        <Panel lang="ar" theme="dark" />
      </div>
    </main>
  );
}
