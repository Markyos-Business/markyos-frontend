"use client";

// The fields of the overlay form examples, apart from the files that draw
// icons: the icon-name audit reads any name="…" in such a file as a glyph.
import { z } from "zod";
import {
  DatePicker,
  EmailField,
  FormField,
  InputField,
  Select,
  TagInput,
  TextareaField,
} from "@/components/ui";

type Tr = (en: string, ar: string) => string;

const inviteSchema = (t: Tr) =>
  z.object({
    email: z.email(
      t(
        "Enter an email like omar@studio.ae.",
        "أدخل بريدًا مثل omar@studio.ae.",
      ),
    ),
    role: z.string().min(1, t("Choose a role.", "اختر دورًا.")),
    message: z
      .string()
      .max(200, t("Keep it to 200 characters.", "اجعلها 200 حرف كحد أقصى.")),
  });
type Invite = z.input<ReturnType<typeof inviteSchema>>;

const assetSchema = (t: Tr) =>
  z.object({
    alt: z
      .string()
      .trim()
      .min(
        1,
        t(
          "Describe the image for screen readers.",
          "صف الصورة لقارئات الشاشة.",
        ),
      ),
    usage: z
      .string()
      .min(1, t("Choose where it can be used.", "اختر أين يمكن استخدامها.")),
    expires: z.string().nullable(),
    tags: z.array(z.string()),
    notes: z.string().max(300),
  });
type Asset = z.input<ReturnType<typeof assetSchema>>;

/** "Invite teammate": email, role and an optional message. */
const InviteFields = ({ t }: { t: Tr }) => (
  <>
    <FormField<Invite, "email">
      name="email"
      label={t("Email", "البريد")}
      render={({ field, id, error }) => (
        <EmailField
          label={t("Email", "البريد")}
          id={id}
          required
          {...field}
          error={error}
          hint={t(
            "Try lina@nadeen.sa for an error from the server.",
            "جرّب lina@nadeen.sa لترى خطأ من الخادم.",
          )}
        />
      )}
    />
    <FormField<Invite, "role">
      name="role"
      label={t("Role", "الدور")}
      render={({ field, id, error }) => (
        <Select
          id={id}
          label={t("Role", "الدور")}
          required
          value={field.value}
          onValueChange={field.onChange}
          error={error}
          options={[
            {
              value: "editor",
              label: t("Editor", "محرر"),
              description: t(
                "Edits guidelines and assets",
                "يعدّل الأدلة والملفات",
              ),
            },
            {
              value: "reviewer",
              label: t("Reviewer", "مراجع"),
              description: t("Comments and approves", "يعلّق ويوافق"),
            },
            {
              value: "viewer",
              label: t("Viewer", "مشاهد"),
              description: t("Sees published work", "يرى الأعمال المنشورة"),
            },
          ]}
        />
      )}
    />
    <FormField<Invite, "message">
      name="message"
      label={t("Message", "رسالة")}
      render={({ field, id, error }) => (
        <TextareaField
          label={t("Message", "رسالة")}
          id={id}
          optional
          rows={3}
          maxLength={200}
          showCount
          {...field}
          error={error}
        />
      )}
    />
  </>
);

/** "Asset details": alt text, usage, licence end, tags and notes. */
const AssetFields = ({ t }: { t: Tr }) => (
  <>
    <FormField<Asset, "alt">
      name="alt"
      label={t("Alt text", "النص البديل")}
      render={({ field, id, error }) => (
        <InputField
          label={t("Alt text", "النص البديل")}
          id={id}
          required
          maxLength={140}
          showCount
          {...field}
          error={error}
        />
      )}
    />
    <FormField<Asset, "usage">
      name="usage"
      label={t("Usage", "الاستخدام")}
      render={({ field, id, error }) => (
        <Select
          id={id}
          label={t("Usage", "الاستخدام")}
          required
          value={field.value}
          onValueChange={field.onChange}
          error={error}
          options={[
            { value: "social", label: t("Social media", "وسائل التواصل") },
            { value: "web", label: t("Website", "الموقع") },
            { value: "print", label: t("Print", "المطبوعات") },
          ]}
        />
      )}
    />
    <FormField<Asset, "expires">
      name="expires"
      label={t("Licence ends", "ينتهي الترخيص")}
      render={({ field, error }) => (
        <DatePicker
          label={t("Licence ends", "ينتهي الترخيص")}
          value={field.value}
          onChange={field.onChange}
          error={error}
          optional
        />
      )}
    />
    <FormField<Asset, "tags">
      name="tags"
      label={t("Tags", "الوسوم")}
      render={({ field, error }) => (
        <TagInput
          label={t("Tags", "الوسوم")}
          value={field.value}
          onChange={field.onChange}
          onBlur={field.onBlur}
          error={error}
        />
      )}
    />
    <FormField<Asset, "notes">
      name="notes"
      label={t("Notes", "ملاحظات")}
      render={({ field, id, error }) => (
        <TextareaField
          label={t("Notes", "ملاحظات")}
          id={id}
          optional
          rows={3}
          maxLength={300}
          showCount
          {...field}
          error={error}
        />
      )}
    />
  </>
);

export { AssetFields, InviteFields, assetSchema, inviteSchema };
