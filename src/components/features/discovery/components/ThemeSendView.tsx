"use client";

import { useEffect, useState } from "react";
import { AlertBanner, Badge, Button, EmptyState, Icon, Row, Section, Skeleton, Switch, useDialog, useToast } from "@/components/ui";
import { InputField, SegmentedToggle, SelectInput } from "@/components/form";
import type { Lang } from "@/types";
import { STATUS_META } from "../constants";
import { useFormEditor } from "../hooks/useFormEditor";
import { formPalette } from "../model/theme";
import { changeLink, sendForm, updateForm } from "../services/discoveryService";
import type { AnswerValue, DiscoveryForm, FormPatch, PublicForm } from "../types";
import { ClientForm } from "./client/ClientForm";
import { SaveStatus } from "./SaveStatus";
import { LocalizedInput } from "./builder/LocalizedInput";
import { formatDay } from "../utils/format";

/** A logo the form can carry: one of the brand's logo files. */
export type LogoChoice = { id: string; label: string; url: string };

type ThemeSendViewProps = {
  formId: string;
  logos: LogoChoice[];
  /** The brand's own colours, offered as accents. */
  swatches: { name: string; hex: string }[];
  studioName: string;
  answersHref: string;
  builderHref: string;
  isAr: boolean;
};

/** Where the client's link lives. */
export const publicUrl = (token: string) => `${typeof window === "undefined" ? "" : window.location.origin}/f/${token}`;

const asPublic = (form: DiscoveryForm, logos: LogoChoice[], studioName: string): PublicForm => ({
  name: form.name,
  studioName,
  languages: form.languages,
  primaryLanguage: form.primaryLanguage,
  theme: form.theme,
  logoUrl: logos.find((l) => l.id === form.theme.logoAssetId)?.url ?? null,
  status: form.status,
  closesAt: form.settings.closesAt,
  allowSaveAndResume: form.settings.allowSaveAndResume,
  sections: form.sections.map((s) => ({ id: s.id, title: s.title, questions: s.questions })),
});

