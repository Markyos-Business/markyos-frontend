"use client";

import { AlertBanner, Button, Row, Section } from "@/components/ui";
import { API_ENABLED } from "@/lib/api/client";
import type { Account } from "@/types";
import type { ChangePasswordState } from "../../hooks/profile/use-change-password";
import { useAccountLang } from "../../hooks/shared/use-account-lang";

/** Request an email link; the new password is entered only after opening it. */
export function PasswordSection({ account, password }: { account: Account; password: ChangePasswordState }) {
  const { t } = useAccountLang();
  return (
    <Section title={t("Password", "كلمة المرور")} icon="key">
      <Row
        label={t("Update your password by email", "تحديث كلمة المرور عبر البريد")}
        hint={API_ENABLED ? t(
          `We'll email a secure link to ${account.email}. Open it to choose a new password.`,
          `سنرسل رابطًا آمنًا إلى ${account.email}. افتحه لاختيار كلمة مرور جديدة.`,
        ) : t(
          "Password emails aren't sent in the demo.",
          "لا تُرسل رسائل كلمة المرور في العرض التجريبي.",
        )}
        right={
          <Button variant="secondary" size="sm" onClick={password.sendLink} disabled={!API_ENABLED || password.busy || password.cooldown > 0}
            // Busy and cooldown already say why in the label; the demo build has no server to send the link.
            disabledReason={!API_ENABLED ? t("Password links need the live app, not the demo", "روابط كلمة المرور تعمل في التطبيق الفعلي لا في النسخة التجريبية") : undefined}>
            {password.busy ? t("Sending…", "جارٍ الإرسال…") : password.cooldown > 0 ? t(
              `Resend in ${password.cooldown}s`, `إعادة الإرسال بعد ${password.cooldown}ث`,
            ) : password.sentTo ? t("Resend email", "إعادة إرسال البريد") : account.hasPassword === false ? t("Set password", "تعيين كلمة المرور") : t("Change password", "تغيير كلمة المرور")}
          </Button>
        }
      />
      <AlertBanner message={password.error} />
      <AlertBanner tone="success" message={password.sentTo ? t(
        `Check ${password.sentTo} for your password link. If it hasn't arrived, check spam or resend after the countdown. Your password stays unchanged until you use the link.`,
        `تحقق من ${password.sentTo} للوصول إلى رابط كلمة المرور. إذا لم يصلك، تحقق من البريد غير المرغوب فيه أو أعد الإرسال بعد انتهاء العد التنازلي. ستبقى كلمة مرورك دون تغيير حتى تستخدم الرابط.`,
      ) : undefined} />
      {API_ENABLED && <p className="text-caption text-text-muted">{t(
        "After you set the new password, other sessions are signed out.",
        "بعد تعيين كلمة المرور الجديدة، تُسجّل بقية الجلسات خروجها.",
      )}</p>}
    </Section>
  );
}
