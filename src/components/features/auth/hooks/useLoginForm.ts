"use client";

import { useState, type FormEvent } from "react";
import { useApp } from "@/contexts/AppContext";
import { EMAIL_RE } from "../constants";

type LoginErrors = { email?: string; password?: string; form?: string };

/** The login form's fields, its checks, and the sign-in itself. */
export function useLoginForm() {
  const { login } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;

    const field: LoginErrors = {};
    if (!EMAIL_RE.test(email.trim())) field.email = "Enter a valid email address.";
    if (!password) field.password = "Enter your password.";
    setErrors(field);
    if (Object.keys(field).length > 0) return;

    setBusy(true);
    const failed = await login(email, password, remember);
    setBusy(false);

    if (failed) {
      setErrors({ form: failed });
    }
  }

  const resetHref = `/reset${email.trim() ? `?email=${encodeURIComponent(email.trim())}` : ""}`;

  return { email, setEmail, password, setPassword, remember, setRemember, errors, busy, submit, resetHref };
}
