"use client";

import { useState } from "react";
import { useToast } from "@/components/ui";
import type { AccountRole, AccountType } from "@/types";
import { inviteUser } from "../../api/admin.api";
import { EMAIL_RE } from "@/lib/emailList";
import { useAdminLang } from "../shared/use-admin-lang";

type InviteForm = { email: string; role: AccountRole; accountType: AccountType | ""; language: "en" | "ar" | "" };

const EMPTY: InviteForm = { email: "", role: "member", accountType: "studio", language: "" };

/** The invite dialog: one email, one account waiting for its emailed link. */
export function useInviteUsers(onInvited: () => void) {
  const { showToast } = useToast();
  const { c } = useAdminLang();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<InviteForm>(EMPTY);
  const [emailError, setEmailError] = useState<string | undefined>();

  const set = <K extends keyof InviteForm>(key: K, value: InviteForm[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (key === "email") setEmailError(undefined);
  };

  function close() {
    setOpen(false);
    setForm(EMPTY);
    setEmailError(undefined);
  }

  /** Resolves to a message to keep the dialog open, `false` for a field error. */
  async function submit(): Promise<string | false | void> {
    const email = form.email.trim().toLowerCase();
    const fieldError = !email ? c.inviteDialog.emailsRequired : !EMAIL_RE.test(email) ? c.inviteDialog.emailInvalid(email) : undefined;
    if (fieldError) {
      setEmailError(fieldError);
      return false;
    }
    try {
      await inviteUser({
        email,
        role: form.role,
        accountType: form.role === "admin" ? null : form.accountType || null,
        language: form.language || null,
      });
    } catch (e) {
      return e instanceof Error ? e.message : String(e);
    }
    showToast(c.inviteDialog.sent(email), "success");
    onInvited();
    setForm(EMPTY);
  }

  return { open, setOpen, close, form, set, emailError, submit };
}
