"use client";

import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { useToast } from "@/components/ui";
import type { Account } from "@/types";
import { setTwoFactor } from "../services/accountService";

/**
 * Two-step sign-in: turning it on or off asks for the password first, in a
 * dialog, so someone at an unlocked laptop can't quietly switch it off.
 */
export function useTwoFactor(account: Account) {
  const { setServerAccount } = useApp();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const enabled = !!account.twoFactorEnabled;

  function close() {
    setOpen(false);
    setPassword("");
  }

  async function submit(): Promise<string | void> {
    if (!password) return "Enter your password.";
    try {
      setServerAccount(await setTwoFactor(!enabled, password));
      setPassword("");
      showToast(enabled ? "Two-step sign-in is off." : "Two-step sign-in is on.", "success");
    } catch (err) {
      return err instanceof Error ? err.message : String(err);
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
