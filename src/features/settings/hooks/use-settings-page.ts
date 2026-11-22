"use client";

import { useEffect, useState } from "react";
import { useApp, useCurrentAccount } from "@/contexts/AppContext";
import { capabilitiesOn, roleOn } from "@/lib/data/access";
import { useBrandPage } from "@/contexts/pageGuards";
import { ACCOUNT_TYPES, accountTypeOf } from "@/constants/accountTypes";
import { useUrlTab } from "@/hooks/useUrlTab";
import type { TopBarTab } from "@/features/shell";
import { billingCopy } from "@/features/billing";
import { PAGE_SECTION } from "../constants";

const TABS = ["general", "activity", "billing"] as const;
export type SettingsTab = (typeof TABS)[number];
/** Billing is the owner's alone (billing epic 3.3); anyone else is on General. */
const SHARED_TABS: readonly SettingsTab[] = ["general", "activity"];

/** The settings page: the client link and the Activity tab (saved versions). */
export function useSettingsPage(slug: string) {
  const { state } = useApp();
  const page = useBrandPage(slug);
  const ws = page?.workspace;
  const account = useCurrentAccount();
  const { label: typeLabel } = ACCOUNT_TYPES[accountTypeOf(account)];
  const [origin, setOrigin] = useState("");
  const isOwner = ws ? roleOn(ws, state.session) === "owner" : false;
  const [tab, setTab] = useUrlTab<SettingsTab>(isOwner ? TABS : SHARED_TABS, "general");

  useEffect(() => {
    // Reads the browser's origin to build the client link — not derivable
    // from React state, so this one-time sync is a legitimate effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrigin(window.location.origin);
  }, []);

  if (!page || !ws) return null;
  const capabilities = capabilitiesOn(ws, state.session);
  const tabs: TopBarTab[] = [
    { key: "general", label: "General", arLabel: "عام", active: tab === "general", onSelect: () => setTab("general") },
    // Saved versions and restoring one; it used to sit at the foot of Team & history.
    { key: "activity", label: "Activity", arLabel: "النشاط", active: tab === "activity", onSelect: () => setTab("activity") },
    ...(isOwner
      ? [{ key: "billing", label: billingCopy(false).tab.label, arLabel: billingCopy(true).tab.label, active: tab === "billing", onSelect: () => setTab("billing") }]
      : []),
  ];
  return {
    shell: { workspace: ws, section: PAGE_SECTION.en, arSection: PAGE_SECTION.ar, width: "full" as const, tabs },
    view: {
      ws, isAr: page.isAr, typeLabel, tab, isOwner,
      canGovern: capabilities.canGovern,
      canEdit: capabilities.canEdit,
      actorName: state.session?.name || state.session?.email || "You",
      clientLink: origin ? `${origin}/v/${ws.slug}` : `/v/${ws.slug}`,
    },
  };
}

export type SettingsView = NonNullable<ReturnType<typeof useSettingsPage>>["view"];