/** Theme the client form with the studio's brand, then send the link. */
export function ThemeSendView({ formId, logos, swatches, studioName, answersHref, builderHref, isAr }: ThemeSendViewProps) {
  const editor = useFormEditor(formId);
  const { form, run } = editor;
  const { showToast } = useToast();
  const { confirm } = useDialog();
  const [previewLang, setPreviewLang] = useState<Lang | null>(null);
  const [previewAnswers, setPreviewAnswers] = useState<Record<string, AnswerValue>>({});
  const [hex, setHex] = useState("");
  const [sending, setSending] = useState(false);
  const t = (en: string, ar: string) => (isAr ? ar : en);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mirrors the saved accent into the hex field
    if (form) setHex(form.theme.accent ?? "");
  }, [form]);

  if (editor.loadError) return <EmptyState icon="exclamation-circle" title={t("Couldn't open this form", "تعذّر فتح النموذج")} description={editor.loadError} />;
  if (!form) return <Skeleton className="h-96 w-full rounded-card" />;

  const save = (patch: FormPatch) => run(() => updateForm(form.id, patch));
  const { warnings } = formPalette(form.theme);
  const lang = previewLang ?? form.primaryLanguage;
  const link = form.publicToken ? publicUrl(form.publicToken) : null;
  const status = STATUS_META[form.status];
  const closes = form.settings.closesAt ? form.settings.closesAt.slice(0, 10) : "";

  const send = async () => {
    if (form.status === "draft" && !form.recipientEmail) {
      const ok = await confirm({
        title: t("Send without an email?", "الإرسال دون بريد إلكتروني؟"),
        body: t("The form is marked as sent and you'll copy the link to your client yourself.", "سيُعلَّم النموذج كمُرسل، وتنسخ الرابط لعميلك بنفسك."),
        confirmLabel: t("Mark as sent", "تعليمه كمُرسل"),
        isAr,
      });
      if (!ok) return;
    }
    setSending(true);
    const ok = await run(() => sendForm(form.id, {}));
    setSending(false);
    if (ok) showToast(form.recipientEmail ? t("Sent to your client", "أُرسل إلى عميلك") : t("Marked as sent", "عُلِّم كمُرسل"), "success");
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-space-5">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-h3 font-medium">{form.name}</h1>
          <div className="flex flex-wrap items-center gap-space-4">
            <Badge tone={status.tone} dot>
              {status[isAr ? "ar" : "en"]}
            </Badge>
            <SaveStatus saving={editor.saving} savedAt={editor.savedAt} error={editor.error} isAr={isAr} />
          </div>
        </div>
        <Button variant="outline" href={builderHref} icon={<Icon name="arrow-left" size={18} className="rtl:-scale-x-100" />}>
          {t("Questions", "الأسئلة")}
        </Button>
        {form.status !== "draft" && (
          <Button variant="outline" href={answersHref}>
            {t("Answers", "الإجابات")}
          </Button>
        )}
      </div>

      <AlertBanner message={editor.error} />

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-5">
          <Section title={t("Theme", "التصميم")} icon="palette">
            <div className="flex flex-col gap-space-3">
              <span className="text-caption text-text-muted">{t("Logo", "الشعار")}</span>
              <SelectInput
                aria-label={t("Logo", "الشعار")}
                value={form.theme.logoAssetId ?? ""}
                onChange={(e) => save({ theme: { logoAssetId: e.target.value || null } })}
                options={[{ value: "", label: t("No logo, show the studio name", "بلا شعار، اعرض اسم الاستوديو") }, ...logos.map((l) => ({ value: l.id, label: l.label }))]}
              />
            </div>

            <div className="flex flex-col gap-space-3">
              <span className="text-caption text-text-muted">{t("Accent colour", "لون التمييز")}</span>
              <div className="flex flex-wrap items-center gap-space-3">
                {swatches.slice(0, 8).map((s) => (
                  <button
                    key={s.hex}
                    type="button"
                    aria-label={`${s.name} ${s.hex}`}
                    aria-pressed={form.theme.accent?.toLowerCase() === s.hex.toLowerCase()}
                    onClick={() => save({ theme: { accent: s.hex.toLowerCase() } })}
                    className={`size-8 rounded-md shadow-[inset_0_0_0_1px_var(--chip-edge)] ${form.theme.accent?.toLowerCase() === s.hex.toLowerCase() ? "outline-2 outline-offset-2 outline-accent" : ""}`}
                    style={{ background: s.hex }}
                  />
                ))}
                <input
                  aria-label={t("Accent hex", "رمز اللون")}
                  dir="ltr"
                  value={hex}
                  placeholder="#0062b8"
                  onChange={(e) => setHex(e.target.value)}
                  onBlur={() => {
                    const clean = hex.trim().toLowerCase();
                    if (/^#[0-9a-f]{6}$/.test(clean) && clean !== form.theme.accent) save({ theme: { accent: clean } });
                    else if (!clean && form.theme.accent) save({ theme: { accent: null } });
                  }}
                  className="mk-underline w-28 font-mono"
                />
              </div>
              {warnings.length > 0 && (
                <p role="status" className="rounded-lg bg-warning-soft px-space-5 py-space-4 text-caption text-warning shadow-edge">
                  {warnings.includes("accent_as_text")
                    ? t(
                        "This accent is hard to read as text on this background, so links and selected labels will use the text colour. Buttons keep the accent.",
                        "يصعب قراءة هذا اللون كنص على هذه الخلفية، لذا ستستخدم الروابط والعناصر المحددة لون النص. وتحتفظ الأزرار باللون."
                      )
                    : t("Text on this accent may be hard to read.", "قد يصعب قراءة النص على هذا اللون.")}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-space-3">
              <span className="text-caption text-text-muted">{t("Background", "الخلفية")}</span>
              <SegmentedToggle
                label={t("Background", "الخلفية")}
                off={{ label: t("Light", "فاتحة"), icon: "sun" }}
                on={{ label: t("Dark", "داكنة"), icon: "moon" }}
                value={form.theme.background === "dark"}
                onChange={(dark) => save({ theme: { background: dark ? "dark" : "light" } })}
              />
            </div>

            <LocalizedInput
              label={{ en: "Welcome text", ar: "نص الترحيب" }}
              value={form.theme.welcome}
              onCommit={(welcome) => save({ theme: { welcome } })}
              mode="both"
              languages={form.languages}
              multiline
              placeholder={{ en: "Thanks for making time for this. It takes about 20 minutes.", ar: "شكرًا لتخصيص وقتكم. يستغرق نحو 20 دقيقة." }}
              isAr={isAr}
            />

            <Row
              label={t("“Made with Markyos” badge", "شارة «صُنع باستخدام ماركيوس»")}
              right={
                <Switch label={t("Show the badge", "إظهار الشارة")} checked={form.theme.showMarkyosBadge} onToggle={() => save({ theme: { showMarkyosBadge: !form.theme.showMarkyosBadge } })} />
              }
            />
          </Section>

          <Section title={t("Send", "الإرسال")} icon="envelope">
            <div className="grid grid-cols-1 gap-space-6 sm:grid-cols-2">
              <InputField
                label={t("Client name", "اسم العميل")}
                defaultValue={form.recipientName}
                dir="auto"
                placeholder={t("Nour Haddad", "نور حداد")}
                onBlur={(e) => e.target.value !== form.recipientName && save({ recipientName: e.target.value })}
              />
              <InputField
                label={t("Client email", "بريد العميل")}
                type="email"
                dir="ltr"
                defaultValue={form.recipientEmail}
                placeholder="nour@client.com"
                onBlur={(e) => e.target.value !== form.recipientEmail && save({ recipientEmail: e.target.value })}
              />
            </div>

            {link ? (
              <div className="flex flex-col gap-space-3">
                <span className="text-caption text-text-muted">{t("Client link", "رابط العميل")}</span>
                <div className="flex flex-wrap items-center gap-space-3">
                  <code dir="ltr" className="min-w-0 flex-1 truncate rounded-md bg-surface-2 px-space-4 py-space-3 text-caption text-text-secondary">
                    {link}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    icon={<Icon name="copy" size={16} />}
                    onClick={() => navigator.clipboard.writeText(link).then(() => showToast(t("Link copied", "نُسخ الرابط"), "success"))}
                  >
                    {t("Copy", "نسخ")}
                  </Button>
                </div>
                <div className="flex flex-wrap gap-space-4">
                  <Button variant="link" onClick={() => run(() => changeLink(form.id, "regenerate"))}>
                    {t("New link", "رابط جديد")}
                  </Button>
                  <Button
                    variant="link"
                    onClick={async () => {
                      const ok = await confirm({
                        title: t("Switch off this link?", "إيقاف هذا الرابط؟"),
                        body: t("Your client sees that it was switched off. Answers so far are kept.", "سيرى العميل أن الرابط أوقف، وتبقى الإجابات المحفوظة."),
                        confirmLabel: t("Switch off", "إيقاف"),
                        tone: "danger",
                        isAr,
                      });
                      if (ok) await run(() => changeLink(form.id, "revoke"));
                    }}
                  >
                    {t("Switch off link", "إيقاف الرابط")}
                  </Button>
                </div>
              </div>
            ) : (
              form.linkRevoked && <p className="text-caption text-text-muted">{t("The link is switched off. Send again for a new one.", "الرابط موقوف. أرسل مجددًا لرابط جديد.")}</p>
            )}

            <div className="grid grid-cols-1 gap-space-6 sm:grid-cols-2">
              <label className="flex flex-col gap-space-2">
                <span className="text-caption text-text-muted">{t("Link closes", "يُغلق الرابط")}</span>
                <input
                  type="date"
                  value={closes}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => save({ settings: { closesAt: e.target.value ? `${e.target.value}T23:59:00Z` : null } })}
                  className="mk-underline w-full"
                />
                <span className="text-caption text-text-faint">{closes ? formatDay(form.settings.closesAt, isAr) : t("Stays open", "يبقى مفتوحًا")}</span>
              </label>
              <label className="flex flex-col gap-space-2">
                <span className="text-caption text-text-muted">{t("Remind after", "تذكير بعد")}</span>
                <SelectInput
                  aria-label={t("Remind after", "تذكير بعد")}
                  value={form.settings.remindAfterDays ? String(form.settings.remindAfterDays) : ""}
                  onChange={(e) => save({ settings: { remindAfterDays: e.target.value ? Number(e.target.value) : null } })}
                  options={[
                    { value: "", label: t("No reminder", "بلا تذكير") },
                    ...[2, 3, 5, 7].map((n) => ({ value: String(n), label: t(`${n} days without answers`, `${n} أيام دون إجابات`) })),
                  ]}
                />
              </label>
            </div>

            <Row
              label={t("Save and resume", "الحفظ والمتابعة لاحقًا")}
              hint={t("The client can leave and come back to finish.", "يمكن للعميل المغادرة والعودة لإكمال النموذج.")}
              right={
                <Switch label={t("Save and resume", "الحفظ والمتابعة")} checked={form.settings.allowSaveAndResume} onToggle={() => save({ settings: { allowSaveAndResume: !form.settings.allowSaveAndResume } })} />
              }
            />
            <Row
              label={t("Notify me after each section", "إشعاري بعد كل قسم")}
              hint={t("You're always told about the first answer and the submission.", "تصلك دائمًا إشعارات أول إجابة والتسليم.")}
              right={
                <Switch label={t("Notify after each section", "الإشعار بعد كل قسم")} checked={form.settings.notifyOnSection} onToggle={() => save({ settings: { notifyOnSection: !form.settings.notifyOnSection } })} />
              }
            />

            <div className="flex justify-end">
              <Button variant="primary" onClick={() => void send()} disabled={sending || form.status === "submitted"} icon={<Icon name="envelope" size={18} />}>
                {form.status === "draft" ? t("Send to client", "أرسل إلى العميل") : t("Send again", "أرسل مجددًا")}
              </Button>
            </div>
          </Section>
        </div>

        <div className="flex flex-col gap-space-4 lg:sticky lg:top-0">
          <div className="flex items-center justify-between">
            <h2 className="text-h5 font-medium">{t("Live preview", "معاينة مباشرة")}</h2>
            <span className="text-caption text-text-muted">{t("What your client sees", "ما يراه عميلك")}</span>
          </div>
          <div className="mk-surface h-[640px] overflow-y-auto rounded-card">
            <ClientForm
              form={asPublic(form, logos, studioName)}
              answers={previewAnswers}
              onAnswer={(id, value) => setPreviewAnswers((a) => ({ ...a, [id]: value }))}
              onSubmit={async () => t("This is a preview; nothing is sent.", "هذه معاينة؛ لا يُرسل شيء.")}
              submitted={false}
              files={{}}
              lang={lang}
              onLang={setPreviewLang}
              preview
            />
          </div>
        </div>
      </div>
    </div>
  );
}
