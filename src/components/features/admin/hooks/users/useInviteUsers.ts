"use client";

import { useState } from "react";
import { useToast } from "@/components/ui";
import type { AccountRole, AccountType } from "@/types";
import { inviteUser } from "../../services/adminService";
import { parseEmails } from "@/lib/emailList";
import { useAdminLang } from "../shared/useAdminLang";

const MAX_INVITES = 20;

type InviteForm = { emails: string; role: AccountRole; accountType: AccountType | ""; language: "en" | "ar" | "" };

const EMPTY: InviteForm = { emails: "", role: "member", accountType: "studio", language: "" };

/** The invite dialog: one account per email, each waiting for its emailed link. */
export function useInviteUsers(onInvited: () => void) {
  const { showToast } = useToast();
  const { c } = useAdminLang();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<InviteForm>(EMPTY);
  const [emailError, setEmailError] = useState<string | undefined>();

  const set = <K extends keyof InviteForm>(key: K, value: InviteForm[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (key === "emails") setEmailError(undefined);
  };

  function close() {
    setOpen(false);
    setForm(EMPTY);
    setEmailError(undefined);
  }

  /** Resolves to a message to keep the dialog open, `false` for a field error. */
  async function submit(): Promise<string | false | void> {
    const { emails, invalid } = parseEmails(form.emails);
    const fieldError = invalid.length
      ? c.inviteDialog.emailInvalid(invalid[0])
      : emails.length === 0
        ? c.inviteDialog.emailsRequired
        : emails.length > MAX_INVITES
          ? c.inviteDialog.tooMany
          : undefined;
    if (fieldError) {
      setEmailError(fieldError);
      return false;
    }

    const results = await Promise.allSettled(
      emails.map((email) =>
        inviteUser({
          email,
          role: form.role,
          accountType: form.role === "admin" ? null : form.accountType || null,
          language: form.language || null,
        })
      )
    );
    const sent = emails.filter((_, i) => results[i].status === "fulfilled");
    const failed = results.flatMap((r, i) =>
      r.status === "rejected" ? [`${emails[i]} (${r.reason instanceof Error ? r.reason.message : r.reason})`] : []
    );
    if (sent.length) {
      showToast(c.inviteDialog.sent(sent.length, sent[0]), "success");
      onInvited();
    }
    if (failed.length) {
      // Keep only the ones that failed, so trying again doesn't invite twice.
      setForm((f) => ({ ...f, emails: emails.filter((e) => !sent.includes(e)).join(", ") }));
      return c.inviteDialog.failed(failed.join("; "));
    }
    setForm(EMPTY);
  }

  return { open, setOpen, close, form, set, emailError, submit };
}
