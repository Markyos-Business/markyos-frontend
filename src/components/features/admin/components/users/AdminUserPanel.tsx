"use client";

import { useCurrentAccount } from "@/contexts/AppContext";
import { useModalDismiss } from "@/hooks/useModalDismiss";
import { AlertBanner } from "@/components/ui";
import { SelectField } from "@/components/form";
import { ACCOUNT_TYPES, ACCOUNT_TYPE_KEYS } from "@/constants/accountTypes";
import type { AccountType } from "@/types";
import { useAdminUserActions } from "../../hooks/useAdminUserActions";
import type { AdminUser } from "../../types";
import { UserActions } from "./UserActions";
import { UserBrandsList } from "./UserBrandsList";
import { UserSummary } from "./UserSummary";

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
  const actions = useAdminUserActions(user, onChange);
  const isMe = me?.id === user.id;

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
        <UserSummary user={user} onClose={onClose} />

        <AlertBanner message={actions.error} />

        {/* Chosen at signup; correctable here. Admins don't have one. */}
        {user.role !== "admin" && (
          <SelectField
            label="Account type"
            value={user.accountType ?? ""}
            placeholder="No type"
            options={ACCOUNT_TYPE_KEYS.map((key) => ({ value: key, label: ACCOUNT_TYPES[key].label }))}
            disabled={actions.saving}
            onChange={(e) => void actions.changeType(e.target.value as AccountType)}
          />
        )}

        <UserBrandsList userId={user.id} />

        <UserActions user={user} isMe={isMe} actions={actions} />
      </aside>
    </div>
  );
}
