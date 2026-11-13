"use client";

import { FormDialog, Row, Section, Switch } from "@/components/ui";
import { PasswordField } from "@/features/auth";
import type { TwoFactorState } from "../../hooks/profile/use-two-factor";
import { useAccountLang } from "../../hooks/shared/use-account-lang";

/** Two-step sign-in: after the password, a 6-digit code emailed to you. */
export function TwoFactorSection({ twoFactor }: { twoFactor: TwoFactorState }) {
  const { t } = useAccountLang();
  if (!twoFactor.available) return null;
  const { enabled } = twoFactor;
  return (
    <Section title={t("Two-step sign-in", "التحقق بخطوتين")} icon="shield-alt">
      <Row
        label={enabled ? t("On", "مفعّل") : t("Off", "متوقف")}
        hint={
          enabled
            ? t("Signing in with your password also asks for a code we email you.", "تسجيل الدخول بكلمة المرور يطلب أيضًا رمزًا نرسله إلى بريدك.")
            : t("Add a code we email you to every sign-in with your password, so a stolen password isn't enough.", "أضف رمزًا نرسله إلى بريدك مع كل تسجيل دخول بكلمة المرور، فلا تكفي كلمة مرور مسروقة.")
        }
        right={<Switch checked={enabled} onToggle={twoFactor.start} label={t("Two-step sign-in", "التحقق بخطوتين")} />}
      />
      <FormDialog
        open={twoFactor.open}
        title={enabled ? t("Turn off two-step sign-in", "إيقاف التحقق بخطوتين") : t("Turn on two-step sign-in", "تفعيل التحقق بخطوتين")}
        description={t("Enter your password to confirm it's you.", "أدخل كلمة المرور لتأكيد هويتك.")}
        submitLabel={enabled ? t("Turn off", "إيقاف") : t("Turn on", "تفعيل")}
        onClose={twoFactor.close}
        onSubmit={twoFactor.submit}
      >
        <PasswordField
          label={t("Password", "كلمة المرور")}
          value={twoFactor.password}
          onChange={(e) => twoFactor.setPassword(e.target.value)}
          autoComplete="current-password"
          autoFocus
        />
      </FormDialog>
    </Section>
  );
}
