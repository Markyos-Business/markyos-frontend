"use client";

import { useRouter } from "next/navigation";
import { Avatar, Button, DataTable, EmptyState, Icon, StatusDot, Tag } from "@/components/ui";
import type { ActionItem, DataColumn } from "@/components/ui";
import { STATUS_TONE } from "../../constants";
import { useAdminLang } from "../../hooks/useAdminLang";
import type { useBulkUserActions } from "../../hooks/useBulkUserActions";
import type { UserActions } from "../../hooks/useUserActions";
import type { useUsersPage } from "../../hooks/useUsersPage";
import type { AdminUser } from "../../types";
import { initialsOf, relativeTime } from "../../utils/format";
import { rulesFor } from "../../utils/rules";
import type { Rule, Viewer } from "../../utils/rules";

type UsersTableProps = {
  page: ReturnType<typeof useUsersPage>;
  viewer: Viewer;
  activeAdmins: number;
  actions: UserActions;
  bulk: ReturnType<typeof useBulkUserActions>;
  onInvite: () => void;
};

/** Every account the filters match, a page at a time, with row and bulk actions. */
export function UsersTable({ page, viewer, activeAdmins, actions, bulk, onInvite }: UsersTableProps) {
  const router = useRouter();
  const { c, lang } = useAdminLang();
  const t = c.table;
  const open = (u: AdminUser) => router.push(`/admin/users/${u.id}`);
  // A refused action stays in the menu, disabled, with its reason as the tooltip.
  const gate = (rule: Rule) => (rule.allowed ? {} : { disabled: true, reason: c.reasons[rule.reason] });

  const columns: DataColumn<AdminUser>[] = [
    {
      key: "user",
      header: t.user,
      sortable: true,
      cell: (u) => (
        <div className="flex min-w-0 items-center gap-space-4">
          <Avatar initials={initialsOf(u.name || u.email)} src={u.avatarUrl} size={32} tone={u.isAdmin ? "accent" : "muted"} />
          <div className="min-w-0">
            <div dir="auto" className="truncate font-medium text-text">
              {u.name}
              {u.id === viewer.id && <span className="ms-space-3 text-caption text-text-muted">({t.you})</span>}
            </div>
            <div dir="ltr" className="truncate text-caption text-text-muted">
              {u.email}
            </div>
          </div>
        </div>
      ),
    },
    { key: "role", header: t.role, sortable: true, cell: (u) => <Tag tone={u.isAdmin ? "primary" : "neutral"}>{c.roles[u.role]}</Tag> },
    { key: "status", header: t.status, sortable: true, cell: (u) => <StatusDot tone={STATUS_TONE[u.status]} label={c.statuses[u.status]} /> },
    { key: "type", header: t.type, sortable: false, cell: (u) => c.types[u.accountType ?? "none"], className: "hidden lg:table-cell" },
    {
      key: "language",
      header: t.language,
      sortable: false,
      cell: (u) => <span dir="ltr">{u.language ? c.locales[u.language] : "—"}</span>,
      className: "hidden xl:table-cell",
    },
    {
      key: "lastActive",
      header: t.lastActive,
      sortable: true,
      cell: (u) =>
        u.lastLoginAt ? (
          <time dateTime={u.lastLoginAt} title={new Date(u.lastLoginAt).toLocaleString()} className="text-text-muted">
            {relativeTime(u.lastLoginAt, lang)}
          </time>
        ) : (
          <span className="text-text-muted">{t.never}</span>
        ),
    },
    {
      key: "brands",
      header: t.brands,
      sortable: true,
      cell: (u) => u.brandsOwned + u.brandsMember,
      className: "hidden md:table-cell tabular-nums",
    },
  ];

  const rowActions = (u: AdminUser): ActionItem[] => {
    const rules = rulesFor(u, viewer, activeAdmins);
    return [
      { label: c.actions.view, icon: "user", onSelect: () => open(u) },
      { label: c.actions.changeRole, icon: "user-shield", onSelect: () => actions.setRoleFor(u), ...gate(rules.changeRole) },
      ...(u.status === "waiting"
        ? [{ label: c.actions.resend, icon: "envelope", onSelect: () => actions.resend(u) } satisfies ActionItem]
        : []),
      u.isActive
        ? { label: c.actions.deactivate, icon: "user-slash", tone: "warning", onSelect: () => actions.deactivate(u), ...gate(rules.deactivate) }
        : { label: c.actions.reactivate, icon: "user-check", tone: "success", onSelect: () => actions.reactivate(u), ...gate(rules.reactivate) },
      { label: c.actions.remove, icon: "trash", tone: "danger", onSelect: () => actions.remove(u), ...gate(rules.remove) },
    ];
  };

  const empty = page.filtered ? (
    <EmptyState
      icon="search"
      title={c.empty.noMatchTitle(page.values.q)}
      description={c.empty.noMatchBody}
      action={
        <Button variant="outline" size="sm" onClick={page.clearFilters}>
          {c.empty.clear}
        </Button>
      }
    />
  ) : (
    <EmptyState
      icon="users"
      title={c.empty.noUsersTitle}
      description={c.empty.noUsersBody}
      action={
        <Button variant="primary" size="sm" icon={<Icon name="user-plus" size={18} />} onClick={onInvite}>
          {c.invite}
        </Button>
      }
    />
  );

  return (
    <DataTable
      label={t.label}
      itemLabel={t.itemLabel}
      columns={columns}
      rows={page.users.data?.results}
      getRowId={(u) => u.id}
      getRowLabel={(u) => u.name || u.email}
      loading={page.users.loading}
      error={page.users.error}
      onRetry={page.reload}
      empty={empty}
      onRowClick={open}
      rowActions={rowActions}
      selectable
      selected={page.selected}
      onSelectedChange={page.setSelected}
      bulkActions={(ids, clear) => (
        <>
          <Button size="sm" variant="outline" icon={<Icon name="user-shield" size={16} />} onClick={() => bulk.setRoleFor({ ids, clear })}>
            {c.actions.changeRole}
          </Button>
          <Button size="sm" variant="outline" icon={<Icon name="user-check" size={16} />} onClick={() => bulk.reactivate(ids, clear)}>
            {c.actions.reactivate}
          </Button>
          <Button size="sm" variant="outline" icon={<Icon name="user-slash" size={16} />} onClick={() => bulk.deactivate(ids, clear)}>
            {c.actions.deactivate}
          </Button>
          <Button size="sm" variant="danger" icon={<Icon name="trash" size={16} />} onClick={() => bulk.remove(ids, clear)}>
            {c.actions.remove}
          </Button>
        </>
      )}
      sort={page.sort}
      onSortChange={page.setSort}
      paging={page.paging}
    />
  );
}
