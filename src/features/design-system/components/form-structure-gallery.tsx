"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useFormContext } from "react-hook-form";
import { z } from "zod";
import { AssetFilterExample } from "./asset-filter-example";
import { AuthExample } from "./auth-example";
import { NewCampaignWizard } from "./new-campaign-wizard";
import { OverlayFormExamples } from "./overlay-form-examples";
import { ProfileAutosaveExample } from "./profile-autosave-example";
import {
  ChipSelector,
  EmailField,
  ErrorState,
  Form,
  FormActions,
  FormField,
  FormGrid,
  FormSection,
  FormSkeleton,
  HexColorInput,
  InputField,
  LeaveGuard,
  LocalePicker,
  MarketPicker,
  SegmentedToggle,
  SettingsLayout,
  useConflictCheck,
  StickySaveBar,
  TextareaField,
  ThemeToggle,
  TimezonePicker,
  ToggleField,
  UiStringsProvider,
  type ServerErrors,
} from "@/components/ui";

type Lang = "en" | "ar";
const T = (lang: Lang) => (en: string, ar: string) => (lang === "ar" ? ar : en);
type Tr = ReturnType<typeof T>;

const STATES = ["pristine", "dirty", "validating", "invalid", "submitting", "success", "serverError", "fieldErrors", "conflict", "loading", "loadFailed", "readOnly", "locked"] as const;
type DemoState = (typeof STATES)[number];

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const workspaceSchema = (t: Tr) =>
  z.object({
    name: z.string().trim().min(2, t("Enter a workspace name of at least 2 characters.", "أدخل اسم مساحة عمل من حرفين على الأقل.")),
    slug: z.string().regex(/^[a-z0-9-]{3,}$/, t("Use 3 or more lowercase letters, numbers or hyphens.", "استخدم 3 أحرف لاتينية صغيرة أو أرقام أو شرطات على الأقل.")),
    email: z.email(t("Enter an email like nour@studio.sa.", "أدخل بريدًا مثل nour@studio.sa.")),
    locale: z.string().min(1, t("Choose a language.", "اختر لغة.")),
    timezone: z.string().min(1),
    brandColour: z.string().regex(/^#[0-9A-F]{6}$/i, t("Enter a hex code like #0B5D6D.", "أدخل رمزًا سداسيًا مثل ‎#0B5D6D.")),
    weeklyDigest: z.boolean(),
  });
type Workspace = z.input<ReturnType<typeof workspaceSchema>>;

const SAVED: Workspace = {
  name: "Nadeen Studio",
  slug: "nadeen",
  email: "nour@nadeen.sa",
  locale: "ar-SA",
  timezone: "Asia/Riyadh",
  brandColour: "#0B5D6D",
  weeklyDigest: true,
};

/** Puts the demo form into the chosen state once it's mounted. */
const Drive = ({ state, formId }: { state: DemoState; formId: string }) => {
  const { setValue } = useFormContext<Workspace>();
  useEffect(() => {
    const dirty = { shouldDirty: true };
    const submit = () => requestAnimationFrame(() => (document.getElementById(formId) as HTMLFormElement | null)?.requestSubmit());
    if (state === "dirty") setValue("name", "Nadeen Studio KSA", dirty);
    if (state === "invalid") {
      setValue("name", "", dirty);
      setValue("email", "nour@", dirty);
      submit();
    }
    if (["submitting", "success", "serverError", "fieldErrors", "conflict"].includes(state)) {
      setValue("name", "Nadeen Studio KSA", dirty);
      submit();
    }
  }, [state, formId, setValue]);
  return null;
};

const Section = ({ id, title, children }: { id: string; title: string; children: ReactNode }) => (
  <section id={id} aria-labelledby={`${id}-title`} className="flex flex-col gap-space-6 rounded-card bg-surface-1 p-space-6 shadow-edge sm:p-space-8">
    <h2 id={`${id}-title`} className="text-h4 font-medium">
      {title}
    </h2>
    {children}
  </section>
);

/** "Workspace settings": SettingsLayout, a sticky save bar and the leave guard. */
const WorkspaceSettings = ({ state, t }: { state: DemoState; t: Tr }) => {
  const formId = "workspace-settings";
  // The demo remounts per state, so `state` is fixed for this form's life.
  // Conflict: the server is a version ahead (Lina saved meanwhile) until Reload.
  const [version, setVersion] = useState("v1");
  const [server, setServer] = useState<Workspace | undefined>(undefined);
  const conflict = useConflictCheck({
    formId,
    version,
    fetchLatest: async () => {
      await wait(300);
      return state === "conflict" && version === "v1" ? { version: "v2", updatedBy: "Lina Mansour", updatedAt: Date.now() - 5 * 60_000 } : { version, updatedBy: "Nour Haddad", updatedAt: Date.now() };
    },
    onReload: (latest) => {
      setServer({ ...SAVED, name: "Nadeen Studio Riyadh" });
      setVersion(String(latest.version));
    },
  });

  const onSubmit = async (): Promise<ServerErrors<Workspace> | void> => {
    if (state === "submitting") return new Promise(() => undefined);
    await wait(900);
    if (state === "serverError") throw new Error("offline");
    if (state === "fieldErrors") return { fields: { slug: t("markyos.com/nadeen is taken. Try another.", "markyos.com/nadeen مستخدم. جرّب عنوانًا آخر.") } };
  };

  return (
    <Form
      id={formId}
      label={t("Workspace settings", "إعدادات مساحة العمل")}
      schema={workspaceSchema(t)}
      defaultValues={SAVED}
      values={server}
      onSubmit={conflict.guard(onSubmit)}
      readOnly={state === "readOnly"}
      locked={state === "locked"}
      lockedReason={t("Only owners can change these settings. Ask Nour Haddad.", "يغيّر هذه الإعدادات المالكون فقط. اطلب ذلك من نور حداد.")}
    >
      <Drive state={state} formId={formId} />
      {conflict.alert}
      <LeaveGuard />
      <SettingsLayout>
        <SettingsLayout.Section title={t("Workspace", "مساحة العمل")} description={t("How your studio appears to clients and in shared links.", "كيف يظهر الاستوديو لعملائك وفي الروابط المشتركة.")}>
          <FormField<Workspace, "name">
            name="name"
            label={t("Workspace name", "اسم مساحة العمل")}
            render={({ field, id, error }) => <InputField label={t("Workspace name", "اسم مساحة العمل")} id={id} required maxLength={60} {...field} error={error} />}
          />
          <FormField<Workspace, "slug">
            name="slug"
            label={t("Workspace address", "عنوان مساحة العمل")}
            render={({ field, id, error }) => (
              <InputField
                label={t("Workspace address", "عنوان مساحة العمل")}
                id={id}
                prefix="markyos.com/"
                dir="ltr"
                boxDir="ltr"
                {...field}
                validating={state === "validating"}
                hint={state === "validating" ? t("Checking it's free…", "نتحقّق من أنه متاح…") : undefined}
                error={error}
              />
            )}
          />
          <FormField<Workspace, "email">
            name="email"
            label={t("Contact email", "بريد التواصل")}
            render={({ field, id, error }) => <EmailField label={t("Contact email", "بريد التواصل")} id={id} required {...field} error={error} />}
          />
        </SettingsLayout.Section>
        <SettingsLayout.Section title={t("Region", "المنطقة")} description={t("Dates, numbers and reminders follow these.", "تتبعها التواريخ والأرقام والتذكيرات.")}>
          <FormField<Workspace, "locale">
            name="locale"
            label={t("Language and region", "اللغة والمنطقة")}
            render={({ field, id, error }) => <LocalePicker id={id} value={field.value} onChange={field.onChange} onBlur={field.onBlur} error={error} />}
          />
          <FormField<Workspace, "timezone">
            name="timezone"
            render={({ field, id }) => <TimezonePicker id={id} value={field.value} onChange={field.onChange} />}
          />
        </SettingsLayout.Section>
        <SettingsLayout.Section title={t("Brand", "الهوية")} description={t("Used on guideline pages and client emails.", "تُستخدم في صفحات الأدلة ورسائل العملاء.")}>
          <FormField<Workspace, "brandColour">
            name="brandColour"
            label={t("Brand colour", "لون الهوية")}
            render={({ field, id, error }) => <HexColorInput label={t("Brand colour", "لون الهوية")} id={id} {...field} error={error} />}
          />
          <FormField<Workspace, "weeklyDigest">
            name="weeklyDigest"
            render={({ field }) => (
              <ToggleField
                label={t("Weekly digest", "الملخص الأسبوعي")}
                description={t("Every Sunday at 9:00, what changed across your brands.", "كل أحد الساعة 9:00، ما تغيّر في علاماتك.")}
                checked={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </SettingsLayout.Section>
      </SettingsLayout>
      <StickySaveBar />
    </Form>
  );
};

const brandSchema = (t: Tr) =>
  z.object({
    brand: z.string().trim().min(1, t("Enter the brand's name.", "أدخل اسم العلامة.")),
    market: z.string().min(1, t("Choose a launch market.", "اختر سوق الإطلاق.")),
    about: z.string().max(280, t("Keep it to 280 characters.", "اجعله 280 حرفًا كحد أقصى.")),
  });
type Brand = z.input<ReturnType<typeof brandSchema>>;

/** "Brand details": a card section, a two-column grid and the actions row. */
const BrandDetails = ({ t }: { t: Tr }) => (
  <Form label={t("New brand", "علامة جديدة")} schema={brandSchema(t)} defaultValues={{ brand: "", market: "", about: "" }} onSubmit={() => wait(800)} successMessage={t("Brand created.", "أُنشئت العلامة.")}>
    <FormSection variant="card" icon="palette" title={t("Brand details", "تفاصيل العلامة")} description={t("You can change these later in Settings.", "يمكنك تغييرها لاحقًا من الإعدادات.")}>
      <FormGrid columns={2}>
        <FormField<Brand, "brand">
          name="brand"
          label={t("Brand name", "اسم العلامة")}
          render={({ field, id, error }) => <InputField label={t("Brand name", "اسم العلامة")} id={id} required placeholder={t("Al Nakheel Dates", "تمور النخيل")} {...field} error={error} />}
        />
        <FormField<Brand, "market">
          name="market"
          label={t("Launch market", "سوق الإطلاق")}
          render={({ field, id, error }) => <MarketPicker id={id} label={t("Launch market", "سوق الإطلاق")} required value={field.value} onChange={field.onChange} error={error} />}
        />
        <FormGrid.Item span="full">
          <FormField<Brand, "about">
            name="about"
            label={t("About", "نبذة")}
            render={({ field, id, error }) => <TextareaField label={t("About", "نبذة")} id={id} rows={3} maxLength={280} showCount optional {...field} error={error} />}
          />
        </FormGrid.Item>
      </FormGrid>
    </FormSection>
    <FormActions submitLabel={t("Create brand", "إنشاء العلامة")} cancelLabel={t("Clear", "مسح")} />
  </Form>
);

/**
 * The form structure family: real Markyos forms in either language and
 * theme, with a switcher that puts the settings form into each form-level
 * state. A dev page at /design-system/form-structure.
 */
const FormStructureGallery = () => {
  const [lang, setLang] = useState<Lang>("en");
  const [state, setState] = useState<DemoState>("pristine");
  const t = T(lang);
  const isAr = lang === "ar";
  const names: Record<DemoState, string> = {
    pristine: t("Pristine", "دون تغيير"),
    dirty: t("Dirty", "معدّل"),
    validating: t("Validating", "قيد التحقق"),
    invalid: t("Invalid", "غير صالح"),
    submitting: t("Submitting", "قيد الإرسال"),
    success: t("Success", "نجاح"),
    serverError: t("Server error", "خطأ الخادم"),
    fieldErrors: t("Field server errors", "أخطاء حقول من الخادم"),
    conflict: t("Conflict", "تعارض"),
    loading: t("Loading", "تحميل"),
    loadFailed: t("Load failed", "فشل التحميل"),
    readOnly: t("Read-only", "للقراءة فقط"),
    locked: t("Locked", "مقفل"),
  };

  return (
    <UiStringsProvider lang={lang}>
      <main lang={lang} dir={isAr ? "rtl" : "ltr"} className="min-h-screen min-w-0 bg-canvas pb-space-11 text-text">
        <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-space-5 bg-canvas px-space-6 py-space-5 shadow-rule-b sm:px-space-10">
          <h1 className="text-h4 font-medium">{t("Form structure", "بنية النماذج")}</h1>
          <div className="flex flex-wrap items-center gap-space-5">
            <SegmentedToggle label={t("Language", "اللغة")} off={{ label: "English" }} on={{ label: "العربية" }} value={isAr} onChange={(ar) => setLang(ar ? "ar" : "en")} />
            <ThemeToggle isAr={isAr} />
          </div>
        </header>
        <div className="mx-auto flex max-w-5xl flex-col gap-space-10 px-space-5 py-space-10 sm:px-space-10">
          <Section id="settings" title={t("Workspace settings", "إعدادات مساحة العمل")}>
            <div className="relative overflow-x-auto pb-space-2">
              <ChipSelector label={t("Form state", "حالة النموذج")} options={STATES.map((s) => ({ value: s, label: names[s] }))} value={state} onChange={setState} />
            </div>
            {state === "loading" ? (
              <FormSkeleton sections={3} fields={2} columns={1} actions={false} label={t("Loading settings", "تحميل الإعدادات")} />
            ) : state === "loadFailed" ? (
              <ErrorState title={t("Settings didn't load", "لم تُحمَّل الإعدادات")} message={t("Check your connection, then retry.", "تحقّق من اتصالك ثم أعد المحاولة.")} onRetry={() => setState("pristine")} />
            ) : (
              <WorkspaceSettings key={`${state}-${lang}`} state={state} t={t} />
            )}
          </Section>
          <Section id="campaign" title={t("New campaign wizard", "معالج الحملة الجديدة")}>
            <NewCampaignWizard key={lang} t={t} isAr={isAr} storageKey="markyos:new-campaign:draft" />
          </Section>
          <Section id="autosave" title={t("Profile with autosave", "ملف شخصي بحفظ تلقائي")}>
            <ProfileAutosaveExample key={lang} t={t} />
          </Section>
          <Section id="filters" title={t("Asset filters in the URL", "تصفية الملفات في الرابط")}>
            <AssetFilterExample key={lang} t={t} />
          </Section>
          <Section id="auth" title={t("Sign in and code check", "تسجيل الدخول والتحقق بالرمز")}>
            <AuthExample key={lang} t={t} isAr={isAr} />
          </Section>
          <Section id="overlays" title={t("Dialog, drawer and inline edit", "نافذة ودرج وتعديل مباشر")}>
            <OverlayFormExamples key={lang} t={t} />
          </Section>
          <Section id="brand" title={t("Section, grid and actions", "قسم وشبكة وأزرار")}>
            <BrandDetails key={lang} t={t} />
          </Section>
        </div>
      </main>
    </UiStringsProvider>
  );
};

export { FormStructureGallery };
