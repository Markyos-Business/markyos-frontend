"use client";

import { Avatar, Badge, DataTable, FilterSelectField } from "@/components/ui";
import type { ActionItem, DataColumn } from "@/components/ui";
import { initialsFor } from "@/lib/utils";
import type { TeamMember, Workspace } from "@/types";
import { ROLES, ROLE_TONE } from "../../constants";
import { useMemberActions } from "../../hooks/use-member-actions";

type TeamTableProps = { ws: Workspace; isAr: boolean; canGovern: boolean; editorsFull: boolean };

/**
 * The brand's people as a table: who they are and their role. An owner picks
 * the role in the row and finds Make owner and Remove in the row's menu; anyone
 * else sees the role as a badge.
 */
export function TeamTable({ ws, isAr, canGovern, editorsFull }: TeamTableProps) {
  const { roleName, transfer, remove, setRole } = useMemberActions(ws, isAr);
  const t = (en: string, ar: string) => (isAr ? ar : en);

  const columns: DataColumn<TeamMember>[] = [
    {
      key: "person",
      header: t("Person", "الشخص"),
      sortValue: (m) => m.name || m.email,
      cell: (m) => (
        <div className="flex min-w-0 items-center gap-space-4">
          <Avatar initials={initialsFor(m.name || m.email)} size={32} />
          <div className="min-w-0">
            <div dir="auto" className="truncate font-medium text-text">{m.name || m.email}</div>
            <div dir="ltr" className="truncate text-start text-caption text-text-muted">{m.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: t("Role", "الدور"),
      sortValue: (m) => ROLES.indexOf(m.role),
      width: 200,
      cell: (m) =>
        canGovern ? (
          <FilterSelectField
            label={isAr ? `دور ${m.name || m.email}` : `Role for ${m.name || m.email}`}
            hideLabel
            size="sm"
            value={m.role}
            // The owner is set by handing the brand over (Make owner on
            // someone else), not by this picker.
            disabled={m.role === "owner"}
            onChange={(value) => setRole(m, value as TeamMember["role"])}
            options={ROLES.map((r) => ({ value: r, label: roleName(r), disabled: r === "editor" && editorsFull && m.role !== "editor" }))}
          />
        ) : (
          <Badge tone={ROLE_TONE[m.role]}>{roleName(m.role)}</Badge>
        ),
    },
  ];

  const rowActions = (m: TeamMember): ActionItem[] => {
    const owner = m.role === "owner";
    const who = m.name || m.email;
    return [
      {
        label: t("Make owner", "تعيين مالكًا"),
        icon: "key",
        disabled: owner,
        reason: owner ? (isAr ? `${who} يملك ${ws.name} بالفعل` : `${who} already owns ${ws.name}`) : undefined,
        onSelect: () => void transfer(m),
      },
      {
        label: t("Remove from brand", "إزالة من العلامة"),
        icon: "user-slash",
        tone: "danger",
        disabled: owner,
        reason: owner ? t("The owner can't be removed, only replaced.", "لا يمكن إزالة المالك، بل استبداله فقط.") : undefined,
        onSelect: () => void remove(m),
      },
    ];
  };

  return (
    <DataTable
      label={t("Team", "الفريق")}
      itemLabel={t("people", "أشخاص")}
      columns={columns}
      rows={ws.team}
      getRowId={(m) => m.id}
      getRowLabel={(m) => m.name || m.email}
      rowActions={canGovern ? rowActions : undefined}
      stickyHeader={false}
    />
  );
}
