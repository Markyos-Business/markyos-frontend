"use client";

import { requestEmailChange } from "../../api/account.api";
import { useState } from "react";
import { useAppActions } from "@/contexts/AppContext";
import { useToast } from "@/components/ui";
import { EMAIL_RE } from "@/features/auth";
import { API_ENABLED } from "@/lib/api/client";
import type { Account } from "@/types";
import { useAccountLang } from "../shared/use-account-lang";

/**
 * Name and email, edited in place.
 *
 * Name saves on blur. In API mode, changing email opens a password
 * confirmation before requesting verification from the new inbox.
 */
export function useProfileDetails(account: Account) {
  const { t, isAr } = useAccountLang();
  const { updateAccount, pendingEmailAction, setServerAccount } = useAppActions();
  const { showToast } = useToast();
  const [name, setName] = useState(account.name);
  const [email, setEmail] = useState(account.email);
  const [emailChangeOpen, setEmailChangeOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
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
    showToast(t("Name updated.", "تم تحديث الاسم."), "success");
  }

  async function commitEmail() {
    const value = email.trim();
    if (value === account.email) {
      setEmailError(undefined);
      return;
    }
    if (!EMAIL_RE.test(value)) {
      setEmailError(t("Enter a valid email address.", "أدخل بريدًا إلكترونيًا صحيحًا."));
      return;
    }
    if (API_ENABLED) {
      setEmailError(undefined);
      setCurrentPassword("");
      setEmailChangeOpen(true);
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
    showToast(t("Email updated — you'll sign in with this from now on.", "تم تحديث البريد، وستسجّل الدخول به من الآن."), "success");
  }

  function cancelEmailChange() {
    setEmailChangeOpen(false);
    setCurrentPassword("");
    setEmail(account.email);
  }

  async function confirmEmailChange(): Promise<string | void> {
    try {
      setServerAccount(await requestEmailChange(email.trim(), currentPassword));
      showToast(t(
        "Check the new inbox to confirm your email change.",
        "تحقق من البريد الجديد لتأكيد تغيير بريدك.",
      ), "success");
    } catch (err) {
      return err instanceof Error ? err.message : t(
        "Could not request the change.", "تعذر طلب التغيير.",
      );
    }
  }

  async function resendPending() {
    const failed = await pendingEmailAction("resend");
    showToast(failed ?? (isAr ? `أُعيد الإرسال إلى ${account.pendingEmail}.` : `Sent again to ${account.pendingEmail}.`), failed ? "danger" : "success");
  }

  async function cancelPending() {
    const failed = await pendingEmailAction("cancel");
    showToast(failed ?? t("Email change cancelled.", "أُلغي تغيير البريد."), failed ? "danger" : "success");
  }

  return {
    emailChangeOpen,
    currentPassword,
    setCurrentPassword,
    cancelEmailChange,
    confirmEmailChange,
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
