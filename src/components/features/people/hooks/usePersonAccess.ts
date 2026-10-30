"use client";

import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { useDialog, useToast } from "@/components/ui";
import type { MemberRole, Person } from "../types";
import { usePeopleLang } from "./usePeopleLang";

/** "remove" takes them off that brand. */
export type AccessChoice = MemberRole | "remove";

/**
 * One person's access, brand by brand: a draft of choices the sheet edits,
 * applied on save. Taking someone off a brand asks first.
 */
export function usePersonAccess(person: Person, onDone: () => void) {
  const { setTeamRole, removeTeamMember } = useApp();
  const { confirm } = useDialog();
  const { showToast } = useToast();
  const { c, isAr } = usePeopleLang();
  const [draft, setDraft] = useState<Record<string, AccessChoice>>(() =>
    Object.fromEntries(person.brands.map((b) => [b.workspaceId, b.role]))
  );

  const changes = person.brands.filter((b) => draft[b.workspaceId] !== b.role);
  const removals = changes.filter((b) => draft[b.workspaceId] === "remove");

  async function save(): Promise<string | false | void> {
    if (changes.length === 0) return c.sheet.nothing;
    if (removals.length > 0) {
      const ok = await confirm({
        title: c.confirm.removeTitle(person.name, removals.length),
        body: c.confirm.removeBody,
        consequences: removals.map((b) => b.brandName),
        confirmLabel: c.confirm.remove,
        tone: "danger",
        isAr,
      });
      if (!ok) return false;
    }
    for (const b of changes) {
      const choice = draft[b.workspaceId];
      if (choice === "remove") removeTeamMember(b.workspaceId, b.memberId);
      else setTeamRole(b.workspaceId, b.memberId, choice);
    }
    showToast(c.toasts.saved, "success");
    onDone();
  }

  return {
    draft,
    choose: (workspaceId: string, choice: AccessChoice) => setDraft((d) => ({ ...d, [workspaceId]: choice })),
    save,
  };
}

/** Taking someone off every brand at once, from the row menu. */
export function useRemoveEverywhere() {
  const { removeTeamMember } = useApp();
  const { confirm } = useDialog();
  const { showToast } = useToast();
  const { c, isAr } = usePeopleLang();

  return async function removeEverywhere(person: Person) {
    const ok = await confirm({
      title: c.confirm.removeAllTitle(person.name),
      body: c.confirm.removeBody,
      consequences: person.brands.map((b) => b.brandName),
      confirmLabel: c.confirm.remove,
      tone: "danger",
      isAr,
    });
    if (!ok) return;
    for (const b of person.brands) removeTeamMember(b.workspaceId, b.memberId);
    showToast(c.toasts.removed(person.name), "success");
  };
}
