"use client";

import { useApp } from "@/contexts/AppContext";
import type { Account } from "@/types";
import { useChangePassword } from "../../hooks/useChangePassword";
import { useProfileDetails } from "../../hooks/useProfileDetails";
import { PasswordSection } from "./PasswordSection";
import { ProfileSection } from "./ProfileSection";
import { SessionSection } from "./SessionSection";

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
  return (
    <>
      <ProfileSection account={account} details={details} />
      <PasswordSection account={account} password={password} />
      <SessionSection account={account} />
    </>
  );
}
