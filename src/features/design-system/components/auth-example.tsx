"use client";

import { useState } from "react";
import { z } from "zod";
import { AuthLayout, EmailField, Form, FormActions, FormField, MarkyosLogo, OtpField, PasswordField } from "@/components/ui";

type Tr = (en: string, ar: string) => string;
const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const loginSchema = (t: Tr) =>
  z.object({
    email: z.email(t("Enter an email like nour@studio.sa.", "أدخل بريدًا مثل nour@studio.sa.")),
    password: z.string().min(1, t("Enter your password.", "أدخل كلمة المرور.")),
  });
type Login = z.input<ReturnType<typeof loginSchema>>;
const codeSchema = (t: Tr) => z.object({ code: z.string().regex(/^\d{6}$/, t("Enter the 6-digit code.", "أدخل الرمز المكوّن من 6 أرقام.")) });
type Code = z.input<ReturnType<typeof codeSchema>>;

/** Login → code check → signed in, in AuthLayout (inside the gallery, so not full-screen). */
const AuthExample = ({ t, isAr }: { t: Tr; isAr: boolean }) => {
  const [step, setStep] = useState<"login" | "code" | "done">("login");
  const [email, setEmail] = useState("");
  return (
    <div className="relative overflow-hidden rounded-card bg-canvas shadow-edge">
      <AuthLayout
        fill={false}
        brand={<MarkyosLogo variant="lockup" className="w-[160px] max-w-full" isAr={isAr} />}
        title={step === "login" ? t("Sign in", "تسجيل الدخول") : step === "code" ? t("Check your email", "تحقّق من بريدك") : t("You're signed in", "سجّلت الدخول")}
        subtitle={
          step === "login"
            ? t("Welcome back to Markyos.", "مرحبًا بعودتك إلى ماركيوس.")
            : step === "code"
              ? t(`We sent a 6-digit code to ${email}. Try 123456.`, `أرسلنا رمزًا من 6 أرقام إلى ${email}. جرّب 123456.`)
              : t("Taking you to your brands…", "ننقلك إلى علاماتك…")
        }
        footer={step === "login" ? <span>{t("New to Markyos? Create an account", "جديد على ماركيوس؟ أنشئ حسابًا")}</span> : null}
      >
        {step === "login" && (
          <Form
            label={t("Sign in", "تسجيل الدخول")}
            schema={loginSchema(t)}
            defaultValues={{ email: "", password: "" }}
            successMessage={false}
            onSubmit={async (v) => {
              await wait(600);
              setEmail(v.email);
              setStep("code");
            }}
          >
            <FormField<Login, "email"> name="email" label={t("Email", "البريد")} render={({ field, id, error }) => <EmailField label={t("Email", "البريد")} id={id} autoComplete="email" {...field} error={error} />} />
            <FormField<Login, "password"> name="password" label={t("Password", "كلمة المرور")} render={({ field, id, error }) => <PasswordField label={t("Password", "كلمة المرور")} id={id} {...field} error={error} />} />
            <FormActions submitLabel={t("Sign in", "تسجيل الدخول")} align="start" />
          </Form>
        )}
        {step === "code" && (
          <Form
            label={t("Verification code", "رمز التحقق")}
            schema={codeSchema(t)}
            defaultValues={{ code: "" }}
            successMessage={false}
            onSubmit={async (v) => {
              await wait(600);
              if (v.code !== "123456") return { fields: { code: t("That code doesn't match. Check the latest email.", "الرمز غير مطابق. تحقّق من أحدث بريد.") } };
              setStep("done");
            }}
          >
            <FormField<Code, "code"> name="code" label={t("Code", "الرمز")} render={({ field, error }) => <OtpField label={t("Code", "الرمز")} value={field.value} onChange={field.onChange} onBlur={field.onBlur} ref={field.ref} error={error} />} />
            <FormActions submitLabel={t("Verify", "تحقّق")} align="start" />
          </Form>
        )}
      </AuthLayout>
    </div>
  );
};

export { AuthExample };
