import { Button } from "@/components/ui";
import type { AdminUserActions } from "../../hooks/useAdminUserActions";
import type { AdminUser } from "../../types";

type UserActionsProps = { user: AdminUser; isMe: boolean; actions: AdminUserActions };

/** Promote, sign out and deactivate — pinned to the drawer's foot. */
export function UserActions({ user, isMe, actions }: UserActionsProps) {
  return (
    <section className="mt-auto flex flex-col gap-2 border-t border-hairline pt-5">
      {isMe && <p className="text-caption text-text-faint">This is you. Another admin has to change your role or status.</p>}
      <Button variant="outline" onClick={actions.toggleRole} disabled={isMe || actions.saving || user.isSuperuser}>
        {user.role === "admin" ? "Remove admin access" : "Make admin"}
      </Button>
      <Button variant="outline" onClick={actions.signOutEverywhere} disabled={actions.revoking}>
        Sign out everywhere
      </Button>
      <Button variant="outline" onClick={actions.toggleActive} disabled={isMe || actions.saving}>
        {user.isActive ? "Deactivate account" : "Reactivate account"}
      </Button>
    </section>
  );
}
