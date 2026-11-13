"use client";

import { useApp } from "@/contexts/AppContext";
import { API_ENABLED } from "@/lib/api/client";
import type { Account } from "@/types";
import { useAvatar } from "../../hooks/profile/use-avatar";
import { useChangePassword } from "../../hooks/profile/use-change-password";
import { useDeleteAccount } from "../../hooks/profile/use-delete-account";
import { useMySessions } from "../../hooks/profile/use-my-sessions";
import { useProfileDetails } from "../../hooks/profile/use-profile-details";
import { useTwoFactor } from "../../hooks/profile/use-two-factor";
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
  const details = useProfileDetails(account);
  const password = useChangePassword(account);
  const avatar = useAvatar();
  const twoFactor = useTwoFactor(account);
  const sessions = useMySessions();
  const deletion = useDeleteAccount(account);
  return (
    <>
      <ProfileSection account={account} details={details} avatar={avatar} />
      <PasswordSection account={account} password={password} />
      {/* Server features: the browser-only build has no sign-in code, no
          other sessions and no account to delete beyond this browser's. */}
      {API_ENABLED && <TwoFactorSection twoFactor={twoFactor} />}
      <SessionSection account={account} sessions={sessions} />
      {API_ENABLED && <DeleteAccountSection account={account} deletion={deletion} />}
    </>
  );
}
