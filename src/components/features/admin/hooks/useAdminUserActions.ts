"use client";

import { useState } from "react";
import { useDialog, useToast } from "@/components/ui";
import { ACCOUNT_TYPES } from "@/constants/accountTypes";
import type { AccountType } from "@/types";
import type { AdminUser, AdminUserPatch } from "../types";
import { useRevokeUserSessions } from "./useRevokeUserSessions";
import { useUpdateAdminUser } from "./useUpdateAdminUser";

/**
 * What an admin can do to one account, each behind a confirm that says what
 * happens. `onChange` gets the server's copy after every save.
 */
export function useAdminUserActions(user: AdminUser, onChange: (user: AdminUser) => void) {
  const { confirm } = useDialog();
  const { showToast } = useToast();
  const { update, busy: saving } = useUpdateAdminUser();
  const { revoke, busy: revoking } = useRevokeUserSessions();
  const [error, setError] = useState<string | null>(null);

  async function apply(patch: AdminUserPatch, done: string) {
    setError(null);
    try {
      onChange(await update(user.id, patch));
      showToast(done, "success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "That didn't save.");
    }
  }

  async function toggleActive() {
    if (user.isActive) {
      const ok = await confirm({
        title: `Deactivate ${user.name}?`,
        body: "They are signed out everywhere and can't sign in until an admin reactivates them.",
        consequences: [
          `${user.brandsOwned} brand${user.brandsOwned === 1 ? "" : "s"} they own stay stored but nobody can open them`,
          "Their teammates keep access to brands they don't own",
        ],
        confirmLabel: "Deactivate",
        tone: "danger",
      });
      if (!ok) return;
    }
    await apply({ isActive: !user.isActive }, user.isActive ? "Account deactivated" : "Account reactivated");
  }

  async function toggleRole() {
    const promote = user.role !== "admin";
    const ok = await confirm({
      title: promote ? `Make ${user.name} an admin?` : `Remove ${user.name}'s admin access?`,
      body: promote
        ? "Admins see every account on Markyos and can deactivate or promote them."
        : "They keep their account and brands, but lose this admin area.",
      confirmLabel: promote ? "Make admin" : "Remove admin",
      tone: promote ? "neutral" : "danger",
    });
    if (!ok) return;
    await apply({ role: promote ? "admin" : "member" }, promote ? "Now an admin" : "Admin access removed");
  }

  async function changeType(next: AccountType) {
    if (next === user.accountType) return;
    const limits = ACCOUNT_TYPES[next].limits;
    const ok = await confirm({
      title: `Make ${user.name} a ${ACCOUNT_TYPES[next].label.toLowerCase()} account?`,
      body: "Their plans, prices and limits change to match. Nothing they already have is removed.",
      consequences: [
        limits.brands === null ? "No limit on brands" : `New brands stop at ${limits.brands} owned (they own ${user.brandsOwned})`,
        limits.editors === 0 ? "No new editors on their brands" : "Editors as before",
      ],
      confirmLabel: "Change type",
    });
    if (!ok) return;
    await apply({ accountType: next }, `Now a ${ACCOUNT_TYPES[next].label.toLowerCase()} account`);
  }

  async function signOutEverywhere() {
    const ok = await confirm({
      title: `Sign ${user.name} out everywhere?`,
      body: "Every device they're signed in on has to sign in again within 15 minutes.",
      confirmLabel: "Sign out everywhere",
    });
    if (!ok) return;
    setError(null);
    try {
      await revoke(user.id);
      showToast("Signed out everywhere", "success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "That didn't work.");
    }
  }

  return { error, saving, revoking, toggleActive, toggleRole, changeType, signOutEverywhere };
}

export type AdminUserActions = ReturnType<typeof useAdminUserActions>;
