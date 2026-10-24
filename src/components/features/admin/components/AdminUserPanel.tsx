"use client";

import { useState } from "react";
import { useCurrentAccount } from "@/contexts/AppContext";
import { useModalDismiss } from "@/hooks/useModalDismiss";
import { AlertBanner, Avatar, Button, IconButton, useDialog, useToast, Badge } from "@/components/ui";
import { SelectField } from "@/components/form";
import { ACCOUNT_TYPES, ACCOUNT_TYPE_KEYS } from "@/constants/accountTypes";
import type { AccountType } from "@/types";
import { BRAND_ROLE_LABELS, ROLE_LABELS, ROLE_TONES, STAGE_LABELS, STATUS_LABELS, STATUS_TONES } from "../constants";
import { useAdminUserBrands } from "../hooks/useAdminUserBrands";
import { useRevokeUserSessions } from "../hooks/useRevokeUserSessions";
import { useUpdateAdminUser } from "../hooks/useUpdateAdminUser";
import type { AdminUser, AdminUserPatch } from "../types";
import { formatDate, initialsOf } from "../utils/format";

/** One account: who they are, their brands, and what an admin can do to it. */
export function AdminUserPanel({
  user,
  closing = false,
  onClose,
  onChange,
}: {
  user: AdminUser;
  /** Sliding away: play the exit and take no more clicks. */
  closing?: boolean;
  onClose: () => void;
  onChange: (user: AdminUser) => void;
}) {
  useModalDismiss(onClose);
  const me = useCurrentAccount();
  const { confirm } = useDialog();
  const { showToast } = useToast();
  const brands = useAdminUserBrands(user.id);
  const { update, busy: saving } = useUpdateAdminUser();
  const { revoke, busy: revoking } = useRevokeUserSessions();
  const [error, setError] = useState<string | null>(null);
  const isMe = me?.id === user.id;
  const status = user.isActive ? "active" : "inactive";

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

  return (
    <div className={`fixed inset-0 z-modal flex justify-end ${closing ? "pointer-events-none" : ""}`}>
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className={`absolute inset-0 cursor-default bg-scrim ${closing ? "animate-fade-out" : "animate-fade-in"}`}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={user.name}
        className={`relative flex h-full w-full max-w-[420px] flex-col gap-space-8 overflow-y-auto bg-surface-1 p-space-10 shadow-edge-modal ${
          closing ? "animate-fade-out" : "animate-fade-in"
        }`}
      >
        <div className="flex items-start gap-3">
          <Avatar initials={initialsOf(user.name)} size={44} />
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-h5 font-medium">{user.name}</h2>
            <p className="truncate text-caption text-text-muted">{user.email}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Badge tone={ROLE_TONES[user.role]}>{user.isSuperuser ? "Superuser" : ROLE_LABELS[user.role]}</Badge>
              <Badge tone={STATUS_TONES[status]}>{STATUS_LABELS[status]}</Badge>
              {user.twoFactorEnabled && <Badge>2FA on</Badge>}
            </div>
          </div>
          <IconButton icon="times" label="Close" onClick={onClose} />
        </div>

        <dl className="grid grid-cols-2 gap-3 text-caption">
          <div>
            <dt className="text-text-faint">Joined</dt>
            <dd className="font-medium">{formatDate(user.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-text-faint">Last signed in</dt>
            <dd className="font-medium">{user.lastLoginAt ? formatDate(user.lastLoginAt) : "Never"}</dd>
          </div>
        </dl>

        <AlertBanner message={error} />

        {/* Chosen at signup; correctable here. Admins don't have one. */}
        {user.role !== "admin" && (
          <SelectField
            label="Account type"
            value={user.accountType ?? ""}
            placeholder="No type"
            options={ACCOUNT_TYPE_KEYS.map((key) => ({ value: key, label: ACCOUNT_TYPES[key].label }))}
            disabled={saving}
            onChange={(e) => void changeType(e.target.value as AccountType)}
          />
        )}

        <section className="flex flex-col gap-2.5">
          <h3 className="text-body font-medium">Brands</h3>
          {brands.loading && !brands.data ? (
            <p className="text-caption text-text-faint">Loading…</p>
          ) : brands.data?.length ? (
            <ul className="flex flex-col">
              {brands.data.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-space-4 py-space-4 shadow-rule-t first:shadow-none">
                  <div className="min-w-0">
                    <div className="truncate text-body font-medium">{b.name}</div>
                    <div className="text-caption text-text-faint">{STAGE_LABELS[b.stage || "none"] ?? b.stage}</div>
                  </div>
                  <Badge tone={b.role === "owner" ? "accent" : "neutral"}>{BRAND_ROLE_LABELS[b.role]}</Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-caption text-text-faint">{brands.error ?? "No brands yet."}</p>
          )}
        </section>

        <section className="mt-auto flex flex-col gap-2 border-t border-hairline pt-5">
          {isMe && (
            <p className="text-caption text-text-faint">This is you. Another admin has to change your role or status.</p>
          )}
          <Button variant="outline" onClick={toggleRole} disabled={isMe || saving || user.isSuperuser}>
            {user.role === "admin" ? "Remove admin access" : "Make admin"}
          </Button>
          <Button variant="outline" onClick={signOutEverywhere} disabled={revoking}>
            Sign out everywhere
          </Button>
          <Button variant="outline" onClick={toggleActive} disabled={isMe || saving}>
            {user.isActive ? "Deactivate account" : "Reactivate account"}
          </Button>
        </section>
      </aside>
    </div>
  );
}
