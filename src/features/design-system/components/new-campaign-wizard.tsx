"use client";

import { useWatch } from "react-hook-form";
import { z } from "zod";
import {
  BilingualField,
  CollapsibleSection,
  ConditionalField,
  CurrencyField,
  DateRangePicker,
  EmailField,
  FieldArray,
  FileDropzone,
  Form,
  FormField,
  FormGrid,
  FormWizard,
  InputField,
  MarketPicker,
  ReviewStep,
  TagInput,
  TextareaField,
  ToggleField,
  UploadList,
  useFormMeta,
} from "@/components/ui";

type Tr = (en: string, ar: string) => string;

const schema = (t: Tr) =>
  z
    .object({
      title: z.object({
        en: z.string().trim().min(1, t("Enter the English name.", "أدخل الاسم بالإنجليزية.")),
        ar: z.string().trim().min(1, t("Enter the Arabic name.", "أدخل الاسم بالعربية.")),
      }),
      markets: z.array(z.string()).min(1, t("Choose at least one market.", "اختر سوقًا واحدًا على الأقل.")),
      dates: z.object({ from: z.string().optional(), to: z.string().optional() }).refine((d) => d.from && d.to, t("Choose the start and end dates.", "اختر تاريخي البداية والنهاية.")),
      budget: z.number({ error: t("Enter a budget.", "أدخل الميزانية.") }).min(1000, t("The minimum is SAR 1,000.", "الحد الأدنى 1,000 ر.س.")),
      paidMedia: z.boolean(),
      mediaBudget: z.number().nullable().optional(),
      reviewers: z
        .array(z.object({ name: z.string().trim().min(1, t("Enter the reviewer's name.", "أدخل اسم المراجع.")), email: z.email(t("Enter an email like nour@studio.sa.", "أدخل بريدًا مثل nour@studio.sa.")) }))
        .min(1, t("Add at least one reviewer.", "أضف مراجعًا واحدًا على الأقل.")),
      files: z.array(z.object({ id: z.string(), name: z.string(), size: z.number() })),
      tags: z.array(z.string()),
      brief: z.string().max(500, t("Keep the brief to 500 characters.", "اجعل الموجز 500 حرف كحد أقصى.")),
      utm: z.string().optional(),
    })
    .superRefine((v, ctx) => {
      if (v.paidMedia && !(v.mediaBudget && v.mediaBudget > 0)) ctx.addIssue({ code: "custom", path: ["mediaBudget"], message: t("Enter the media budget.", "أدخل ميزانية الإعلانات.") });
    });
type Campaign = z.input<ReturnType<typeof schema>>;

const EMPTY: Campaign = {
  title: { en: "", ar: "" },
  markets: [],
  dates: {},
  budget: null as unknown as number,
  paidMedia: false,
  mediaBudget: null,
  reviewers: [{ name: "Nour Haddad", email: "nour@studio.sa" }],
  files: [],
  tags: ["Ramadan"],
  brief: "",
  utm: "",
};

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const sar = (n: number | null | undefined, ar: boolean) => (n == null ? "" : `${ar ? "" : "SAR "}${n.toLocaleString("en-US")}${ar ? " ر.س" : ""}`);

/** The bilingual name: one field, two languages, an error for each (named in the summary). */
const TitleField = ({ t }: { t: Tr }) => {
  const meta = useFormMeta();
  meta.labels.set("title.en", t("Campaign name (English)", "اسم الحملة (إنجليزي)"));
  meta.labels.set("title.ar", t("Campaign name (Arabic)", "اسم الحملة (عربي)"));
  return (
    <FormField<Campaign, "title">
      name="title"
      render={({ field, errors }) => (
        <BilingualField label={t("Campaign name", "اسم الحملة")} value={field.value} onChange={field.onChange} onBlur={field.onBlur} required errors={{ en: errors?.en?.message, ar: errors?.ar?.message }} />
      )}
    />
  );
};

