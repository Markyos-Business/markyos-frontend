"use client";

import { useState } from "react";
import { useCurrentAccount, useAppActions } from "@/contexts/AppContext";
import { useToast } from "@/components/ui";
import { useLimits } from "@/features/billing";
import { EMAIL_RE } from "@/lib/emailList";
import type { Workspace } from "@/types";
import type { MemberRole } from "../../types";
import { usePeopleLang } from "../use-people-lang";

type InviteErrors = { emails?: string; brands?: string; role?: string };

/**
 * Adding people to several brands in one go. Each email joins each ticked
 * brand through that brand's team, as if added on its own Team page, so the
 * invite email and the account type's editor seats work the same.
 */
export function useInvitePeople(owned: Workspace[]) {
  const { addTeamMember } = useAppActions();
  const account = useCurrentAccount();
  const { showToast } = useToast();
  const { c } = usePeopleLang();
  const d = c.inviteDialog;
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<MemberRole>("viewer");
  const [brands, setBrands] = useState<string[]>([]);
  const [errors, setErrors] = useState<InviteErrors>({});

  const limits = useLimits(account);
  const editorsOn = (w: Workspace) => w.team.filter((m) => m.role === "editor").length;

  function reset() {
    setEmail("");
    setName("");
    setRole("viewer");
    setBrands([]);
    setErrors({});
  }

  function start(workspaceIds: string[] = []) {
    reset();
    setBrands(workspaceIds);
    setOpen(true);
  }

  async function submit(): Promise<string | false | void> {
    const address = email.trim().toLowerCase();
    const list = address && EMAIL_RE.test(address) ? [address] : [];
    const next: InviteErrors = {};
    if (!address) next.emails = d.emailsRequired;
    else if (!list.length) next.emails = d.emailInvalid(address);
    if (brands.length === 0) next.brands = d.brandsRequired;

    const chosen = owned.filter((w) => brands.includes(w.id));
    if (role === "editor") {
      // Editors only fit where the seats allow, brand by brand: the account
      // type's, and none on a brand without a plan (billing epic).
      if (limits.type.editors === 0) next.role = d.soloNoEditors;
      else {
        const unpaid = chosen.find((w) => limits.editorsOn(w) === 0);
        const full = chosen.find((w) => {
          const cap = limits.editorsOn(w);
          return cap !== null && editorsOn(w) + list.length > cap;
        });
        if (unpaid) next.role = d.editorsNeedPlan(unpaid.name);
        else if (full) next.role = d.editorsFull(full.name);
      }
    }
    setErrors(next);
    if (Object.keys(next).length) return false;

    let added = 0;
    const skipped: string[] = [];
    for (const email of list) {
      for (const w of chosen) {
        if (w.team.some((m) => m.email.trim().toLowerCase() === email)) {
          skipped.push(d.alreadyOn(email, w.name));
          continue;
        }
        const display = name.trim() || email.split("@")[0];
        addTeamMember(w.id, display, email, role);
        added++;
      }
    }
    if (added) showToast(c.toasts.invited(list.length, chosen.length), "success");
    if (skipped.length) {
      // Nothing new at all: keep the dialog open and say why.
      if (!added) return skipped.join(" ");
      showToast(skipped.join(" "));
    }
    setOpen(false);
    reset();
  }

  return {
    open,
    start,
    close: () => {
      setOpen(false);
      reset();
    },
    email,
    setEmail: (v: string) => {
      setEmail(v);
      setErrors((e) => ({ ...e, emails: undefined }));
    },
    name,
    setName,
    role,
    setRole: (r: MemberRole) => {
      setRole(r);
      setErrors((e) => ({ ...e, role: undefined }));
    },
    brands,
    toggleBrand: (id: string) => {
      setBrands((b) => (b.includes(id) ? b.filter((x) => x !== id) : [...b, id]));
      setErrors((e) => ({ ...e, brands: undefined, role: undefined }));
    },
    errors,
    submit,
  };
}

export type InvitePeopleState = ReturnType<typeof useInvitePeople>;
