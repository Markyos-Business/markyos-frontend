"use client";

import { useEffect, useRef, useState } from "react";
import { requestPasswordReset } from "@/features/auth";
import { API_ENABLED } from "@/lib/api/client";
import type { Account } from "@/types";
import { useAccountLang } from "../shared/use-account-lang";

/** Change passwords through the existing single-use emailed reset link. */
export function useChangePassword(account: Account) {
  const { t } = useAccountLang();
  const sending = useRef(false);
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (!cooldown) return;
    const timer = window.setTimeout(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  async function sendLink() {
    if (!API_ENABLED || sending.current || cooldown > 0) return;
    sending.current = true;
    setBusy(true);
    setError(null);
    const email = account.email;
    try {
      await requestPasswordReset(email);
      setSentTo(email);
      // Matches the backend's per-address email cooldown; server throttles
      // still apply across tabs/devices and failures remain visible.
      setCooldown(30);
    } catch (err) {
      setError(err instanceof Error ? err.message : t(
        "Could not send the password link. Try again.",
        "تعذر إرسال رابط كلمة المرور. أعد المحاولة.",
      ));
    } finally {
      sending.current = false;
      setBusy(false);
    }
  }

  return { busy, sentTo, error, cooldown, sendLink };
}

export type ChangePasswordState = ReturnType<typeof useChangePassword>;
