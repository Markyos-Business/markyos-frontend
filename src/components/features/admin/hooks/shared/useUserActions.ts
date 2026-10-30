"use client";

import { useState } from "react";
import { useDialog, useToast } from "@/components/ui";
import {
  removeUser,
  resendInvite,
  revokeUserSessions,
  updateUser,
} from "../../services/adminService";
import type { AdminUser } from "../../types";
import { useAdminLang } from "./useAdminLang";

const message = (err: unknown) => (err instanceof Error ? err.message : String(err));

/**
 * What an admin does to one account, from a table row or the account's own
 * page. Each step that loses something asks first and says what; each result
 * is a toast. `onChanged` gets the server's copy, or null once removed.
 */
export function useUserActions(onChanged: (user: AdminUser | null) => void) {
  const { confirm } = useDialog();
  const { showToast } = useToast();
  const { c, isAr } = useAdminLang();
  // The account whose role dialog is open.
  const [roleFor, setRoleFor] = useState<AdminUser | null>(null);

  async function run(work: () => Promise<AdminUser | null>, done: string) {
    try {
      onChanged(await work());
      showToast(done, "success");
    } catch (err) {
      showToast(message(err), "danger");
    }
  }

  async function deactivate(user: AdminUser) {
    const ok = await confirm({
      title: c.confirm.deactivateTitle(user.name),
      body: c.confirm.deactivateBody,
      consequences: user.brandsOwned ? [c.confirm.brandsLocked(user.brandsOwned)] : undefined,
      confirmLabel: c.actions.deactivate,
      tone: "danger",
      isAr,
    });
    if (ok) await run(() => updateUser(user.id, { isActive: false }), c.toasts.deactivated);
  }

  async function reactivate(user: AdminUser) {
    const ok = await confirm({
      title: c.confirm.reactivateTitle(user.name),
      body: c.confirm.reactivateBody,
      confirmLabel: c.actions.reactivate,
      isAr,
    });
    if (ok) await run(() => updateUser(user.id, { isActive: true }), c.toasts.reactivated);
  }

  async function changeRole(user: AdminUser, role: AdminUser["role"]): Promise<string | void> {
    try {
      onChanged(await updateUser(user.id, { role }));
      showToast(c.toasts.roleChanged, "success");
    } catch (err) {
      return message(err);
    }
  }

  async function remove(user: AdminUser) {
    const ok = await confirm({
      title: c.confirm.removeTitle(user.name),
      body: c.confirm.removeBody,
      consequences: [...(user.brandsOwned ? [c.confirm.brandsDeleted(user.brandsOwned)] : []), c.confirm.offTeams],
      confirmLabel: c.actions.remove,
      tone: "danger",
      // Typing their email is the one guard a misclick can't pass.
      confirmPhrase: user.email,
      isAr,
    });
    if (ok)
      await run(async () => {
        await removeUser(user.id);
        return null;
      }, c.toasts.removed);
  }

  async function resend(user: AdminUser) {
    try {
      await resendInvite(user.id);
      showToast(c.toasts.resent, "success");
    } catch (err) {
      showToast(message(err), "danger");
    }
  }

  async function signOutEverywhere(user: AdminUser) {
    const ok = await confirm({
      title: c.confirm.signOutTitle(user.name),
      body: c.confirm.signOutBody,
      confirmLabel: c.actions.signOutAll,
      tone: "danger",
      isAr,
    });
    if (!ok) return;
    await run(async () => {
      await revokeUserSessions(user.id);
      return user;
    }, c.toasts.signedOut);
  }

  return { roleFor, setRoleFor, changeRole, deactivate, reactivate, remove, resend, signOutEverywhere };
}

export type UserActions = ReturnType<typeof useUserActions>;
