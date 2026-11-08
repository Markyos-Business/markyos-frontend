"use client";

import { useState } from "react";
import { API_ENABLED, api } from "@/lib/api/client";
import { useToast } from "@/components/ui";
import type { PlanKind, Workspace } from "@/types";

/** Sends the studio to Stripe checkout for a plan, and which plan is on its way there. */
export function useCheckout(ws: Workspace) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState<PlanKind | null>(null);
  const [managing, setManaging] = useState(false);

  async function checkout(plan: PlanKind) {
    if (plan === "free") return;
    if (!API_ENABLED) {
      showToast("Payments need a connection to the Markyos server.", "danger");
      return;
    }
    setLoading(plan);
    try {
      const data = await api<{ url: string }>("/billing/checkout/", {
        method: "POST", body: { brandId: ws.id, plan },
      });
      window.location.href = data.url;
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Couldn't reach checkout — try again.", "danger");
      setLoading(null);
    }
  }

  async function manageSubscription() {
    if (!API_ENABLED) {
      showToast("Billing management needs a connection to the Markyos server.", "danger");
      return;
    }
    setManaging(true);
    try {
      const { url } = await api<{ url: string }>("/billing/portal/", {
        method: "POST", body: { brandId: ws.id },
      });
      window.location.href = url;
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Couldn't open billing management.", "danger");
      setManaging(false);
    }
  }

  return { loading, managing, checkout: (plan: PlanKind) => void checkout(plan), manageSubscription: () => void manageSubscription() };
}
