"use client";

import { FormDialog } from "@/components/ui";
import { SelectField, TextareaField } from "@/components/form";
import { ACCOUNT_TYPE_KEYS } from "@/constants/accountTypes";
import type { AccountRole, AccountType } from "@/types";
import { useAdminLang } from "../../hooks/useAdminLang";
import type { useInviteUsers } from "../../hooks/useInviteUsers";

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
      <TextareaField
        label={d.emails}
        dir="ltr"
        rows={3}
        placeholder="omar@wadirum.coffee, layla@najd.sa"
        value={form.emails}
        error={invite.emailError}
        hint={d.emailsHint}
        onChange={(e) => set("emails", e.target.value)}
        autoFocus
      />
      <div className="grid gap-space-5 sm:grid-cols-2">
        <SelectField
          label={d.role}
          value={form.role}
          onChange={(e) => set("role", e.target.value as AccountRole)}
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
            onChange={(e) => set("accountType", e.target.value as AccountType)}
            options={ACCOUNT_TYPE_KEYS.map((key) => ({ value: key, label: c.types[key] }))}
          />
        )}
        <SelectField
          label={d.language}
          value={form.language}
          onChange={(e) => set("language", e.target.value as "en" | "ar" | "")}
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