/** Step 4: everything from the steps before, each with Edit. */
const Review = ({ t, isAr }: { t: Tr; isAr: boolean }) => {
  const v = useWatch<Campaign>() as Campaign;
  return (
    <ReviewStep
      description={t("Check everything before you create the campaign.", "راجع كل شيء قبل إنشاء الحملة.")}
      sections={[
        {
          step: "details",
          items: [
            { label: t("Name", "الاسم"), value: [v.title?.en, v.title?.ar].filter(Boolean).join(" · ") },
            { label: t("Markets", "الأسواق"), value: v.markets?.join(", ") },
            { label: t("Dates", "التواريخ"), value: v.dates?.from && v.dates?.to ? `${v.dates.from} – ${v.dates.to}` : "" },
          ],
        },
        {
          step: "budget",
          items: [
            { label: t("Budget", "الميزانية"), value: sar(v.budget, isAr) },
            { label: t("Media budget", "ميزانية الإعلانات"), value: v.paidMedia ? sar(v.mediaBudget, isAr) : t("No paid media", "بلا إعلانات مدفوعة") },
            { label: t("Reviewers", "المراجعون"), value: v.reviewers?.map((r) => r.name).join(", ") },
          ],
        },
        {
          step: "brief",
          items: [
            { label: t("Files", "الملفات"), value: v.files?.map((f) => f.name).join(", ") },
            { label: t("Tags", "الوسوم"), value: v.tags?.join(", ") },
            { label: t("Brief", "الموجز"), value: v.brief },
          ],
        },
      ]}
    />
  );
};

/**
 * "New campaign": a FormWizard of Details → Budget and team → Brief →
 * Review, with a field array, a conditional field, an advanced section and
 * per-step checks, kept in this browser until it's created.
 */
