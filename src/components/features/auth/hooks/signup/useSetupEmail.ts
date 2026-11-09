"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { useToast } from "@/components/ui";
import type { PasswordSetup } from "../../types";
import { useAuthLang } from "../shared/useAuthLang";

/** Seconds before another link can be asked for: one email has to get a chance to arrive. */
const RESEND_AFTER = 30;

/**
 * The "set your password" email a new account is waiting for, and sending it
 * again. Resending is the forgot-password request: for an account that has
 * never had a password, the server words that email as setting one.
 */
export function useSetupEmail(setup: PasswordSetup) {
  const { c } = useAuthLang();
  const { requestPasswordReset } = useApp();
  const { showToast } = useToast();
  const [error, setError] = useState<string | null>(
    setup.emailSent ? null : c.errors.sendFailedBelow
  );
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(setup.emailSent ? RESEND_AFTER : 0);

  useEffect(() => {
    if (wait <= 0) return;
    const t = window.setTimeout(() => setWait((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [wait]);

  async function resend() {
    if (wait > 0 || busy) return;
    setBusy(true);
    setError(null);
    try {
      await requestPasswordReset(setup.email);
      setWait(RESEND_AFTER);
      showToast(c.sent.resent, "success");
    } catch {
      setError(c.errors.sendFailed);
    } finally {
      setBusy(false);
    }
  }

  return { email: setup.email, error, busy, wait, resend };
}
