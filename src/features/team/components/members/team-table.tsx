"use client";

import { useState } from "react";
import { Avatar, Badge, DataTable, FormDialog, RadioField } from "@/components/ui";
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
  // The person whose role is being changed, and the role picked in the dialog.
  const [changing, setChanging] = useState<TeamMember | null>(null);
  const [role, setRoleChoice] = useState<TeamMember["role"]>("viewer");

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
      // Shown, not edited here: an owner changes it from the row's ⋯ menu.
      cell: (m) => <Badge tone={ROLE_TONE[m.role]}>{roleName(m.role)}</Badge>,
    },
  ];

  const rowActions = (m: TeamMember): ActionItem[] => {
    const owner = m.role === "owner";
    // Nothing can be done to the owner's own row (it changes by Make owner on someone else), so it has no menu.
    if (owner) return [];
    const who = m.name || m.email;
    return [
      {
        label: t("Change role", "تغيير الدور"),
        icon: "user-shield",
        disabled: owner,
        reason: owner ? t("The owner's role changes by handing the brand to someone else.", "يتغيّر دور المالك بنقل العلامة إلى شخص آخر.") : undefined,
        onSelect: () => { setRoleChoice(m.role); setChanging(m); },
      },
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
    <>
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
    <FormDialog
      open={changing !== null}
      title={changing ? t(`Change ${changing.name || changing.email}'s role`, `تغيير دور ${changing.name || changing.email}`) : ""}
      submitLabel={t("Save role", "حفظ الدور")}
      onClose={() => setChanging(null)}
      onSubmit={() => { if (changing && role !== changing.role) setRole(changing, role); }}
    >
      <RadioField
        label={t("Role", "الدور")}
        orientation="vertical"
        value={role}
        onChange={(v) => setRoleChoice(v as TeamMember["role"])}
        // Owner isn't offered: it moves only by Make owner.
        options={ROLES.filter((r) => r !== "owner").map((r) => ({ value: r, label: roleName(r), disabled: r === "editor" && editorsFull && changing?.role !== "editor" }))}
      />
    </FormDialog>
    </>
  );
}
