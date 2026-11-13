"use client";

import { useApp, useCurrentAccount } from "@/contexts/AppContext";
import { useBrandPage } from "@/contexts/pageGuards";
import { ACCOUNT_TYPES, accountTypeOf, limitsOf } from "@/constants/accountTypes";
import { capabilitiesOn } from "@/lib/data/access";
import type { TeamRole } from "@/types";
import { PAGE_SECTION } from "../constants";

/** The team page: who you are on this brand, and whether its editor seats are full. */
export function useTeamPage(slug: string) {
  const { state } = useApp();
  const account = useCurrentAccount();
  const page = useBrandPage(slug);
  if (!page) return null;
  const { workspace: ws, isAr } = page;

  const capabilities = capabilitiesOn(ws, state.session);
  const myRole: TeamRole = capabilities.role ?? "viewer";
  const { canGovern, canEdit } = capabilities;
  /*
   * Editor seats, by the owner's account type (constants/accountTypes.ts).
   * Only owners change the team, so the signed-in account is the owner here.
   * The server refuses the same thing; this says so before anyone tries.
   */
  const editorLimit = limitsOf(account).editors;
  const editorsFull = canGovern && editorLimit !== null && ws.team.filter((m) => m.role === "editor").length >= editorLimit;
  const editorsFullNote =
    editorLimit === 0
      ? page.isAr
        ? `حسابات ${ACCOUNT_TYPES[accountTypeOf(account)].arLabel} تعمل منفردة، فلا يمكنها إضافة محرّرين. أضف الأشخاص كمشاهدين أو عملاء.`
        : `${ACCOUNT_TYPES[accountTypeOf(account)].label} accounts work solo, so they can't add editors. Add people as a viewer or client.`
      : page.isAr
        ? `امتلأت مقاعد المحرّرين (${editorLimit}) في هذه العلامة. أضف الأشخاص كمشاهدين أو عملاء.`
        : `This brand has its ${editorLimit} editor seats filled. Add people as a viewer or client.`;

  return {
    shell: {
      workspace: ws,
      section: PAGE_SECTION.en,
      arSection: PAGE_SECTION.ar,
      width: "full" as const,
    },
    view: {
      ws,
      isAr,
      myRole,
      canGovern,
      canEdit,
      editorsFull,
      editorsFullNote,
      actorName: state.session?.name || state.session?.email || "You",
    },
  };
}

export type TeamPageView = NonNullable<ReturnType<typeof useTeamPage>>["view"];
