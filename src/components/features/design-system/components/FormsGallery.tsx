"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import {
  BilingualField,
  CurrencyField,
  EmailField,
  FieldGroup,
  Fieldset,
  HexColorField,
  InputField,
  NumberField,
  OtpField,
  PasswordField,
  PercentageField,
  PhoneInput,
  RichTextField,
  SearchField,
  SegmentedToggle,
  SlugField,
  TextareaField,
  UrlField,
  type FieldState,
} from "@/components/form";
import { IconButton, UiStringsProvider } from "@/components/ui";
import { ThemeToggle } from "@/contexts/ThemeProvider";

type Lang = "en" | "ar";
const T = (lang: Lang) => (en: string, ar: string) => (lang === "ar" ? ar : en);

/** Pretend availability: "riyadh" and "dubai" are taken. */
const checkSlug = (slug: string) => new Promise<boolean>((resolve) => setTimeout(() => resolve(!["riyadh", "dubai"].includes(slug)), 700));

const STATES = ["default", "filled", "error", "success", "warning", "validating", "disabled", "readOnly", "locked", "loading"] as const;
type MatrixState = (typeof STATES)[number];

/** Each state as the props every field takes. */
function stateProps(state: MatrixState, t: ReturnType<typeof T>): FieldState & { disabled?: boolean; readOnly?: boolean } {
  switch (state) {
    case "error":
      return { error: t("Enter a campaign name.", "أدخل اسم الحملة.") };
    case "success":
      return { success: t("Available.", "متاح.") };
    case "warning":
      return { warning: t("Needs Arabic.", "تحتاج إلى نسخة عربية.") };
    case "validating":
      return { validating: true };
    case "disabled":
      return { disabled: true };
    case "readOnly":
      return { readOnly: true };
    case "locked":
      return { locked: true, lockedReason: t("Only owners can change this.", "يغيّر هذا المالكون فقط.") };
    case "loading":
      return { loading: true };
    default:
      return {};
  }
}

const Section = ({ id, title, children }: { id: string; title: string; children: ReactNode }) => (
  <section id={id} aria-labelledby={`${id}-title`} className="flex flex-col gap-space-6 rounded-card bg-surface-1 p-space-8 shadow-edge">
    <h2 id={`${id}-title`} className="text-h4 font-medium">
      {title}
    </h2>
    {children}
  </section>
);

/**
 * The form field family, wave 2 phase 1: the Field wrapper and the text
 * inputs, in either language and theme, with the state matrix. A dev page
 * (NEXT_PUBLIC_UI_GALLERY=1) at /design-system/forms.
 */
