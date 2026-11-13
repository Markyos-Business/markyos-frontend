"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useApp } from "@/contexts/AppContext";
import { useToast } from "@/components/ui";
import type { PendingVerification } from "../../types";
import { useAuthLang } from "../shared/use-auth-lang";

/** Seconds before another code can be asked for: one email has to get a chance to arrive. */
const RESEND_AFTER = 30;

/**
 * The emailed signup code. A right code signs the account in; `onVerified`
 * then decides where it goes (signup: making its first brand; login: the
 * views move on by themselves once the session lands).
 */
export function useVerifyEmail(pending: PendingVerification, onVerified?: () => void) {
  const { c } = useAuthLang();
  const { verifyEmail, resendVerification } = useApp();
  const { showToast } = useToast();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(
    pending.codeSent ? null : c.errors.codeSendFailed
  );
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(pending.codeSent ? RESEND_AFTER : 0);

  useEffect(() => {
    if (wait <= 0) return;
    const t = window.setTimeout(() => setWait((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [wait]);

  async function submit(e?: FormEvent) {
    e?.preventDefault();
    if (busy) return;
    if (code.length !== 6) {
      setError(c.errors.code);
      return;
    }
    setBusy(true);
    setError(null);
    const failed = await verifyEmail(pending, code);
    setBusy(false);
    if (failed) {
      setError(failed);
      setCode("");
      return;
    }
    onVerified?.();
  }

  async function resend() {
    if (wait > 0 || busy) return;
    setError(null);
    const failed = await resendVerification(pending.email, pending.purpose);
    if (failed) {
      setError(failed);
      return;
    }
    setCode("");
    setWait(RESEND_AFTER);
    showToast(c.verify.resent, "success");
  }

  return { email: pending.email, code, setCode, error, busy, wait, submit, resend };
}

export type VerifyEmailState = ReturnType<typeof useVerifyEmail>;
