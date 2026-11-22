"use client";

import { billingCopy } from "@/features/billing";
import { type FormEvent, useState } from "react";
import { useAccountCopy } from "@/contexts/useAccountCopy";
import { useAppActions } from "@/contexts/AppContext";
import { Button, useToast } from "@/components/ui";
import { ChipPicker, InputField } from "@/components/ui";
import type { TeamRole, Workspace } from "@/types";
import { ROLES, ROLE_LABELS } from "../../constants";

type InviteMemberFormProps = {
  ws: Workspace;
  isAr: boolean;
  canGovern: boolean;
  editorsFull: boolean;
  editorsFullNote: string;
  /** Editors need a plan on this brand: opens the upgrade modal. */
  onUpgrade?: () => void;
  onDone: () => void;
};

/** Adds someone to the brand's team with a role. */
export function InviteMemberForm({ ws, isAr, canGovern, editorsFull, editorsFullNote, onUpgrade, onDone }: InviteMemberFormProps) {
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const copy = useAccountCopy(isAr);
  const { addTeamMember } = useAppActions();
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TeamRole>("editor");
  // A full brand can't take another editor, so the invite falls back to viewer.
  const inviteRole: TeamRole = role === "editor" && editorsFull ? "viewer" : role;

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!canGovern || !name.trim() || !email.trim()) return;
    addTeamMember(ws.id, name.trim(), email.trim(), inviteRole);
    setName("");
    setEmail("");
    onDone();
    showToast(t("Team member added.", "أُضيف عضو إلى الفريق."), "success");
  }

  if (!canGovern) return null;

  return (
    <form onSubmit={submit} className="mk-surface flex flex-col gap-field-stack-compact rounded-card bg-surface-2 p-4">
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <InputField size="sm" aria-label={t("Name", "الاسم")} dir="auto" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("Name", "الاسم")} />
        <InputField size="sm" aria-label={t("Email", "البريد الإلكتروني")} type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" />
      </div>
      <ChipPicker
        value={inviteRole}
        onChange={setRole}
        options={ROLES.map((r) => {
          const full = r === "editor" && editorsFull;
          return { value: r, label: r === "client" ? copy.reviewerLabel : ROLE_LABELS[r][isAr ? "ar" : "en"], disabled: full, title: full ? editorsFullNote : undefined };
        })}
      />
      {editorsFull && (
        <div className="flex flex-wrap items-center gap-ctl-row">
          <p className="text-caption text-text-muted">{editorsFullNote}</p>
          {onUpgrade && (
            <Button type="button" variant="secondary" size="sm" onClick={onUpgrade}>
              {billingCopy(isAr).reason.billing.title}
            </Button>
          )}
        </div>
      )}
      <Button type="submit" variant="primary" size="sm" className="self-start">
        {t("Add to team", "إضافة إلى الفريق")}
      </Button>
    </form>
  );
}
