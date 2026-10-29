"use client";

import { Button, ContentCard, DataTable, EmptyState, Icon, Tag } from "@/components/ui";
import type { DataColumn } from "@/components/ui";
import { useAdminLang } from "../../hooks/useAdminLang";
import type { UserActions } from "../../hooks/useUserActions";
import type { UserPage } from "../../hooks/useUserPage";
import type { AdminSession, AdminUser } from "../../types";
import { relativeTime, shortDate } from "../../utils/format";

type SessionsTabProps = { user: AdminUser; sessions: UserPage["sessions"]; actions: UserActions };

/** Each browser the account is signed in on, and signing one or all of them out. */
export function SessionsTab({ user, sessions, actions }: SessionsTabProps) {
  const { c, lang } = useAdminLang();
  const s = c.sessions;
  const columns: DataColumn<AdminSession>[] = [
    {
      key: "device",
      header: s.device,
      sortable: false,
      cell: (row) => (
        <div className="flex items-center gap-space-4">
          <Icon name={row.mobile ? "mobile" : "laptop"} size={18} className="text-text-muted" />
          <span className="font-medium text-text">{sessions.deviceName(row)}</span>
          {row.mobile && <Tag>{s.mobile}</Tag>}
        </div>
      ),
    },
    { key: "ip", header: s.ip, sortable: false, cell: (row) => <span dir="ltr" className="tabular-nums">{row.ip ?? "—"}</span> },
    {
      key: "started",
      header: s.started,
      sortValue: (row) => row.createdAt,
      cell: (row) => <time dateTime={row.createdAt}>{shortDate(row.createdAt, lang)}</time>,
      className: "hidden md:table-cell",
    },
    {
      key: "lastSeen",
      header: s.lastSeen,
      sortValue: (row) => row.lastSeenAt,
      cell: (row) => (
        <time dateTime={row.lastSeenAt} className="text-text-muted">
          {relativeTime(row.lastSeenAt, lang)}
        </time>
      ),
    },
    {
      key: "signOut",
      header: c.confirm.signOut,
      hideHeader: true,
      sortable: false,
      cell: (row) => (
        <Button variant="outline" size="xs" onClick={() => sessions.signOut(row)}>
          {c.confirm.signOut}
        </Button>
      ),
      className: "text-end",
    },
  ];

  return (
    <ContentCard
      title={s.title}
      flush
      controls={
        sessions.data?.length ? (
          <Button variant="danger-soft" size="sm" icon={<Icon name="sign-out-alt" size={16} />} onClick={() => actions.signOutEverywhere(user)}>
            {c.actions.signOutAll}
          </Button>
        ) : undefined
      }
    >
      <DataTable
        label={s.label}
        itemLabel={s.itemLabel}
        columns={columns}
        rows={sessions.data ?? undefined}
        getRowId={(row) => row.id}
        getRowLabel={sessions.deviceName}
        loading={sessions.loading}
        error={sessions.error}
        onRetry={sessions.reload}
        empty={<EmptyState icon="laptop" title={s.emptyTitle} description={s.emptyBody} />}
        stickyHeader={false}
      />
    </ContentCard>
  );
}
