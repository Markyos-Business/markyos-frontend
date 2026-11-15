"use client";

import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { Autosave, Form, FormField, FormGrid, InputField, LocalePicker, TextareaField, ToggleField } from "@/components/ui";

type Tr = (en: string, ar: string) => string;
const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const schema = (t: Tr) =>
  z.object({
    displayName: z.string().trim().min(2, t("Enter a name of at least 2 characters.", "أدخل اسمًا من حرفين على الأقل.")),
    jobTitle: z.string().max(60, t("Keep it to 60 characters.", "اجعله 60 حرفًا كحد أقصى.")),
    bio: z.string().max(280, t("Keep it to 280 characters.", "اجعلها 280 حرفًا كحد أقصى.")),
    language: z.string(),
  });
type Profile = z.input<ReturnType<typeof schema>>;

/** "Profile": no Save button; Autosave keeps it saved, offline too. */
const ProfileAutosaveExample = ({ t }: { t: Tr }) => {
  const [failNext, setFailNext] = useState(false);
  const fail = useRef(false);
  useEffect(() => {
    fail.current = failNext;
  }, [failNext]);
  // "Saved 10m ago" on arrival, as if loaded from the server.
  const [savedAt] = useState(() => Date.now() - 10 * 60_000);
  return (
    <div className="flex flex-col gap-space-6">
      <ToggleField label={t("Make the next save fail", "اجعل الحفظ التالي يفشل")} description={t("Or go offline in the browser's tools to see the draft kept on this device.", "أو افصل الاتصال من أدوات المتصفح لترى المسودة المحفوظة على الجهاز.")} checked={failNext} onChange={setFailNext} />
      <Form
        label={t("Profile", "الملف الشخصي")}
        schema={schema(t)}
        defaultValues={{ displayName: "Nour Haddad", jobTitle: "Brand designer", bio: "", language: "ar-SA" }}
        onSubmit={() => undefined}
        successMessage={false}
      >
        <Autosave
          storageKey="markyos:profile:draft"
          savedAt={savedAt}
          onSave={async () => {
            await wait(700);
            if (fail.current) {
              setFailNext(false);
              throw new Error("refused");
            }
          }}
        />
        <FormGrid columns={2}>
          <FormField<Profile, "displayName"> name="displayName" label={t("Display name", "الاسم الظاهر")} render={({ field, id, error }) => <InputField label={t("Display name", "الاسم الظاهر")} id={id} required {...field} error={error} />} />
          <FormField<Profile, "jobTitle"> name="jobTitle" label={t("Job title", "المسمى الوظيفي")} render={({ field, id, error }) => <InputField label={t("Job title", "المسمى الوظيفي")} id={id} optional {...field} error={error} />} />
          <FormGrid.Item span="full">
            <FormField<Profile, "bio"> name="bio" label={t("Bio", "نبذة")} render={({ field, id, error }) => <TextareaField label={t("Bio", "نبذة")} id={id} optional rows={3} maxLength={280} showCount {...field} error={error} />} />
          </FormGrid.Item>
          <FormField<Profile, "language"> name="language" render={({ field, id }) => <LocalePicker id={id} value={field.value} onChange={field.onChange} />} />
        </FormGrid>
      </Form>
    </div>
  );
};

export { ProfileAutosaveExample };
