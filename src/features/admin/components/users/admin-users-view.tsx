"use client";

import { Button, Icon, PageHeader } from "@/components/ui";
import { useAdminLang } from "../../hooks/shared/use-admin-lang";
import { useAdminViewer } from "../../hooks/shared/use-admin-viewer";
import { useBulkUserActions } from "../../hooks/users/use-bulk-user-actions";
import { useInviteUsers } from "../../hooks/users/use-invite-users";
import { useUserActions } from "../../hooks/shared/use-user-actions";
import { useUsersPage } from "../../hooks/users/use-users-page";
import { ChangeRoleDialog } from "../shared/change-role-dialog";
import { InviteUsersDialog } from "./invite-users-dialog";
import { UsersFilters } from "./users-filters";
import { UsersStats } from "./users-stats";
import { UsersTable } from "./users-table";

/** Every account on Markyos: counts, filters, the table, and inviting someone new. */
export function AdminUsersView() {
  const { c } = useAdminLang();
  const page = useUsersPage();
  const viewer = useAdminViewer();
  const actions = useUserActions(page.reload);
  const bulk = useBulkUserActions(page.reload);
  const invite = useInviteUsers(page.reload);

  return (
    <>
      <PageHeader
        breadcrumb={c.breadcrumb}
        title={c.title}
        description={c.description}
        secondaryActions={
          <Button variant="outline" icon={<Icon name="file-export" size={18} />} onClick={page.exportCsv} disabled={page.exporting}>
            {c.export}
          </Button>
        }
        actions={
          <Button variant="primary" icon={<Icon name="user-plus" size={18} />} onClick={() => invite.setOpen(true)}>
            {c.invite}
          </Button>
        }
      />

      <UsersStats stats={page.stats.data} loading={page.stats.loading} />

      <div className="flex flex-col gap-space-5">
        <UsersFilters {...page} />
        <UsersTable
          page={page}
          viewer={viewer}
          activeAdmins={page.stats.data?.users.activeAdmins ?? 1}
          actions={actions}
          bulk={bulk}
          onInvite={() => invite.setOpen(true)}
        />
      </div>

      <InviteUsersDialog invite={invite} />
      {actions.roleFor && (
        <ChangeRoleDialog
          open
          title={c.roleDialog.title(actions.roleFor.name)}
          initial={actions.roleFor.role}
          onClose={() => actions.setRoleFor(null)}
          onSubmit={(role) => actions.changeRole(actions.roleFor!, role)}
        />
      )}
      {bulk.roleFor && (
        <ChangeRoleDialog
          open
          title={c.roleDialog.titleMany(bulk.roleFor.ids.length)}
          initial="member"
          onClose={() => bulk.setRoleFor(null)}
          onSubmit={bulk.changeRole}
        />
      )}
    </>
  );
}
