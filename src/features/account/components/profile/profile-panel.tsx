"use client";

import { Button, FormDialog, PasswordField, Popup } from "@/components/ui";
import { useAccountLang } from "../../hooks/shared/use-account-lang";
import { useApp } from "@/contexts/AppContext";
import { API_ENABLED } from "@/lib/api/client";
import type { Account } from "@/types";
import { useAvatar } from "../../hooks/profile/use-avatar";
import { useChangePassword } from "../../hooks/profile/use-change-password";
import { useDeleteAccount } from "../../hooks/profile/use-delete-account";
import { useMySessions } from "../../hooks/profile/use-my-sessions";
import { useProfileDetails } from "../../hooks/profile/use-profile-details";
import { useTwoFactor } from "../../hooks/profile/use-two-factor";
import { AccountTypeSection } from "./account-type-section";
import { DeleteAccountSection } from "./delete-account-section";
import { PasswordSection } from "./password-section";
import { ProfileSection } from "./profile-section";
import { SessionSection } from "./session-section";
import { TwoFactorSection } from "./two-factor-section";

/** The profile tab: the person's own details, as opposed to any brand's. */
export function ProfilePanel() {
  const { state } = useApp();
  const account = state.accounts.find((a) => a.id === state.session?.accountId);
  if (!account) return null;
  // Keyed so switching accounts in this browser starts the drafts fresh.
  return <ProfileTab key={account.id} account={account} />;
}

function ProfileTab({ account }: { account: Account }) {
  const { t } = useAccountLang();
  const details = useProfileDetails(account);
  const password = useChangePassword(account);
  const avatar = useAvatar();
  const twoFactor = useTwoFactor(account);
  const sessions = useMySessions();
  const deletion = useDeleteAccount(account);
  return (
    <>
      {API_ENABLED && <AccountTypeSection account={account} />}
      <ProfileSection account={account} details={details} avatar={avatar} />
      {details.emailChangeOpen && (account.hasPassword === false ? (
        <Popup
          open
          onOpenChange={(open) => { if (!open) details.cancelEmailChange(); }}
          title={t("Confirm email change", "تأكيد تغيير البريد")}
          footer={<Button onClick={details.cancelEmailChange}>{t("Cancel", "إلغاء")}</Button>}
        >
          <p>{t(
            "Set a password through your verified inbox before changing your email.",
            "عيّن كلمة مرور من خلال بريدك المُتحقق منه قبل تغيير بريدك الإلكتروني.",
          )}</p>
          <Button href="/reset">{t("Set a password", "تعيين كلمة مرور")}</Button>
        </Popup>
      ) : (
        <FormDialog
          open
          title={t("Confirm email change", "تأكيد تغيير البريد")}
          description={details.email}
          onClose={details.cancelEmailChange}
          onSubmit={details.confirmEmailChange}
          submitLabel={t("Send confirmation", "إرسال التأكيد")}
        >
          <PasswordField
            label={t("Current password", "كلمة المرور الحالية")}
            autoComplete="current-password"
            required
            value={details.currentPassword}
            onChange={(event) => details.setCurrentPassword(event.target.value)}
          />
          <p className="text-caption text-text-muted">{t(
            "Your current address stays active until the new inbox confirms the change.",
            "سيبقى بريدك الحالي نشطًا حتى يؤكد البريد الجديد التغيير.",
          )}</p>
        </FormDialog>
      ))}
      <PasswordSection account={account} password={password} />
      {/* Server features: the browser-only build has no sign-in code, no
          other sessions and no account to delete beyond this browser's. */}
      {API_ENABLED && <TwoFactorSection twoFactor={twoFactor} />}
      <SessionSection account={account} sessions={sessions} />
      {API_ENABLED && <DeleteAccountSection account={account} deletion={deletion} />}
    </>
  );
}
