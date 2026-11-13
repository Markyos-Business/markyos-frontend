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
} from "@/components/ui";
import { AddressFields, ConfirmByTyping, CountryPicker, LocalePicker, MarketPicker, MentionTextarea, PeoplePicker, RangeSlider, Rating, SliderField, TimezonePicker, type Address, type Person, AvatarUpload, CheckboxField, CheckboxGroup, ChipSelector, FileDropzone, ImageUpload, UploadList, type UploadItem, DatePicker, DateRangePicker, DateTimePicker, DurationInput, TimePicker, IconButton, RadioCardGroup, RadioField, SegmentedControl, Switch, TagInput, ToggleField, UiStringsProvider } from "@/components/ui";
import { ThemeToggle } from "@/components/ui";

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
  const [terms, setTerms] = useState(false);
  const [markets, setMarkets] = useState<string[]>(["riyadh"]);
  const [channels, setChannels] = useState<string[]>([]);
  const [plan, setPlan] = useState("pass");
  const [tier, setTier] = useState<"studio" | "freelancer" | "company">("studio");
  const [view, setView] = useState<"day" | "week" | "month">("week");
  const [tags, setTags] = useState<string[]>(["Ramadan", "Riyadh"]);
  const [city, setCity] = useState<"riyadh" | "dubai" | "cairo" | null>("riyadh");
  const [types, setTypes] = useState<("logo" | "photo" | "video")[]>(["photo"]);
  const [notify, setNotify] = useState(true);
  const [saving, setSaving] = useState(false);
  const [compact, setCompact] = useState(false);
  const [launch, setLaunch] = useState<string | null>("2026-09-12");
  const [review, setReview] = useState<string | null>(null);
  const [hijriDay, setHijriDay] = useState<string | null>("2026-03-20");
  const [range, setRange] = useState<{ from?: string; to?: string }>({ from: "2026-09-01", to: "2026-09-30" });
  const [meeting, setMeeting] = useState<string | null>("14:30");
  const [meeting24, setMeeting24] = useState<string | null>("09:00");
  const [kickoff, setKickoff] = useState<string | null>("2026-09-15T10:00");
  const [length, setLength] = useState<number | null>(90);
  const [uploads, setUploads] = useState<UploadItem[]>([
    { id: "u1", name: "Riyadh launch brief.pdf", size: 2_516_582, status: "done" },
    { id: "u2", name: "Dubai Mall billboard.png", size: 4_404_019, status: "failed", error: "connection" },
  ]);
  const [cover, setCover] = useState<string | null>("/markyos-pattern.png");
  const [photo, setPhoto] = useState<string | null>(null);
  // A pretend upload: queued, then climbing, then done (or, for names with "fail", failed).
  const upload = (files: File[]) => {
    const fresh = files.map((f, i) => ({ id: `${Date.now()}-${i}`, name: f.name, size: f.size, status: "queued" as const }));
    setUploads((u) => [...u, ...fresh]);
    fresh.forEach((item) => run(item.id, /fail/i.test(item.name)));
  };
  const run = (id: string, fail: boolean) => {
    let p = 0;
    const tick = setInterval(() => {
      p += 20;
      setUploads((u) => u.map((x) => (x.id !== id ? x : p >= 100 ? { ...x, status: fail ? "failed" : "done", progress: undefined, error: fail ? "unreadable" : undefined } : { ...x, status: "uploading", progress: p })));
      if (p >= 100) clearInterval(tick);
    }, 400);
  };
  const [opacity, setOpacity] = useState(80);
  const [budgetRange, setBudgetRange] = useState<[number, number]>([20_000, 60_000]);
  const [score, setScore] = useState(4);
  const [locale, setLocale] = useState("ar-SA");
  const [country, setCountry] = useState("SA");
  const [marketsPicked, setMarketsPicked] = useState<string[]>(["SA", "AE"]);
  const [zone, setZone] = useState("Asia/Riyadh");
  const team: Person[] = [
    { id: "nour", name: "Nour Haddad", email: "nour@studio.sa", presence: "online" },
    { id: "omar", name: "Omar Aziz", email: "omar@studio.ae", presence: "busy" },
    { id: "lina", name: "Lina Mansour", email: "lina@studio.eg", presence: "away" },
    { id: "yousef", name: "Yousef Ali", email: "yousef@studio.sa", presence: "offline" },
  ];
  const [reviewers, setReviewers] = useState<string[]>(["nour"]);
  const [note, setNote] = useState("");
  const [mentioned, setMentioned] = useState<string[]>([]);
  const [address, setAddress] = useState<Address>({ country: "SA", building: "8228", street: "King Fahd Road", district: "Al Olaya", city: "Riyadh", postalCode: "12271", additional: "2121" });
  const [deleted, setDeleted] = useState(false);
  const sar = (n: number) => `SAR ${n.toLocaleString("en-US")}`;
  const weekend = (iso: string) => [5, 6].includes(new Date(`${iso}T12:00`).getDay());
  const flip = () => {
    setSaving(true);
    setTimeout(() => {
      setNotify((v) => !v);
      setSaving(false);
    }, 900);
  };

  const na = <span className="text-caption text-text-faint">—</span>;
  const matrix: { name: string; render: (s: MatrixState) => ReactNode }[] = [
    {
      name: "CountryPicker",
      render: (s) => (["validating", "readOnly", "locked", "warning", "loading"].includes(s) ? na : <CountryPicker value={s === "default" ? "" : "AE"} onChange={() => undefined} disabled={s === "disabled"} error={s === "error" ? t("Choose a country.", "اختر دولة.") : undefined} success={s === "success"} />),
    },
    { name: "DatePicker", render: (s) => <DatePicker label={t("Launch date", "تاريخ الإطلاق")} value={s === "default" ? null : "2026-09-12"} onChange={() => undefined} {...stateProps(s, t)} /> },
    { name: "TimePicker", render: (s) => <TimePicker label={t("Time", "الوقت")} value={s === "default" ? null : "14:30"} onChange={() => undefined} hour12 {...stateProps(s, t)} /> },
    {
      name: "CheckboxField",
      render: (s) =>
        ["validating", "readOnly", "locked", "loading", "warning"].includes(s) ? na : (
          <CheckboxField label={t("Riyadh", "الرياض")} defaultChecked={s !== "default"} disabled={s === "disabled"} error={s === "error" ? t("Choose a market.", "اختر سوقًا.") : undefined} success={s === "success" ? t("Saved.", "تم الحفظ.") : undefined} />
        ),
    },
    {
      name: "ToggleField",
      render: (s) =>
        ["warning", "success", "readOnly", "locked", "loading"].includes(s) ? na : (
          <ToggleField label={t("Notify reviewers", "إشعار المراجعين")} checked={s !== "default"} onChange={() => undefined} disabled={s === "disabled"} loading={s === "validating"} error={s === "error" ? t("Couldn't save.", "تعذّر الحفظ.") : undefined} />
        ),
    },
    {
      name: "TagInput",
      render: (s) =>
        s === "readOnly" ? na : (
          <TagInput label={t("Tags", "الوسوم")} value={s === "default" ? [] : ["Ramadan", "Riyadh"]} onChange={() => undefined} {...stateProps(s, t)} />
        ),
    },
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

          <Section id="choice" title={t("Choice inputs", "مدخلات الاختيار")}>
            <FieldGroup>
              <div className="flex flex-col gap-space-5">
                <CheckboxField label={t("I agree to the brand terms", "أوافق على شروط العلامة")} description={t("Required to publish.", "مطلوب للنشر.")} checked={terms} onChange={(e) => setTerms(e.target.checked)} />
                <CheckboxField label={t("Indeterminate", "غير محدد")} indeterminate onChange={() => undefined} />
              </div>
              <CheckboxGroup
                label={t("Markets", "الأسواق")}
                selectAll
                min={1}
                options={[
                  { value: "riyadh", label: t("Riyadh", "الرياض"), description: "ar-SA" },
                  { value: "dubai", label: t("Dubai", "دبي"), description: "ar-AE" },
                  { value: "cairo", label: t("Cairo", "القاهرة"), description: "ar-EG" },
                  { value: "doha", label: t("Doha", "الدوحة"), disabled: true },
                ]}
                value={markets}
                onChange={setMarkets}
              />
              <CheckboxGroup
                label={t("Channels, up to 2", "القنوات، حتى قناتين")}
                orientation="horizontal"
                max={2}
                options={[
                  { value: "social", label: t("Social", "التواصل") },
                  { value: "print", label: t("Print", "المطبوعات") },
                  { value: "outdoor", label: t("Outdoor", "الإعلانات الخارجية") },
                ]}
                value={channels}
                onChange={setChannels}
              />
              <RadioField
                label={t("Billing", "الفوترة")}
                orientation="vertical"
                options={[
                  { value: "pass", label: t("Brand pass", "اشتراك العلامة"), description: "SAR 1,900" },
                  { value: "monthly", label: t("Monthly", "شهري"), description: "SAR 2,900" },
                  { value: "enterprise", label: t("Enterprise", "مؤسسات"), disabled: true },
                ]}
                value={plan}
                onChange={setPlan}
                hint={t("Arrow keys move the choice.", "تنقل الأسهم بين الخيارات.")}
              />
            </FieldGroup>
            <RadioCardGroup
              label={t("Account type", "نوع الحساب")}
              columns={3}
              options={[
                { value: "studio", label: t("Studio", "استوديو"), hint: t("A team serving several brands.", "فريق يخدم عدة علامات."), icon: "users" },
                { value: "freelancer", label: t("Freelancer", "مستقل"), hint: t("One person, a few clients.", "شخص واحد وبضعة عملاء."), icon: "user" },
                { value: "company", label: t("Company", "شركة"), hint: t("Your own brand, in-house.", "علامتك أنت، داخليًا."), icon: "sitemap" },
              ]}
              value={tier}
              onChange={setTier}
            />
            <FieldGroup>
              <div className="flex flex-col gap-space-4">
                <ToggleField label={t("Notify reviewers", "إشعار المراجعين")} description={{ on: t("They get an email for each change.", "يصلهم بريد لكل تغيير."), off: t("No emails.", "بلا رسائل.") }} checked={notify} onChange={flip} loading={saving} />
                <span className="flex items-center justify-between gap-space-4 px-space-5 text-body">
                  {t("Compact rows", "صفوف مضغوطة")}
                  <Switch label={t("Compact rows", "صفوف مضغوطة")} checked={compact} onToggle={() => setCompact((v) => !v)} />
                </span>
              </div>
              <div className="flex flex-col gap-space-5">
                <SegmentedControl
                  label={t("Calendar view", "عرض التقويم")}
                  options={[
                    { value: "day", label: t("Day", "يوم") },
                    { value: "week", label: t("Week", "أسبوع") },
                    { value: "month", label: t("Month", "شهر") },
                  ]}
                  value={view}
                  onChange={setView}
                />
                <ChipSelector
                  label={t("City", "المدينة")}
                  options={[
                    { value: "riyadh", label: t("Riyadh", "الرياض"), count: 12 },
                    { value: "dubai", label: t("Dubai", "دبي"), count: 8 },
                    { value: "cairo", label: t("Cairo", "القاهرة"), count: 5 },
                  ]}
                  value={city}
                  onChange={setCity}
                />
                <ChipSelector
                  multiple
                  label={t("Asset type", "نوع الأصل")}
                  options={[
                    { value: "logo", label: t("Logo", "شعار") },
                    { value: "photo", label: t("Photo", "صورة") },
                    { value: "video", label: t("Video", "فيديو") },
                  ]}
                  value={types}
                  onChange={setTypes}
                />
              </div>
            </FieldGroup>
            <TagInput label={t("Tags", "الوسوم")} value={tags} onChange={setTags} max={6} placeholder={t("Add a tag…", "أضف وسمًا…")} />
          </Section>

          <Section id="dates" title={t("Date and time", "التاريخ والوقت")}>
            <FieldGroup>
              <DatePicker label={t("Launch date", "تاريخ الإطلاق")} value={launch} onChange={setLaunch} weekStart={0} hint={t("Type 12 Sep 2026 or pick a day. Weeks start on Sunday.", "اكتب 12 سبتمبر 2026 أو اختر يومًا. يبدأ الأسبوع يوم الأحد.")} />
              <DatePicker
                label={t("Review day", "يوم المراجعة")}
                value={review}
                onChange={setReview}
                weekStart={1}
                min="2026-09-01"
                max="2026-10-31"
                isDisabled={weekend}
                hint={t("Sep to Oct, weekdays only. Weeks start on Monday.", "من سبتمبر إلى أكتوبر، أيام العمل فقط. يبدأ الأسبوع يوم الاثنين.")}
              />
              <DatePicker label={t("Eid campaign", "حملة العيد")} value={hijriDay} onChange={setHijriDay} weekStart={6} hijri digits={isAr ? "arab" : "latn"} hint={t("With Hijri dates; weeks start on Saturday.", "مع التاريخ الهجري؛ يبدأ الأسبوع يوم السبت.")} />
              <DateRangePicker label={t("Reporting period", "فترة التقرير")} value={range} onChange={setRange} weekStart={0} />
              <TimePicker label={t("Meeting, 12 hours", "الاجتماع، 12 ساعة")} value={meeting} onChange={setMeeting} hour12 hint={meeting ? `${t("Stored as", "يُحفظ كـ")} ${meeting}` : undefined} />
              <TimePicker label={t("Meeting, 24 hours", "الاجتماع، 24 ساعة")} value={meeting24} onChange={setMeeting24} minuteStep={15} />
              <DurationInput label={t("Session length", "مدة الجلسة")} value={length} onChange={setLength} maxHours={12} hint={length !== null ? `${t("Stored as", "يُحفظ كـ")} ${length} ${t("minutes", "دقيقة")}` : undefined} />
            </FieldGroup>
            <DateTimePicker label={t("Kick-off", "الانطلاق")} value={kickoff} onChange={setKickoff} hour12 weekStart={0} hint={kickoff ?? undefined} />
          </Section>

          <Section id="files" title={t("Files and media", "الملفات والوسائط")}>
            <FileDropzone
              label={t("Brief files", "ملفات الموجز")}
              description={t("Up to 5 files. Name one with \"fail\" in it to see a failed upload.", "حتى 5 ملفات. سمِّ ملفًا يحتوي على \"fail\" لترى رفعًا متعثرًا.")}
              accept=".pdf,image/*"
              acceptLabel={t("PDF or image", "PDF أو صورة")}
              maxBytes={10 * 1024 * 1024}
              maxFiles={5}
              already={uploads.length}
              onFiles={upload}
            />
            <UploadList
              label={t("Brief files", "ملفات الموجز")}
              // Sample errors are keys, written in the current language here.
              items={uploads.map((u) => (u.error === "connection" ? { ...u, error: t("The connection dropped. Try again.", "انقطع الاتصال. حاول مرة أخرى.") } : u.error === "unreadable" ? { ...u, error: t("The file couldn't be read.", "تعذّرت قراءة الملف.") } : u))}
              onCancel={(id) => setUploads((u) => u.filter((x) => x.id !== id))}
              onRemove={(id) => setUploads((u) => u.filter((x) => x.id !== id))}
              onRetry={(id) => {
                setUploads((u) => u.map((x) => (x.id === id ? { ...x, status: "queued", error: undefined } : x)));
                run(id, false);
              }}
            />
            <FieldGroup>
              <ImageUpload label={t("Cover image", "صورة الغلاف")} value={cover} onChange={setCover} aspect={16 / 9} />
              <AvatarUpload label={t("Profile photo", "الصورة الشخصية")} value={photo} onChange={setPhoto} initials="NH" />
            </FieldGroup>
          </Section>

          <Section id="special" title={t("Special inputs", "مدخلات خاصة")}>
            <FieldGroup>
              <SliderField label={t("Opacity", "الشفافية")} value={opacity} min={0} max={100} step={5} onChange={setOpacity} valueText={`${opacity}%`} marks={[{ value: 0, label: "0%" }, { value: 50, label: "50%" }, { value: 100, label: "100%" }]} />
              <RangeSlider label={t("Budget", "الميزانية")} value={budgetRange} onChange={setBudgetRange} min={0} max={100_000} step={5_000} minGap={5_000} format={sar} />
              <Rating label={t("Brand fit", "ملاءمة العلامة")} value={score} onChange={setScore} clearable />
              <Rating label={t("Average review", "متوسط التقييم")} value={4} readOnly />
              <LocalePicker value={locale} onChange={setLocale} />
              <CountryPicker value={country} onChange={setCountry} />
              <MarketPicker value={marketsPicked} onChange={setMarketsPicked} max={4} />
              <TimezonePicker value={zone} onChange={setZone} hint={t("Campaign times are shown in this zone.", "تظهر أوقات الحملة بهذه المنطقة.")} />
              <PeoplePicker label={t("Reviewers", "المراجعون")} people={team} value={reviewers} onChange={setReviewers} max={3} />
              <MentionTextarea label={t("Note to the team", "ملاحظة للفريق")} people={team} value={note} onChange={setNote} onMentionsChange={setMentioned} rows={3} />
            </FieldGroup>
            {mentioned.length > 0 && <p className="px-space-5 text-caption text-text-muted">{t("Mentioned:", "المذكورون:")} {mentioned.join(", ")}</p>}
            <AddressFields value={address} onChange={setAddress} />
            <div className="max-w-md">
              {deleted ? (
                <p className="text-body text-text-muted">{t("Ramadan launch was deleted.", "تم حذف إطلاق رمضان.")}</p>
              ) : (
                <ConfirmByTyping name="Ramadan launch" actionLabel={t("Delete brand", "حذف العلامة")} description={t("Its guidelines, files and share links go with it.", "تُحذف معها أدلتها وملفاتها وروابط مشاركتها.")} onConfirm={() => setDeleted(true)} />
              )}
            </div>
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
