"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/contexts/AppContext";
import { useToast } from "@/components/ui";
import type { Account } from "@/types";
import { deleteMyAccount } from "../services/accountService";

/**
 * Deleting the account, at once and for good. The dialog names what goes with
 * it: the brands they own, and how many people lose access to them.
 */
export function useDeleteAccount(account: Account) {
  const { myWorkspaces, logout } = useApp();
  const { showToast } = useToast();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [proof, setProof] = useState("");
  const hasPassword = account.hasPassword !== false;

  const owned = myWorkspaces.filter((w) => w.ownerAccountId === account.id);
  const people = new Set(
    owned.flatMap((w) => w.team.map((m) => m.email.toLowerCase())).filter((e) => e !== account.email.toLowerCase())
  ).size;

  function close() {
    setOpen(false);
    setProof("");
  }

  async function submit(): Promise<string | void> {
    if (!proof.trim()) return hasPassword ? "Enter your password." : "Type your email to confirm.";
    try {
      await deleteMyAccount(hasPassword ? { password: proof } : { email: proof.trim() });
    } catch (err) {
      return err instanceof Error ? err.message : String(err);
    }
    logout();
    showToast("Your account has been deleted.", "success");
    router.replace("/login");
  }

  return { open, start: () => setOpen(true), close, proof, setProof, hasPassword, ownedCount: owned.length, people, submit };
}

export type DeleteAccountState = ReturnType<typeof useDeleteAccount>;
