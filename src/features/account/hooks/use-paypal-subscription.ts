"use client";

import { useState } from "react";
import { useToast } from "@/components/ui";
import { useAppActions } from "@/contexts/AppContext";
import { API_ENABLED, api } from "@/lib/api/client";
import type { Billing, Workspace } from "@/types";

type BillingAnswer = { status: string; billing: Billing };

/** The public client id the PayPal script loads with. Empty means not set up. */
export const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? "";

/**
 * A brand's PayPal subscription, through our server only.
 *
 * `start` gives the button the plan and the id that ties the subscription to
 * this brand; after approval, `confirm` asks the server to read it back from
 * PayPal. Whatever PayPal's button reports, only the billing the server
 * returns is applied, so the browser can never grant itself a plan.
 */
export function usePayPalSubscription(ws: Workspace, isAr: boolean) {
  const { showToast } = useToast();
  const { applyServerBilling } = useAppActions();
  const [busy, setBusy] = useState<"confirming" | "cancelling" | null>(null);
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const fail = (error: unknown, fallback: string) =>
    showToast(error instanceof Error && error.message ? error.message : fallback, "danger");

  async function start() {
    return api<{ planId: string; customId: string }>("/billing/paypal/start/", {
      method: "POST",
      body: { brandId: ws.id },
    });
  }

  async function confirm(subscriptionId: string) {
    setBusy("confirming");
    try {
      const result = await api<BillingAnswer>("/billing/paypal/confirm/", {
        method: "POST",
        body: { brandId: ws.id, subscriptionId },
      });
      applyServerBilling(ws.id, result.billing);
      showToast(
        result.billing.plan === "subscription"
          ? t("Subscription active.", "الاشتراك مفعّل.")
          : t("PayPal is still confirming the subscription. It activates in a moment.", "لا يزال PayPal يؤكد الاشتراك، وسيُفعَّل خلال لحظات."),
        "success",
      );
    } catch (error) {
      fail(error, t("Couldn't confirm the subscription. Try again.", "تعذّر تأكيد الاشتراك. حاول مرة أخرى."));
    } finally {
      setBusy(null);
    }
  }

  async function cancel() {
    setBusy("cancelling");
    try {
      const result = await api<BillingAnswer>("/billing/paypal/cancel/", {
        method: "POST",
        body: { brandId: ws.id },
      });
      applyServerBilling(ws.id, result.billing);
      showToast(t("Subscription cancelled.", "أُلغي الاشتراك."), "success");
    } catch (error) {
      fail(error, t("Couldn't cancel the subscription. Try again.", "تعذّر إلغاء الاشتراك. حاول مرة أخرى."));
    } finally {
      setBusy(null);
    }
  }

  return {
    available: API_ENABLED && Boolean(PAYPAL_CLIENT_ID),
    busy,
    start,
    confirm: (id: string) => void confirm(id),
    cancel: () => void cancel(),
    failed: (error: unknown) => fail(error, t("PayPal couldn't start the subscription.", "تعذّر على PayPal بدء الاشتراك.")),
  };
}