export function FormsGallery() {
  const [lang, setLang] = useState<Lang>("en");
  const isAr = lang === "ar";
  const t = T(lang);

  const [name, setName] = useState("Ramadan launch");
  const [brief, setBrief] = useState("");
  const [email, setEmail] = useState("nour@studio.sa");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("+966501234567");
  const [seats, setSeats] = useState<number | null>(12);
  const [budget, setBudget] = useState<number | null>(84500);
  const [share, setShare] = useState<number | null>(35);
  const [site, setSite] = useState("https://markyos.com");
  const [search, setSearch] = useState("");
  const [otp, setOtp] = useState("");
  const [slug, setSlug] = useState("");
  const [colour, setColour] = useState("#0099FF");
  const [title, setTitle] = useState({ en: "Ramadan launch", ar: "" });
  const [tagline, setTagline] = useState({ en: "Built in Riyadh, for the region.", ar: "صُنع في الرياض، للمنطقة." });
  const [story, setStory] = useState("<p>Launching across <strong>Riyadh</strong>, Dubai and Cairo.</p><p dir=\"rtl\">إطلاق في الرياض ودبي والقاهرة.</p>");
  const [biLayout, setBiLayout] = useState(false);

  const matrix: { name: string; render: (s: MatrixState) => ReactNode }[] = [
    { name: "InputField", render: (s) => <InputField label={t("Campaign name", "اسم الحملة")} placeholder={t("Start typing…", "ابدأ الكتابة…")} defaultValue={s === "default" ? "" : t("Ramadan launch", "إطلاق رمضان")} {...stateProps(s, t)} /> },
    { name: "TextareaField", render: (s) => <TextareaField label={t("Brief", "الموجز")} rows={2} placeholder={t("Start typing…", "ابدأ الكتابة…")} defaultValue={s === "default" ? "" : t("Three cities, one launch.", "ثلاث مدن، إطلاق واحد.")} {...stateProps(s, t)} /> },
    { name: "EmailField", render: (s) => <EmailField label={t("Email", "البريد")} placeholder="nour@studio.sa" defaultValue={s === "default" ? "" : "omar@studio.ae"} {...stateProps(s, t)} /> },
    { name: "PasswordField", render: (s) => <PasswordField label={t("Password", "كلمة المرور")} defaultValue={s === "default" ? "" : "riyadh-dubai-cairo"} {...stateProps(s, t)} /> },
    { name: "PhoneInput", render: (s) => <PhoneInput label={t("Phone", "الهاتف")} value={s === "default" ? "" : "+971501234567"} onChange={() => undefined} {...stateProps(s, t)} /> },
    { name: "CurrencyField", render: (s) => <CurrencyField label={t("Budget", "الميزانية")} value={s === "default" ? null : 84500} onChange={() => undefined} {...stateProps(s, t)} /> },
    { name: "UrlField", render: (s) => <UrlField label={t("Website", "الموقع")} value={s === "default" ? "" : "https://studio.sa"} onChange={() => undefined} {...stateProps(s, t)} /> },
  ];

  return (
    <UiStringsProvider lang={lang}>
      <main lang={lang} dir={isAr ? "rtl" : "ltr"} className="min-h-screen min-w-0 bg-canvas text-text">
        <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-space-5 bg-canvas px-space-6 py-space-5 shadow-rule-b sm:px-space-10">
          <h1 className="text-h4 font-medium">{t("Forms", "النماذج")}</h1>
          <div className="flex flex-wrap items-center gap-space-5">
            <SegmentedToggle label={t("Language", "اللغة")} off={{ label: "English" }} on={{ label: "العربية" }} value={isAr} onChange={(ar) => setLang(ar ? "ar" : "en")} />
            <ThemeToggle isAr={isAr} />
          </div>
        </header>

        <div className="mx-auto flex max-w-6xl flex-col gap-space-10 px-space-6 py-space-10 sm:px-space-10">
          <Section id="field" title={t("Field wrapper", "غلاف الحقل")}>
            <FieldGroup>
              <InputField
                label={t("Campaign name", "اسم الحملة")}
                info={t("Shown to reviewers and on the brief.", "يظهر للمراجعين وفي الموجز.")}
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={60}
                showCount
                hint={t("Up to 60 characters.", "حتى 60 حرفًا.")}
              />
              <InputField label={t("Reference", "المرجع")} optional placeholder="RMD-2027" dir="ltr" />
              <InputField
                label={t("Share link", "رابط المشاركة")}
                readOnly
                value="markyos.com/v/ramadan"
                dir="ltr"
                boxDir="ltr"
                icon="link"
                action={<IconButton icon="copy" label={t("Copy", "نسخ")} onClick={() => navigator.clipboard?.writeText("https://markyos.com/v/ramadan")} className="-me-space-2" />}
              />
              <InputField label={t("Weight", "الوزن")} defaultValue="2.4" suffix={<span className="text-text-muted">kg</span>} dir="ltr" boxDir="ltr" />
            </FieldGroup>
            <InputField layout="horizontal" label={t("Studio", "الاستوديو")} defaultValue={t("Haddad Studio, Riyadh", "استوديو حداد، الرياض")} hint={t("Horizontal layout from 640px up.", "تخطيط أفقي من 640 بكسل فأكثر.")} />
            <Fieldset legend={t("Billing address", "عنوان الفوترة")} description={t("Where invoices are sent.", "حيث تُرسل الفواتير.")} columns={2}>
              <InputField label={t("City", "المدينة")} defaultValue={t("Riyadh", "الرياض")} autoComplete="address-level2" />
              <InputField label={t("Postal code", "الرمز البريدي")} defaultValue="12271" inputMode="numeric" dir="ltr" autoComplete="postal-code" />
            </Fieldset>
          </Section>

          <Section id="text" title={t("Text inputs", "مدخلات النص")}>
            <FieldGroup>
              <TextareaField label={t("Brief", "الموجز")} autoGrow maxRows={6} maxLength={280} showCount value={brief} onChange={(e) => setBrief(e.target.value)} placeholder={t("Start typing…", "ابدأ الكتابة…")} />
              <EmailField label={t("Email", "البريد الإلكتروني")} value={email} onChange={(e) => setEmail(e.target.value)} required />
              <PasswordField label={t("New password", "كلمة مرور جديدة")} strength value={password} onChange={(e) => setPassword(e.target.value)} />
              <PhoneInput label={t("Phone", "الهاتف")} value={phone} onChange={setPhone} hint={phone ? `\u200e${phone}` : t("Saved as +966…", "يُحفظ بصيغة \u200e+966…")} />
              <NumberField label={t("Seats", "المقاعد")} value={seats} onChange={setSeats} min={1} max={50} />
              <CurrencyField label={t("Budget", "الميزانية")} currency="SAR" value={budget} onChange={setBudget} hint={budget === null ? undefined : `${t("Stored as", "يُحفظ كرقم")} ${budget}`} />
              <PercentageField label={t("Share of budget", "نسبة من الميزانية")} value={share} onChange={setShare} step={5} />
              <UrlField label={t("Website", "الموقع الإلكتروني")} value={site} onChange={setSite} />
              <div className="self-end">
                <SearchField label={t("Search assets", "ابحث في الأصول")} placeholder={t("Search assets…", "ابحث في الأصول…")} value={search} onChange={(e) => setSearch(e.target.value)} shortcut fullWidth />
              </div>
              <OtpField label={t("Sign-in code", "رمز الدخول")} value={otp} onChange={setOtp} length={6} />
              <SlugField
                label={t("Guideline address", "عنوان الدليل")}
                base="markyos.com/"
                from={name}
                value={slug}
                onChange={setSlug}
                checkAvailability={checkSlug}
                hint={t("Try riyadh or dubai to see a taken one.", "جرّب riyadh أو dubai لترى عنوانًا مستخدمًا.")}
              />
              <HexColorField label={t("Accent colour", "لون التمييز")} value={colour} onChange={setColour} />
            </FieldGroup>
            <div className="flex flex-col gap-space-4">
              <SegmentedToggle label={t("Bilingual layout", "تخطيط الحقل الثنائي")} off={{ label: t("Side by side", "جنبًا إلى جنب") }} on={{ label: t("Tabs", "تبويبات") }} value={biLayout} onChange={setBiLayout} />
              <BilingualField label={t("Campaign title", "عنوان الحملة")} value={title} onChange={setTitle} layout={biLayout ? "tabs" : "side"} required />
              <BilingualField label={t("Tagline", "الشعار")} value={tagline} onChange={setTagline} multiline layout={biLayout ? "tabs" : "side"} maxLength={120} />
            </div>
            <RichTextField label={t("Story", "القصة")} value={story} onChange={setStory} maxLength={1200} hint={t("Each paragraph takes its own direction.", "لكل فقرة اتجاهها.")} />
          </Section>

          <Section id="matrix" title={t("State matrix", "مصفوفة الحالات")}>
            <p className="text-caption text-text-muted">{t("Tab through any row to see focus. Scroll sideways on a phone.", "تنقّل بالمفتاح Tab لترى التركيز. مرّر جانبيًا على الهاتف.")}</p>
            {/* `relative`, so the visually hidden labels inside stay inside: positioned
                against the page they would sit far off its start in Arabic. */}
            <div className="relative overflow-x-auto">
              <table className="w-max border-separate border-spacing-x-space-6 border-spacing-y-space-4 text-start">
                <thead>
                  <tr>
                    <th scope="col" className="text-start text-caption font-medium text-text-muted" />
                    {STATES.map((s) => (
                      <th key={s} scope="col" className="w-56 text-start text-caption font-medium text-text-muted">
                        {s}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matrix.map((row) => (
                    <tr key={row.name}>
                      <th scope="row" className="align-top text-start font-mono text-caption font-medium">
                        {row.name}
                      </th>
                      {STATES.map((s) => (
                        <td key={s} className="w-56 align-top">
                          {row.render(s)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        </div>
      </main>
    </UiStringsProvider>
  );
}
