"use client";

import { useState } from "react";
import { FormDialog } from "@/components/ui";
import { RadioField } from "@/components/form";
import type { AccountRole } from "@/types";
import { useAdminLang } from "../../hooks/useAdminLang";

type ChangeRoleDialogProps = {
  open: boolean;
  title: string;
  /** The role it opens on: the account's own, or member for a selection. */
  initial: AccountRole;
  onClose: () => void;
  /** Resolve to a message to keep the dialog open and show it. */
  onSubmit: (role: AccountRole) => Promise<string | void>;
};

/** Admin or member, each with a line on what it means. One account or a selection. */
export function ChangeRoleDialog({ open, title, initial, onClose, onSubmit }: ChangeRoleDialogProps) {
  const { c } = useAdminLang();
  const [role, setRole] = useState<AccountRole>(initial);
  return (
    <FormDialog open={open} title={title} submitLabel={c.roleDialog.submit} onClose={onClose} onSubmit={() => onSubmit(role)}>
      <RadioField
        label={c.roleDialog.label}
        value={role}
        onChange={(v) => setRole(v as AccountRole)}
        options={[
          { value: "member", label: c.roleDialog.help.member },
          { value: "admin", label: c.roleDialog.help.admin },
        ]}
      />
    </FormDialog>
  );
}
