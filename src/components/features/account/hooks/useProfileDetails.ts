"use client";

import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { useToast } from "@/components/ui";
import { EMAIL_RE } from "@/components/features/auth";
import { API_ENABLED } from "@/lib/api/client";
import type { Account } from "@/types";

/**
 * Name and email, edited in place.
 *
 * Both commit on blur rather than per keystroke — the same reason the brand
 * name does: a store write per character fills the history with half-typed
 * values.
 */
export function useProfileDetails(account: Account) {
  const { updateAccount, pendingEmailAction } = useApp();
  const { showToast } = useToast();
  const [name, setName] = useState(account.name);
  const [email, setEmail] = useState(account.email);
  const [emailError, setEmailError] = useState<string | undefined>();

  async function commitName() {
    const value = name.trim();
    if (!value || value === account.name) {
      setName(account.name);
      return;
    }
    const failed = await updateAccount({ name: value });
    if (failed) {
      setName(account.name);
      showToast(failed, "danger");
      return;
    }
    showToast("Name updated.", "success");
  }

  async function commitEmail() {
    const value = email.trim();
    if (value === account.email) {
      setEmailError(undefined);
      return;
    }
    if (!EMAIL_RE.test(value)) {
      setEmailError("Enter a valid email address.");
      return;
    }
    // The store rejects an email another account already uses — otherwise the
    // two would collide at sign-in and the second person would be locked out.
    const failed = await updateAccount({ email: value });
    if (failed) {
      setEmailError(failed);
      return;
    }
    setEmailError(undefined);
    if (API_ENABLED) {
      // Not switched yet: the new inbox confirms it first, and the field
      // goes back to the email that still signs in.
      setEmail(account.email);
      showToast(`Check ${value} for a link to confirm the change.`, "success");
      return;
    }
    showToast("Email updated — you'll sign in with this from now on.", "success");
  }

  async function resendPending() {
    const failed = await pendingEmailAction("resend");
    showToast(failed ?? `Sent again to ${account.pendingEmail}.`, failed ? "danger" : "success");
  }

  async function cancelPending() {
    const failed = await pendingEmailAction("cancel");
    showToast(failed ?? "Email change cancelled.", failed ? "danger" : "success");
  }

  return {
    name,
    setName,
    commitName,
    resetName: () => setName(account.name),
    email,
    setEmail,
    emailError,
    pendingEmail: account.pendingEmail ?? null,
    resendPending,
    cancelPending,
    commitEmail,
    resetEmail: () => {
      setEmail(account.email);
      setEmailError(undefined);
    },
  };
}

export type ProfileDetailsState = ReturnType<typeof useProfileDetails>;
