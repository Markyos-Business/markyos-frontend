"use client";

import { Badge, Button, Row, Section } from "@/components/ui";
import { PasswordField } from "@/components/features/auth";
import { API_ENABLED } from "@/lib/api/client";
import { formatRelative } from "@/lib/utils";
import type { Account } from "@/types";
import type { ChangePasswordState } from "../../hooks/profile/useChangePassword";
import { useAccountLang } from "../../hooks/shared/useAccountLang";

/** When the password last changed, and the form to change it. */
export function PasswordSection({ account, password }: { account: Account; password: ChangePasswordState }) {
  const { readable } = password;
  const { t, isAr } = useAccountLang();
  return (
    <Section title={t("Password", "كلمة المرور")} icon="key">
      <Row
        label={t("Password", "كلمة المرور")}
        hint={
          readable
            ? t("Stored in readable form by an older version of this app. Change it here and it's replaced with a derived key.", "محفوظة بصيغة مقروءة من نسخة أقدم من التطبيق. غيّرها هنا لتُستبدل بمفتاح مشتق.")
            : isAr
              ? `آخر تغيير ${account.passwordUpdatedAt ? formatRelative(account.passwordUpdatedAt) : "الآن"}. يُتحقق منها في كل تسجيل دخول.`
              : `Last changed ${account.passwordUpdatedAt ? formatRelative(account.passwordUpdatedAt) : "just now"}. It is checked every time you sign in.`
        }
        right={
          <div className="flex items-center gap-2.5 shrink-0">
            {!API_ENABLED && <Badge tone={readable ? "warning" : "success"}>{readable ? t("Readable", "مقروءة") : t("Hashed", "مشفّرة")}</Badge>}
            <Button variant="outline" size="sm" onClick={password.toggle}>
              {password.open ? t("Cancel", "إلغاء") : t("Change", "تغيير")}
            </Button>
          </div>
        }
      />

      {password.open && (
        <form onSubmit={password.submit} className="rounded-widget p-space-8 flex flex-col gap-space-5 bg-surface-sunken shadow-edge-soft">
          <PasswordField
            label={t("Current password", "كلمة المرور الحالية")}
            value={password.current}
            onChange={(e) => password.setCurrent(e.target.value)}
            error={password.errors.current}
            autoComplete="current-password"
          />
          <div className="grid sm:grid-cols-2 gap-3">
            <PasswordField
              label={t("New password", "كلمة المرور الجديدة")}
              value={password.next}
              strength
              onChange={(e) => password.setNext(e.target.value)}
              error={password.errors.next}
              autoComplete="new-password"
            />
            <PasswordField
              label={t("Confirm new password", "تأكيد كلمة المرور الجديدة")}
              value={password.confirm}
              onChange={(e) => password.setConfirm(e.target.value)}
              error={password.errors.confirm}
              autoComplete="new-password"
            />
          </div>
          <Button type="submit" variant="primary" size="sm" className="self-start" disabled={password.busy}>
            {password.busy ? t("Saving…", "جارٍ الحفظ…") : t("Change password", "تغيير كلمة المرور")}
          </Button>
          {/* Said plainly rather than implied: the browser-only build keeps
              everything in this browser, so a password there is a local gate,
              not an account on a server somewhere. What hashing buys is that
              the string stored there isn't the one that opens your email too. */}
          <p className="text-caption text-text-faint">
            {API_ENABLED
              ? t("Changing it signs you out on every other device. This browser stays signed in.", "تغييرها يسجّل خروجك من كل الأجهزة الأخرى، ويبقى هذا المتصفح مسجّلًا.")
              : "This build stores your data in this browser, so the password guards this browser's copy — it is never sent anywhere. It is kept as a PBKDF2-derived key rather than the password itself, so what sits in storage can't be read back and tried elsewhere. Clearing site data still erases the account, and a forgotten password is reset from the login screen."}
          </p>
        </form>
      )}
    </Section>
  );
}
