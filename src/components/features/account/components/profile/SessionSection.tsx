"use client";

import { useApp } from "@/contexts/AppContext";
import { Button, DataTable, Icon, Row, Section, Tag, useToast } from "@/components/ui";
import type { DataColumn } from "@/components/ui";
import { API_ENABLED } from "@/lib/api/client";
import { formatRelative } from "@/lib/utils";
import type { Account } from "@/types";
import type { MySessionsState } from "../../hooks/useMySessions";
import type { MySession } from "../../types";

type SessionSectionProps = { account: Account; sessions: MySessionsState };

/** Every browser you're signed in on: sign one out, the others, or this one. */
export function SessionSection({ account, sessions }: SessionSectionProps) {
  const { logout } = useApp();
  const { showToast } = useToast();
  const signOutHere = () => {
    logout();
    showToast("Signed out.");
  };

  // The browser-only build has one session: this tab's.
  if (!API_ENABLED) {
    return (
      <Section title="Session" icon="lock">
        <Row
          label="Signed in"
          hint={`Since this browser last authenticated${account.createdAt ? ` · account created ${formatRelative(account.createdAt)}` : ""}.`}
          right={
            <Button variant="outline" size="sm" icon={<Icon name="sign-out-alt" size={16} />} onClick={signOutHere}>
              Sign out
            </Button>
          }
        />
      </Section>
    );
  }

  const columns: DataColumn<MySession>[] = [
    {
      key: "device",
      header: "Device",
      sortable: false,
      cell: (s) => (
        <div className="flex flex-wrap items-center gap-space-4">
          <Icon name={s.mobile ? "mobile" : "laptop"} size={18} className="text-text-muted" />
          <span className="font-medium text-text">{sessions.deviceName(s)}</span>
          {s.current && <Tag tone="primary">This browser</Tag>}
        </div>
      ),
    },
    { key: "ip", header: "IP address", sortable: false, cell: (s) => <span dir="ltr">{s.ip ?? "—"}</span>, className: "hidden md:table-cell" },
    {
      key: "lastSeen",
      header: "Last active",
      sortable: false,
      cell: (s) => <span className="text-text-muted">{s.current ? "Now" : formatRelative(Date.parse(s.lastSeenAt))}</span>,
    },
    {
      key: "action",
      header: "Sign out",
      hideHeader: true,
      sortable: false,
      className: "text-end",
      cell: (s) => (
        <Button variant="outline" size="xs" onClick={() => (s.current ? signOutHere() : sessions.signOut(s))}>
          Sign out
        </Button>
      ),
    },
  ];

  return (
    <Section
      title="Sessions"
      icon="lock"
      right={
        sessions.others > 0 ? (
          <Button variant="danger-soft" size="sm" onClick={sessions.signOutOthers}>
            Sign out of other browsers
          </Button>
        ) : undefined
      }
    >
      <DataTable
        label="Signed-in browsers"
        itemLabel="sessions"
        columns={columns}
        rows={sessions.data ?? undefined}
        getRowId={(s) => s.id}
        getRowLabel={sessions.deviceName}
        loading={sessions.loading}
        error={sessions.error}
        onRetry={sessions.reload}
        empty={<p className="p-space-6 text-caption text-text-muted">Only this browser is signed in.</p>}
        stickyHeader={false}
      />
    </Section>
  );
}
