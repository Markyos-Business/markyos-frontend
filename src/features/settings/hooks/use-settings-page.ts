"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp, useCurrentAccount } from "@/contexts/AppContext";
import { capabilitiesOn } from "@/lib/data/access";
import { useBrandPage } from "@/contexts/pageGuards";
import { ACCOUNT_TYPES, accountTypeOf } from "@/constants/accountTypes";
import { useToast } from "@/components/ui";
import { useUrlTab } from "@/hooks/useUrlTab";
import type { TopBarTab } from "@/features/shell";
import { PAGE_SECTION } from "../constants";
import { errorText } from "@/lib/api/errorText";

const TABS = ["general", "activity"] as const;
export type SettingsTab = (typeof TABS)[number];

/** The settings page: the client link, finishing a return from checkout, and the Activity tab (saved versions). */
export function useSettingsPage(slug: string) {
  const { confirmPurchase, state } = useApp();
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
  const [tab, setTab] = useUrlTab<SettingsTab>(TABS, "general");

  useEffect(() => {
    // Reads the browser's origin to build the client link — not derivable
    // from React state, so this one-time sync is a legitimate effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (!ws) return;
    const t = (en: string, ar: string) => (page?.isAr ? ar : en);
    const checkout = searchParams.get("checkout");
    if (checkout === "success") {
      const sessionId = searchParams.get("session_id");
      if (!sessionId) {
        showToast(t("Payment couldn't be verified: the checkout reference is missing.", "تعذّر التحقق من الدفع: مرجع الدفع مفقود."), "danger");
        return;
      }
      let canceled = false;
      void confirmPurchase(ws.id, sessionId).then(({ status, billing }) => {
        if (canceled) return;
        if (status === "paid" || status === "active") {
          showToast(billing.plan === "pass" ? t("Payment verified. Project Pass active.", "تم التحقق من الدفع. تصريح المشروع مفعّل.") : t("Payment verified. Monthly plan active.", "تم التحقق من الدفع. الخطة الشهرية مفعّلة."), "success");
        } else if (status === "refunded") {
          showToast(t("This payment was refunded. No plan was activated.", "استُرد هذا المبلغ، ولم تُفعَّل أي خطة."));
        } else if (billing.subscriptionStatus) {
          showToast(t("The subscription isn't active. Use Manage subscription to review billing.", "الاشتراك غير مفعّل. استخدم «إدارة الاشتراك» لمراجعة الفوترة."));
        } else {
          showToast(t("Your payment hasn't activated a plan yet. Check this page again shortly.", "لم يُفعّل دفعك خطة بعد. تحقّق من هذه الصفحة بعد قليل."));
        }
        router.replace(`/w/${ws.slug}/settings`);
      }).catch((error: unknown) => {
        if (!canceled) showToast(errorText(error, page.isAr ? "ar" : "en", { en: "Payment could not be verified. Refresh to try again.", ar: "تعذّر التحقق من الدفع. حدّث الصفحة وحاول مرة أخرى." }), "danger");
      });
      return () => { canceled = true; };
    } else if (checkout === "cancelled") {
      showToast(t("Checkout cancelled. Nothing was charged.", "أُلغي الدفع، ولم يُخصم أي مبلغ."));
      router.replace(`/w/${ws.slug}/settings`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ws?.id, searchParams]);

  if (!page || !ws) return null;
  const capabilities = capabilitiesOn(ws, state.session);
  const tabs: TopBarTab[] = [
    { key: "general", label: "General", arLabel: "عام", active: tab === "general", onSelect: () => setTab("general") },
    // Saved versions and restoring one; it used to sit at the foot of Team & history.
    { key: "activity", label: "Activity", arLabel: "النشاط", active: tab === "activity", onSelect: () => setTab("activity") },
  ];
  return {
    shell: { workspace: ws, section: PAGE_SECTION.en, arSection: PAGE_SECTION.ar, width: "full" as const, tabs },
    view: {
      ws, isAr: page.isAr, typeLabel, prices, tab,
      canGovern: capabilities.canGovern,
      canEdit: capabilities.canEdit,
      actorName: state.session?.name || state.session?.email || "You",
      clientLink: origin ? `${origin}/v/${ws.slug}` : `/v/${ws.slug}`,
    },
  };
}

export type SettingsView = NonNullable<ReturnType<typeof useSettingsPage>>["view"];
