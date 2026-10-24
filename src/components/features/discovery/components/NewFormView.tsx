"use client";

import { useState } from "react";
import { AlertBanner, Button, Icon, PageHeader, Skeleton } from "@/components/ui";
import { InputField, RadioCardGroup, RadioField, SegmentedToggle, SelectField } from "@/components/form";
import type { Lang } from "@/types";
import { useTemplates } from "../hooks/useTemplates";
import { createForm } from "../services/discoveryService";
import { textIn } from "../model/questionTypes";
import type { DiscoveryForm } from "../types";

type Brand = { id: string; name: string };

type NewFormViewProps = {
  /** Brands this account can add a form to. */
  brands: Brand[];
  defaultBrandId?: string;
  isAr: boolean;
  onCreated: (form: DiscoveryForm) => void;
  onCancel: () => void;
};

type LanguageChoice = "both" | "en" | "ar";

const BLANK = "blank";

/** Name the form, pick the brand, its languages and a starting template. */
export function NewFormView({ brands, defaultBrandId, isAr, onCreated, onCancel }: NewFormViewProps) {
  const templates = useTemplates();
  const [name, setName] = useState("");
  const [brandId, setBrandId] = useState(defaultBrandId ?? brands[0]?.id ?? "");
  const [languages, setLanguages] = useState<LanguageChoice>("both");
  const [first, setFirst] = useState<Lang>(isAr ? "ar" : "en");
  const [template, setTemplate] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ name?: string; template?: string; form?: string }>({});
  const [busy, setBusy] = useState(false);
  const lang = isAr ? "ar" : "en";

  const chosen = templates.data?.find((t) => t.key === template);

  async function create() {
    const field: typeof errors = {};
    if (!name.trim()) field.name = isAr ? "سمِّ النموذج." : "Name the form.";
    if (!template) field.template = isAr ? "اختر قالبًا أو ابدأ من الصفر." : "Pick a template, or start blank.";
    setErrors(field);
    if (Object.keys(field).length) return;
    setBusy(true);
    try {
      const picked: Lang[] = languages === "both" ? ["ar", "en"] : [languages];
      const form = await createForm({
        brandId,
        name: name.trim(),
        templateKey: template === BLANK ? "" : template!,
        languages: picked,
        primaryLanguage: languages === "both" ? first : languages,
      });
      onCreated(form);
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : "That didn't save." });
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={isAr ? "نموذج جديد" : "New form"}
        description={isAr ? "اختر من أين تبدأ؛ يمكنك تعديل كل سؤال لاحقًا." : "Choose a starting point; every question can be edited after."}
      />

      <AlertBanner message={errors.form} />

      <section className="mk-surface flex flex-col gap-space-8 rounded-card bg-surface-1 p-space-10">
        <div className="grid grid-cols-1 gap-space-8 md:grid-cols-2">
          <InputField
            label={isAr ? "اسم النموذج" : "Form name"}
            placeholder={isAr ? "استكشاف هوية مقهى الرياض" : "Riyadh café discovery"}
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
            dir="auto"
            autoFocus
          />
          <SelectField
            label={isAr ? "العلامة" : "Brand"}
            value={brandId}
            onChange={(e) => setBrandId(e.target.value)}
            options={brands.map((b) => ({ value: b.id, label: b.name }))}
          />
        </div>
        <div className="grid grid-cols-1 gap-space-8 md:grid-cols-2">
          <RadioField
            label={isAr ? "لغات النموذج" : "Form languages"}
            value={languages}
            onChange={(v) => setLanguages(v as LanguageChoice)}
            options={[
              { value: "both", label: isAr ? "العربية والإنجليزية" : "Arabic and English" },
              { value: "ar", label: isAr ? "العربية فقط" : "Arabic only" },
              { value: "en", label: isAr ? "الإنجليزية فقط" : "English only" },
            ]}
          />
          {languages === "both" && (
            <div className="flex flex-col gap-space-3">
              <span className="text-caption text-text-muted">{isAr ? "اللغة التي يراها العميل أولًا" : "The client sees first"}</span>
              <SegmentedToggle
                label={isAr ? "اللغة الأولى" : "First language"}
                off={{ label: "العربية" }}
                on={{ label: "English" }}
                value={first === "en"}
                onChange={(en) => setFirst(en ? "en" : "ar")}
              />
            </div>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-space-6">
        <h2 className="text-h5 font-medium">{isAr ? "ابدأ من" : "Start from"}</h2>
        {templates.loading && !templates.data ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-28 rounded-card" />
            ))}
          </div>
        ) : (
          <RadioCardGroup
            label={isAr ? "القالب" : "Template"}
            columns={3}
            value={template}
            onChange={(key) => {
              setTemplate(key);
              setErrors((e) => ({ ...e, template: undefined }));
            }}
            error={errors.template}
            options={[
              ...(templates.data ?? []).map((t) => ({
                value: t.key,
                label: textIn(t.name, lang),
                hint: `${textIn(t.description, lang)} ${isAr ? `${t.questionCount} سؤالًا · ${t.estimatedMinutes} دقيقة` : `${t.questionCount} questions · ${t.estimatedMinutes} min`}`,
                icon: "clipboard-list",
              })),
              {
                value: BLANK,
                label: isAr ? "من الصفر" : "Start blank",
                hint: isAr ? "نموذج فارغ تضيف إليه أسئلة من المكتبة." : "An empty form you fill from the question library.",
                icon: "plus",
              },
            ]}
          />
        )}
      </section>

      {chosen && (
        // The template, section by section, with one question shown in both
        // languages: what the client will actually be asked.
        <section className="mk-surface flex flex-col rounded-card bg-surface-1">
          <div className="flex items-center justify-between gap-space-5 px-space-10 py-space-6 shadow-rule-b">
            <h3 className="text-h5 font-medium">{textIn(chosen.name, lang)}</h3>
            <span className="text-caption text-text-muted">
              {isAr ? `${chosen.sections.length} أقسام` : `${chosen.sections.length} sections`}
            </span>
          </div>
          {chosen.sectionPreviews.map((section, i) => (
            <div key={i} className="grid grid-cols-1 gap-space-5 px-space-10 py-space-6 shadow-rule-t first:shadow-none md:grid-cols-[200px_1fr_1fr]">
              <div>
                <div className="text-body font-medium">{textIn(section.title, lang)}</div>
                <div className="text-caption text-text-muted">{isAr ? `${section.count} أسئلة` : `${section.count} questions`}</div>
              </div>
              {section.sample && (
                <>
                  <p dir="ltr" lang="en" className="text-body text-text-secondary">
                    {section.sample.title.en}
                  </p>
                  <p dir="rtl" lang="ar" className="text-body leading-[1.7] text-text-secondary">
                    {section.sample.title.ar}
                  </p>
                </>
              )}
            </div>
          ))}
        </section>
      )}

      <div className="flex flex-wrap justify-end gap-space-4">
        <Button variant="outline" onClick={onCancel}>
          {isAr ? "إلغاء" : "Cancel"}
        </Button>
        <Button variant="primary" onClick={() => void create()} disabled={busy} icon={<Icon name="arrow-right" size={18} className="rtl:-scale-x-100" />}>
          {busy ? (isAr ? "جارٍ الإنشاء…" : "Creating…") : isAr ? "إنشاء النموذج" : "Create form"}
        </Button>
      </div>
    </div>
  );
}
