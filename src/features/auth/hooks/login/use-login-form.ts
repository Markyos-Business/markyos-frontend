"use client";

import { useState, type FormEvent } from "react";
import { useApp } from "@/contexts/AppContext";
import { EMAIL_RE } from "../../constants";
import type { LoginFailure, PendingVerification } from "../../types";
import { classifyLoginFailure, loginFailureMessage } from "../../utils/login-failure";
import { useAuthLang } from "../shared/use-auth-lang";

type LoginValidation = { email?: "required" | "invalid"; password?: boolean };

/** The login form's fields, its checks, and the sign-in itself. */
export function useLoginForm() {
  const { c } = useAuthLang();
  const { login } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [validation, setValidation] = useState<LoginValidation>({});
  const [failure, setFailure] = useState<LoginFailure | null>(null);
  const [busy, setBusy] = useState(false);
  // Set when the account's email was never confirmed: the form gives way to
  // the code step, and the server has already emailed a fresh code.
  const [pending, setPending] = useState<PendingVerification | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;

    const field: LoginValidation = {};
    if (!email.trim()) field.email = "required";
    else if (!EMAIL_RE.test(email.trim())) field.email = "invalid";
    if (!password) field.password = true;
    setValidation(field);
    setFailure(null);
    if (Object.keys(field).length > 0) return;

    setBusy(true);
    try {
      const out = await login(email, password, remember);
      if (out.error || out.loginFailure) setFailure(out.loginFailure ?? { kind: "unexpected" });
      else if (out.verify) setPending(out.verify);
    } catch (error) {
      setFailure(classifyLoginFailure(error));
    } finally {
      setBusy(false);
    }
  }

  const resetHref = `/reset${email.trim() ? `?email=${encodeURIComponent(email.trim())}` : ""}`;

  return {
    email,
    setEmail,
    password,
    setPassword,
    remember,
    setRemember,
    errors: {
      email: validation.email === "required" ? c.errors.emailRequired : validation.email ? c.errors.email : undefined,
      password: validation.password ? c.errors.password : undefined,
      form: failure ? loginFailureMessage(failure, c.errors) : undefined,
    },
    busy,
    submit,
    resetHref,
    pending,
    clearPending: () => setPending(null),
  };
}
