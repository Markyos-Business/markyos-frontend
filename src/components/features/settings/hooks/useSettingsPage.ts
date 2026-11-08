"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp, useCurrentAccount } from "@/contexts/AppContext";
import { useBrandPage } from "@/contexts/pageGuards";
import { ACCOUNT_TYPES, accountTypeOf } from "@/constants/accountTypes";
import { useToast } from "@/components/ui";
import { PAGE_SECTION } from "../constants";

/** The settings page: the client link, and finishing a return from checkout. */
export function useSettingsPage(slug: string) {
  const { confirmPurchase } = useApp();
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
      const sessionId = searchParams.get("session_id");
      if (!sessionId) {
        showToast("Payment could not be verified: the checkout reference is missing.", "danger");
        return;
      }
      let canceled = false;
      void confirmPurchase(ws.id, sessionId).then(({ status, billing }) => {
        if (canceled) return;
        if (status === "paid" || status === "active") {
          showToast(billing.plan === "pass" ? "Payment verified — Project Pass active." : "Payment verified — monthly plan active.", "success");
        } else if (status === "refunded") {
          showToast("This payment was refunded. No plan was activated.");
        } else if (billing.subscriptionStatus) {
          showToast("The subscription is not active. Use Manage subscription to review billing.");
        } else {
          showToast("Your payment has not activated a plan yet. Check this page again shortly.");
        }
        router.replace(`/w/${ws.slug}/settings`);
      }).catch((error: unknown) => {
        if (!canceled) showToast(error instanceof Error ? error.message : "Payment could not be verified. Refresh to try again.", "danger");
      });
      return () => { canceled = true; };
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