const NewCampaignWizard = ({ t, isAr, storageKey }: { t: Tr; isAr: boolean; storageKey?: string }) => (
  <Form
    label={t("New campaign", "حملة جديدة")}
    schema={schema(t)}
    defaultValues={EMPTY}
    onSubmit={() => wait(900)}
    successMessage={t("Campaign created. Reviewers have been invited.", "أُنشئت الحملة ودُعي المراجعون.")}
  >
    <FormWizard
      storageKey={storageKey}
      submitLabel={t("Create campaign", "إنشاء الحملة")}
      label={t("New campaign steps", "خطوات الحملة الجديدة")}
      steps={[
        {
          id: "details",
          title: t("Details", "التفاصيل"),
          fields: ["title", "markets", "dates"],
          content: (
            <>
              <TitleField t={t} />
              <FormGrid columns={2}>
                <FormField<Campaign, "markets">
                  name="markets"
                  label={t("Markets", "الأسواق")}
                  render={({ field, id, error }) => <MarketPicker multiple id={id} label={t("Markets", "الأسواق")} required value={field.value} onChange={field.onChange} max={4} error={error} />}
                />
                <FormField<Campaign, "dates">
                  name="dates"
                  label={t("Flight dates", "تواريخ العرض")}
                  render={({ field, error }) => <DateRangePicker label={t("Flight dates", "تواريخ العرض")} value={field.value} onChange={field.onChange} min="2026-11-14" error={error} />}
                />
              </FormGrid>
            </>
          ),
        },
        {
          id: "budget",
          title: t("Budget and team", "الميزانية والفريق"),
          fields: ["budget", "paidMedia", "mediaBudget", "reviewers"],
          content: (
            <>
              <FormGrid columns={2}>
                <FormField<Campaign, "budget">
                  name="budget"
                  label={t("Budget", "الميزانية")}
                  render={({ field, id, error }) => <CurrencyField label={t("Budget", "الميزانية")} id={id} ref={field.ref} required currency="SAR" value={field.value ?? null} onChange={field.onChange} onBlur={field.onBlur} error={error} />}
                />
                <FormField<Campaign, "paidMedia">
                  name="paidMedia"
                  render={({ field }) => <ToggleField label={t("Paid media", "إعلانات مدفوعة")} description={t("Boosted posts and ads", "منشورات مُروّجة وإعلانات")} checked={field.value} onChange={field.onChange} />}
                />
              </FormGrid>
              <ConditionalField<Campaign> when={(v) => v.paidMedia === true} fields={["mediaBudget"]}>
                <FormField<Campaign, "mediaBudget">
                  name="mediaBudget"
                  label={t("Media budget", "ميزانية الإعلانات")}
                  render={({ field, id, error }) => (
                    <CurrencyField label={t("Media budget", "ميزانية الإعلانات")} id={id} ref={field.ref} required currency="SAR" value={field.value ?? null} onChange={field.onChange} onBlur={field.onBlur} error={error} hint={t("Part of the budget above.", "جزء من الميزانية أعلاه.")} />
                  )}
                />
              </ConditionalField>
              <FieldArray<Campaign, "reviewers">
                name="reviewers"
                legend={t("Reviewers", "المراجعون")}
                description={t("They approve each post before it's scheduled.", "يوافقون على كل منشور قبل جدولته.")}
                rowLabel={(n) => t(`Reviewer ${n}`, `المراجع ${n}`)}
                newRow={() => ({ name: "", email: "" })}
                max={5}
                addLabel={t("Add reviewer", "إضافة مراجع")}
                empty={{ title: t("No reviewers yet.", "لا مراجعين بعد."), description: t("Add someone to approve posts before they go out.", "أضف من يوافق على المنشورات قبل نشرها.") }}
                renderRow={({ index, label }) => (
                  <FormGrid columns={2}>
                    <FormField
                      name={`reviewers.${index}.name`}
                      label={`${label}: ${t("name", "الاسم")}`}
                      render={({ field, id, error }) => <InputField label={t("Name", "الاسم")} id={id} required {...field} value={field.value ?? ""} error={error} />}
                    />
                    <FormField
                      name={`reviewers.${index}.email`}
                      label={`${label}: ${t("email", "البريد")}`}
                      render={({ field, id, error }) => <EmailField label={t("Email", "البريد")} id={id} required {...field} value={field.value ?? ""} error={error} />}
                    />
                  </FormGrid>
                )}
              />
            </>
          ),
        },
        {
          id: "brief",
          title: t("Brief", "الموجز"),
          optional: true,
          fields: ["files", "tags", "brief", "utm"],
          content: (
            <>
              <FormField<Campaign, "files">
                name="files"
                render={({ field }) => (
                  <div className="flex flex-col gap-space-4">
                    <FileDropzone
                      label={t("Brief files", "ملفات الموجز")}
                      accept=".pdf,image/*"
                      acceptLabel={t("PDF or image", "PDF أو صورة")}
                      maxBytes={20 * 1024 * 1024}
                      onFiles={(files) => field.onChange([...field.value, ...files.map((f) => ({ id: `${f.name}-${f.size}`, name: f.name, size: f.size }))])}
                    />
                    <UploadList
                      label={t("Brief files", "ملفات الموجز")}
                      items={field.value.map((f) => ({ ...f, status: "done" as const }))}
                      onRemove={(id) => field.onChange(field.value.filter((f) => f.id !== id))}
                    />
                  </div>
                )}
              />
              <FormField<Campaign, "tags">
                name="tags"
                label={t("Tags", "الوسوم")}
                render={({ field, error }) => <TagInput label={t("Tags", "الوسوم")} value={field.value} onChange={field.onChange} onBlur={field.onBlur} max={8} error={error} />}
              />
              <FormField<Campaign, "brief">
                name="brief"
                label={t("Brief", "الموجز")}
                render={({ field, id, error }) => <TextareaField label={t("Brief", "الموجز")} id={id} rows={3} maxLength={500} showCount optional {...field} error={error} />}
              />
              <CollapsibleSection title={t("Advanced options", "الخيارات المتقدمة")} storageKey="markyos:new-campaign:advanced" fields={["utm"]}>
                <FormField<Campaign, "utm">
                  name="utm"
                  label={t("Campaign tag for links", "وسم الحملة للروابط")}
                  render={({ field, id, error }) => (
                    <InputField label={t("Campaign tag for links", "وسم الحملة للروابط")} id={id} optional dir="ltr" placeholder="ramadan-2027" {...field} value={field.value ?? ""} error={error} />
                  )}
                />
              </CollapsibleSection>
            </>
          ),
        },
        { id: "review", title: t("Review", "المراجعة"), content: <Review t={t} isAr={isAr} /> },
      ]}
    />
  </Form>
);

export { NewCampaignWizard };
