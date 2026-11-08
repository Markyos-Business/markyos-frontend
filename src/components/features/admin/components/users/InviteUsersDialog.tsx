"use client";

import { FormDialog } from "@/components/ui";
import { EmailChipsField, SelectField } from "@/components/form";
import { ACCOUNT_TYPE_KEYS } from "@/constants/accountTypes";
import type { AccountRole, AccountType } from "@/types";
import { useAdminLang } from "../../hooks/shared/useAdminLang";
import type { useInviteUsers } from "../../hooks/users/useInviteUsers";

type InviteUsersDialogProps = { invite: ReturnType<typeof useInviteUsers> };

/** Emails, a role, an account type and a language; each email becomes a waiting account. */
export function InviteUsersDialog({ invite }: InviteUsersDialogProps) {
  const { c } = useAdminLang();
  const d = c.inviteDialog;
  const { form, set } = invite;
  return (
    <FormDialog
      open={invite.open}
      title={d.title}
      description={d.description}
      submitLabel={d.submit}
      onClose={invite.close}
      onSubmit={invite.submit}
    >
      <EmailChipsField
        label={d.emails}
        placeholder="omar@wadirum.coffee, layla@najd.sa"
        value={form.emails}
        error={invite.emailError}
        hint={d.emailsHint}
        onChange={(emails) => set("emails", emails)}
        autoFocus
      />
      <div className="grid gap-space-5 sm:grid-cols-2">
        <SelectField
          label={d.role}
          value={form.role}
          onChange={(value) => set("role", value as AccountRole)}
          options={[
            { value: "member", label: c.roles.member },
            { value: "admin", label: c.roles.admin },
          ]}
        />
        {/* Admins have no account type: it sets a customer's plans and limits. */}
        {form.role === "member" && (
          <SelectField
            label={d.type}
            value={form.accountType}
            onChange={(value) => set("accountType", value as AccountType)}
            options={ACCOUNT_TYPE_KEYS.map((key) => ({ value: key, label: c.types[key] }))}
          />
        )}
        <SelectField
          label={d.language}
          value={form.language}
          onChange={(value) => set("language", value as "en" | "ar" | "")}
          options={[
            { value: "", label: c.filters.followsBrand },
            { value: "en", label: c.locales.en },
            { value: "ar", label: c.locales.ar },
          ]}
        />
      </div>
    </FormDialog>
  );
}
