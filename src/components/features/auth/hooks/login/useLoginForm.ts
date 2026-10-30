"use client";

import { useState, type FormEvent } from "react";
import { useApp } from "@/contexts/AppContext";
import { EMAIL_RE } from "../../constants";
import type { PendingVerification } from "../../types";

type LoginErrors = { email?: string; password?: string; form?: string };

/** The login form's fields, its checks, and the sign-in itself. */
export function useLoginForm() {
  const { login } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [busy, setBusy] = useState(false);
  // Set when the account's email was never confirmed: the form gives way to
  // the code step, and the server has already emailed a fresh code.
  const [pending, setPending] = useState<PendingVerification | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;

    const field: LoginErrors = {};
    if (!EMAIL_RE.test(email.trim())) field.email = "Enter a valid email address.";
    if (!password) field.password = "Enter your password.";
    setErrors(field);
    if (Object.keys(field).length > 0) return;

    setBusy(true);
    const out = await login(email, password, remember);
    setBusy(false);

    if (out.error) setErrors({ form: out.error });
    else if (out.verify) setPending(out.verify);
  }

  const resetHref = `/reset${email.trim() ? `?email=${encodeURIComponent(email.trim())}` : ""}`;

  return {
    email,
    setEmail,
    password,
    setPassword,
    remember,
    setRemember,
    errors,
    busy,
    submit,
    resetHref,
    pending,
    clearPending: () => setPending(null),
  };
}
