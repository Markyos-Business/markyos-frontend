"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp, useCurrentAccount } from "@/contexts/AppContext";
import { useBrandPage } from "@/contexts/pageGuards";
import { ACCOUNT_TYPES, accountTypeOf } from "@/constants/accountTypes";
import { useToast } from "@/components/ui";
import type { PlanKind } from "@/types";
import { PAGE_SECTION } from "../constants";

/** The settings page: the client link, and finishing a return from checkout. */
export function useSettingsPage(slug: string) {
  const { markPurchased } = useApp();
  const page = useBrandPage(slug);
  const ws = page?.workspace;
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  // Prices follow the account type: a freelancer, a studio and a company each
  // pay their own rate per brand (constants/accountTypes.ts).
  const account = useCurrentAccount();
  const { label: typeLabel, prices } = ACCOUNT_TYPES[accountTypeOf(account)];
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    // Reads the browser's origin to build the client link — not derivable
    // from React state, so this one-time sync is a legitimate effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (!ws) return;
    const checkout = searchParams.get("checkout");
    if (checkout === "success") {
      const plan = (searchParams.get("plan") as PlanKind) || "pass";
      const sessionId = searchParams.get("session_id") ?? undefined;
      markPurchased(ws.id, plan, sessionId);
      showToast(plan === "pass" ? "Project Pass activated — this guideline is now shared." : `${typeLabel} plan active.`, "success");
      router.replace(`/w/${ws.slug}/settings`);
    } else if (checkout === "cancelled") {
      showToast("Checkout cancelled — nothing was charged.");
      router.replace(`/w/${ws.slug}/settings`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ws?.id, searchParams]);

  if (!page || !ws) return null;
  return {
    shell: { workspace: ws, section: PAGE_SECTION.en, arSection: PAGE_SECTION.ar, width: "full" as const },
    view: { ws, isAr: page.isAr, typeLabel, prices, clientLink: origin ? `${origin}/v/${ws.slug}` : `/v/${ws.slug}` },
  };
}

export type SettingsView = NonNullable<ReturnType<typeof useSettingsPage>>["view"];
