"use client";

import { useState, type FormEvent } from "react";
import { useApp } from "@/contexts/AppContext";
import { useToast } from "@/components/ui";
import { isPlaintext, scorePassword } from "@/components/features/auth";
import { API_ENABLED } from "@/lib/api/client";
import type { Account } from "@/types";
import type { PasswordErrors } from "../../types";

/** The change-password form on the profile tab. */
export function useChangePassword(account: Account) {
  const { setAccountPassword } = useApp();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<PasswordErrors>({});

  // Every account has one now — registration requires it. What varies is
  // whether it is still stored in the readable form an older build wrote.
  // With a backend the server holds it, so there is nothing local to judge.
  const readable = !API_ENABLED && isPlaintext(account.password);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    const errs: PasswordErrors = {};
    if (!current) errs.current = "Enter your current password.";
    if (next.length < 8) errs.next = "Use at least 8 characters.";
    else if (scorePassword(next).score === 0) errs.next = "That one is too easy to guess.";
    if (next !== confirm) errs.confirm = "These don't match.";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setBusy(true);
    const failed = await setAccountPassword(next, current);
    setBusy(false);
    if (failed) {
      setErrors({ current: failed });
      return;
    }
    setOpen(false);
    setCurrent("");
    setNext("");
    setConfirm("");
    showToast(
      API_ENABLED
        ? "Password changed. Other devices are signed out."
        : "Password changed — it's checked the next time you sign in.",
      "success"
    );
  }

  return {
    readable,
    open,
    toggle: () => setOpen((v) => !v),
    current,
    setCurrent,
    next,
    setNext,
    confirm,
    setConfirm,
    busy,
    errors,
    submit,
  };
}

export type ChangePasswordState = ReturnType<typeof useChangePassword>;
