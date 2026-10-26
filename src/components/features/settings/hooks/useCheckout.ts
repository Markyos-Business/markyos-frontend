"use client";

import { useState } from "react";
import { useCurrentAccount } from "@/contexts/AppContext";
import { accountTypeOf } from "@/constants/accountTypes";
import { API_ENABLED, api, getAccessToken } from "@/lib/api/client";
import { useToast } from "@/components/ui";
import type { PlanKind, Workspace } from "@/types";

/** Sends the studio to Stripe checkout for a plan, and which plan is on its way there. */
export function useCheckout(ws: Workspace) {
  const { showToast } = useToast();
  const account = useCurrentAccount();
  const [loading, setLoading] = useState<PlanKind | null>(null);

  async function checkout(plan: PlanKind) {
    if (plan === "free") return;
    setLoading(plan);
    try {
      // With a backend the price tier comes from the account type the server
      // holds, so checkout passes the session along instead of a tier. The
      // `me` call first refreshes the token if it has lapsed.
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (API_ENABLED) {
        await api("/auth/me/");
        const token = getAccessToken();
        if (token) headers.Authorization = `Bearer ${token}`;
      }
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers,
        body: JSON.stringify({ slug: ws.slug, plan, accountType: accountTypeOf(account) }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Checkout failed.", "danger");
        setLoading(null);
        return;
      }
      window.location.href = data.url;
    } catch {
      showToast("Couldn't reach checkout — try again.", "danger");
      setLoading(null);
    }
  }

  return { loading, checkout: (plan: PlanKind) => void checkout(plan) };
}
