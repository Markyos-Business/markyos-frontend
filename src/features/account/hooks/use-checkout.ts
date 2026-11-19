"use client";

import { useState } from "react";
import { API_ENABLED, api } from "@/lib/api/client";
import { useToast } from "@/components/ui";
import type { PlanKind, Workspace } from "@/types";
import { errorText } from "@/lib/api/errorText";

/** Sends the studio to Stripe checkout for a plan, and which plan is on its way there. */
export function useCheckout(ws: Workspace, isAr: boolean) {
  const lang = isAr ? "ar" : "en";
  const { showToast } = useToast();
  const [loading, setLoading] = useState<PlanKind | null>(null);
  const [managing, setManaging] = useState(false);

  async function checkout(plan: PlanKind) {
    if (plan === "free") return;
    if (!API_ENABLED) {
      showToast(isAr ? "الدفع غير متاح الآن. حاول مرة أخرى لاحقًا." : "Payments aren't available right now. Try again later.", "danger");
      return;
    }
    setLoading(plan);
    try {
      const data = await api<{ url: string }>("/billing/checkout/", {
        method: "POST", body: { brandId: ws.id, plan },
      });
      window.location.href = data.url;
    } catch (error) {
      showToast(errorText(error, lang, { en: "Couldn't reach checkout. Try again.", ar: "تعذّر الوصول إلى صفحة الدفع. حاول مرة أخرى." }), "danger");
      setLoading(null);
    }
  }

  async function manageSubscription() {
    if (!API_ENABLED) {
      showToast(isAr ? "إدارة الفوترة غير متاحة الآن. حاول مرة أخرى لاحقًا." : "Billing management isn't available right now. Try again later.", "danger");
      return;
    }
    setManaging(true);
    try {
      const { url } = await api<{ url: string }>("/billing/portal/", {
        method: "POST", body: { brandId: ws.id },
      });
      window.location.href = url;
    } catch (error) {
      showToast(errorText(error, lang, { en: "Couldn't open billing management.", ar: "تعذّر فتح إدارة الفوترة." }), "danger");
      setManaging(false);
    }
  }

  return { loading, managing, checkout: (plan: PlanKind) => void checkout(plan), manageSubscription: () => void manageSubscription() };
}
