"use client";

import { useApp } from "@/contexts/AppContext";
import { API_ENABLED } from "@/lib/api/client";
import type { Account } from "@/types";
import { useAvatar } from "../../hooks/useAvatar";
import { useChangePassword } from "../../hooks/useChangePassword";
import { useDeleteAccount } from "../../hooks/useDeleteAccount";
import { useMySessions } from "../../hooks/useMySessions";
import { useProfileDetails } from "../../hooks/useProfileDetails";
import { useTwoFactor } from "../../hooks/useTwoFactor";
import { DeleteAccountSection } from "./DeleteAccountSection";
import { PasswordSection } from "./PasswordSection";
import { ProfileSection } from "./ProfileSection";
import { SessionSection } from "./SessionSection";
import { TwoFactorSection } from "./TwoFactorSection";

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
