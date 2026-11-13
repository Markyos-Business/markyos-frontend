"use client";

import { FormDialog } from "@/components/ui";
import { CheckboxField, InputField, RadioField } from "@/components/ui";
import type { Workspace } from "@/types";
import { MEMBER_ROLES } from "../../constants";
import { usePeopleLang } from "../../hooks/use-people-lang";
import type { InvitePeopleState } from "../../hooks/invite/use-invite-people";
import type { MemberRole } from "../../types";

type InvitePeopleDialogProps = { invite: InvitePeopleState; owned: Workspace[] };

/** An email, a role, and which of your brands they join. */
export function InvitePeopleDialog({ invite, owned }: InvitePeopleDialogProps) {
  const { c } = usePeopleLang();
  const d = c.inviteDialog;
  return (
    <FormDialog open={invite.open} title={d.title} description={d.description} submitLabel={d.submit} onClose={invite.close} onSubmit={invite.submit}>
      <InputField
        label={d.emails}
        type="email"
        inputMode="email"
        autoComplete="off"
        dir="ltr"
        required
        placeholder="omar@wadirum.coffee"
        value={invite.email}
        error={invite.errors.emails}
        onChange={(e) => invite.setEmail(e.target.value)}
        autoFocus
      />
      <InputField label={d.name} hint={d.nameHint} dir="auto" value={invite.name} onChange={(e) => invite.setName(e.target.value)} />
      <RadioField
        label={d.role}
        value={invite.role}
        onChange={(v) => invite.setRole(v as MemberRole)}
        error={invite.errors.role}
        options={MEMBER_ROLES.map((r) => ({ value: r, label: c.roleHelp[r] }))}
      />
      <fieldset className="flex flex-col gap-space-3">
        <legend className="mb-space-3 text-caption text-text-muted">{d.brands}</legend>
        {owned.map((w) => (
          <CheckboxField
            key={w.id}
            label={<span dir="auto">{w.name}</span>}
            checked={invite.brands.includes(w.id)}
            onChange={() => invite.toggleBrand(w.id)}
          />
        ))}
        {invite.errors.brands && (
          <span role="alert" className="text-caption text-danger">
            {invite.errors.brands}
          </span>
        )}
      </fieldset>
    </FormDialog>
  );
}
