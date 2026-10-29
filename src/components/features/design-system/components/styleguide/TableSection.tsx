"use client";

import { useState } from "react";
import { Avatar, Button, DataTable, EmptyState, Icon, StatusDot, Tag, useToast } from "@/components/ui";
import type { DataColumn } from "@/components/ui";
import { initialsFor } from "@/lib/utils";
import { DEMO_USERS } from "../../constants";
import type { DemoUser, StyleGuideCopy } from "../../constants";
import { Demo, GuideSection, StateTabs } from "./GuideParts";
import type { DemoState } from "./GuideParts";

const TableSection = ({ c }: { c: StyleGuideCopy }) => {
  const [state, setState] = useState<DemoState>("ready");
  const [selected, setSelected] = useState<string[]>([]);
  const { showToast } = useToast();
  const t = c.table;
  const admins = DEMO_USERS.filter((u) => u.role === "admin").length;

  const columns: DataColumn<DemoUser>[] = [
    {
      key: "user",
      header: t.user,
      sortValue: (u) => u.name,
      cell: (u) => (
        <div className="flex min-w-0 items-center gap-space-4">
          <Avatar initials={initialsFor(u.name)} size={32} tone={u.role === "admin" ? "accent" : "muted"} />
          <div className="min-w-0">
            <div className="truncate font-medium text-text">{u.name}</div>
            <div dir="ltr" className="truncate text-caption text-text-muted">
              {u.email}
            </div>
          </div>
        </div>
      ),
    },
    { key: "role", header: t.role, sortValue: (u) => u.role, cell: (u) => <Tag tone={u.role === "admin" ? "primary" : "neutral"}>{t.roles[u.role]}</Tag> },
    {
      key: "status",
      header: t.status,
      sortValue: (u) => u.status,
      cell: (u) => <StatusDot tone={u.status === "active" ? "success" : "warning"} label={u.status === "active" ? t.active : t.waiting} />,
    },
    { key: "brands", header: t.brands, sortValue: (u) => u.brands, cell: (u) => u.brands, className: "tabular-nums" },
    { key: "lastActive", header: t.lastActive, sortable: false, cell: (u) => <span className="text-text-muted">{u.lastActive}</span> },
  ];

  return (
    <GuideSection id="table" title={c.sections.table}>
      <StateTabs c={c} value={state} onChange={setState} label={c.sections.table} />
      <Demo name="DataTable">
        <DataTable
          label={t.label}
          itemLabel={t.itemLabel}
          columns={columns}
          rows={state === "loading" ? undefined : state === "empty" ? [] : DEMO_USERS}
          getRowId={(u) => u.id}
          loading={state === "loading"}
          error={state === "error" ? c.tableError : null}
          onRetry={() => setState("ready")}
          empty={<EmptyState icon="user" title={t.emptyTitle} description={t.emptyBody} />}
          onRowClick={(u) => showToast(u.name)}
          rowActions={(u) => [
            { label: t.view, icon: "user", onSelect: () => showToast(u.name) },
            {
              label: t.deactivate,
              icon: "user-slash",
              tone: "danger",
              onSelect: () => showToast(u.name, "danger"),
              disabled: u.role === "admin" && admins <= 1,
              reason: t.lastAdmin,
            },
          ]}
          selectable
          selected={selected}
          onSelectedChange={setSelected}
          bulkActions={(ids, clear) => (
            <Button
              size="sm"
              variant="danger"
              icon={<Icon name="user-slash" size={16} />}
              onClick={() => {
                showToast(`${t.bulkDeactivate}: ${ids.length}`, "danger");
                clear();
              }}
            >
              {t.bulkDeactivate}
            </Button>
          )}
          pageSizes={[3, 5, 10]}
          stickyHeader={false}
        />
      </Demo>
    </GuideSection>
  );
};

export { TableSection };
