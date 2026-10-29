"use client";

import { useState } from "react";
import { useDialog, useToast } from "@/components/ui";
import { bulkUpdate } from "../services/adminService";
import type { AdminBulkAction, AdminUser } from "../types";
import { useAdminLang } from "./useAdminLang";

/**
 * The selection bar's actions. The server applies each account in turn with
 * the same guards as one at a time, and names any it refused.
 */
export function useBulkUserActions(onDone: () => void) {
  const { confirm } = useDialog();
  const { showToast } = useToast();
  const { c, isAr } = useAdminLang();
  // The selection the role dialog is open for.
  const [roleFor, setRoleFor] = useState<{ ids: string[]; clear: () => void } | null>(null);

  async function apply(ids: string[], action: AdminBulkAction, clear: () => void, role?: AdminUser["role"]) {
    try {
      const result = await bulkUpdate(ids, action, role);
      if (result.done.length) showToast(c.toasts.bulkDone(result.done.length), "success");
      if (result.refused.length) showToast(c.toasts.bulkRefused(result.refused.map((r) => r.email).join(", ")), "danger");
      clear();
      onDone();
    } catch (err) {
      showToast(err instanceof Error ? err.message : String(err), "danger");
    }
  }

  async function deactivate(ids: string[], clear: () => void) {
    const ok = await confirm({
      title: c.confirm.deactivateMany(ids.length),
      body: c.confirm.deactivateBody,
      confirmLabel: c.actions.deactivate,
      tone: "danger",
      isAr,
    });
    if (ok) await apply(ids, "deactivate", clear);
  }

  async function reactivate(ids: string[], clear: () => void) {
    const ok = await confirm({
      title: c.confirm.reactivateMany(ids.length),
      body: c.confirm.reactivateBody,
      confirmLabel: c.actions.reactivate,
      isAr,
    });
    if (ok) await apply(ids, "reactivate", clear);
  }

  async function remove(ids: string[], clear: () => void) {
    const ok = await confirm({
      title: c.confirm.removeMany(ids.length),
      body: c.confirm.removeBody,
      consequences: [c.confirm.offTeams],
      confirmLabel: c.actions.remove,
      tone: "danger",
      confirmPhrase: c.confirm.removePhrase,
      isAr,
    });
    if (ok) await apply(ids, "remove", clear);
  }

  async function changeRole(role: AdminUser["role"]): Promise<string | void> {
    if (!roleFor) return;
    await apply(roleFor.ids, "role", roleFor.clear, role);
  }

  return { roleFor, setRoleFor, changeRole, deactivate, reactivate, remove };
}
