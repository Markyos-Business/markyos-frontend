"use client";

import { useState } from "react";
import { useAppActions } from "@/contexts/AppContext";
import { useToast } from "@/components/ui";
import type { Account } from "@/types";
import { setTwoFactor } from "../../api/account.api";
import { useAccountLang } from "../shared/use-account-lang";
import { errorText } from "@/lib/api/errorText";

/**
 * Two-step sign-in: turning it on or off asks for the password first, in a
 * dialog, so someone at an unlocked laptop can't quietly switch it off.
 */
export function useTwoFactor(account: Account) {
  const { t, lang } = useAccountLang();
  const { setServerAccount } = useAppActions();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const enabled = !!account.twoFactorEnabled;

  function close() {
    setOpen(false);
    setPassword("");
  }

  async function submit(): Promise<string | void> {
    if (!password) return t("Enter your password.", "أدخل كلمة المرور.");
    try {
      setServerAccount(await setTwoFactor(!enabled, password));
      setPassword("");
      showToast(enabled ? t("Two-step sign-in is off.", "أُوقف التحقق بخطوتين.") : t("Two-step sign-in is on.", "فُعّل التحقق بخطوتين."), "success");
    } catch (err) {
      return errorText(err, lang);
    }
  }

  return {
    // A Google-only account signs in through Google, which has its own checks.
    available: account.hasPassword !== false,
    enabled,
    open,
    start: () => setOpen(true),
    close,
    password,
    setPassword,
    submit,
  };
}

export type TwoFactorState = ReturnType<typeof useTwoFactor>;
