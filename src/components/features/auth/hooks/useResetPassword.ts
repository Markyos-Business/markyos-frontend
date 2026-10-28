"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp } from "@/contexts/AppContext";
import { useToast } from "@/components/ui";
import { API_ENABLED } from "@/lib/api/client";
import { EMAIL_RE } from "../constants";
import type { ResetStep } from "../types";
import { scorePassword } from "../utils/password";

type ResetErrors = { email?: string; token?: string; password?: string; confirm?: string; form?: string };

/**
 * Resetting a forgotten password, in two steps.
 *
 * The honest part is step one. A real product emails a link and tells you
 * nothing about whether the address is registered. Without a backend there is
 * no mail server, so the code is shown on screen — and the screen says that is
 * what is happening, rather than staging a "check your inbox" for a message
 * that will never arrive.
 *
 * With a backend (`API_ENABLED`) it is the real flow: the request step ends on
 * "check your inbox", and the emailed link lands back here with `?token=`,
 * straight on the step that sets the new password.
 */
export function useResetPassword() {
  const { requestPasswordReset, resetPassword } = useApp();
  const { showToast } = useToast();
  const router = useRouter();
  const search = useSearchParams();

  // A token in the URL is the emailed link: skip straight to the new password.
  const linkToken = API_ENABLED ? search.get("token") : null;
  const [step, setStep] = useState<ResetStep>(linkToken ? "confirm" : "request");
  const [email, setEmail] = useState(search.get("email") ?? "");
  const [issued, setIssued] = useState<string | null>(null);
  const [token, setToken] = useState(linkToken ?? "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<ResetErrors>({});
  const [busy, setBusy] = useState(false);

  async function request(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!EMAIL_RE.test(email.trim())) {
      setErrors({ email: "Enter a valid email address." });
      return;
    }
    setErrors({});
    setBusy(true);
    let code: string | null;
    try {
      code = await requestPasswordReset(email);
    } catch {
      setBusy(false);
      setErrors({ form: "We couldn't send the email. Try again shortly." });
      return;
    }
    setBusy(false);
    if (API_ENABLED) {
      setStep("sent");
      return;
    }
    /*
     * The same screen either way.
     *
     * `requestPasswordReset` returns null for an address with no account, and
     * this deliberately does not say so. A reset form that answers "no account
     * with that email" is a way to find out which of someone's addresses are
     * registered here, one guess at a time.
     *
     * So the step always advances. Someone who typed an address that isn't
     * registered gets a code box and no code, which reads as "I must have used
     * the other email" — which is the truth.
     */
    setIssued(code);
    setToken(code ?? "");
    setStep("confirm");
  }

  async function confirmReset(e: FormEvent) {
    e.preventDefault();
    if (busy) return;

    const field: ResetErrors = {};
    if (!token.trim()) {
      field.token = API_ENABLED ? "This page needs the link from your email." : "Enter the code.";
    }
    if (password.length < 8) field.password = "At least 8 characters.";
    else if (scorePassword(password).score === 0) {
      field.password = "That one is too easy to guess — try something longer.";
    }
    if (confirm !== password) field.confirm = "These don't match.";
    setErrors(field);
    if (Object.keys(field).length > 0) return;

    setBusy(true);
    const failed = await resetPassword(token, password);
    setBusy(false);

    if (failed) {
      if (/code|link/i.test(failed)) setErrors(API_ENABLED ? { form: failed } : { token: failed });
      else setErrors({ form: failed });
      return;
    }

    showToast("Password changed. Sign in with the new one.", "success");
    router.push("/login");
  }

  function startOver() {
    setStep("request");
    setErrors({});
  }

  return {
    step,
    setStep,
    startOver,
    email,
    setEmail,
    issued,
    token,
    setToken,
    password,
    setPassword,
    confirm,
    setConfirm,
    errors,
    busy,
    request,
    confirmReset,
  };
}

export type ResetState = ReturnType<typeof useResetPassword>;
