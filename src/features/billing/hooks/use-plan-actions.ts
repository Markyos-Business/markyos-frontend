"use client";

import { useState } from "react";
import { useToast } from "@/components/ui";
import { useAppActions } from "@/contexts/AppContext";
import { errorText } from "@/lib/api/errorText";
import type { Workspace } from "@/types";
import { reactivatePlan, refusalCode } from "../api/billing.api";
import { billingCopy } from "../copy";

/** The server's refusal in the reader's language: a known code, or errorText. */
export function billingErrorText(error: unknown, isAr: boolean, fallback: { en: string; ar: string }): string {
  const code = refusalCode(error);
  if (code === "nothing_to_resume" || code === "nothing_to_reactivate") return billingCopy(isAr).tab.codes[code];
  return errorText(error, isAr ? "ar" : "en", fallback);
}

/**
 * Reactivating a suspended plan (billing epic 3.2/3.4): PayPal collects the
 * missed payment and the server answers with the brand's billing.
 */
export function useReactivate(ws: Workspace, onDone: () => void) {
  const { applyServerBilling } = useAppActions();
  const { showToast } = useToast();
  const [busy, setBusy] = useState(false);

  const run = async (isAr: boolean) => {
    if (busy) return;
    const copy = billingCopy(isAr);
    setBusy(true);
    try {
      const answer = await reactivatePlan(ws.id);
      applyServerBilling(ws.id, answer.billing);
      showToast(copy.tab.reactivated, "success");
      onDone();
    } catch (error) {
      showToast(billingErrorText(error, isAr, { en: billingCopy(false).tab.reactivateFailed, ar: billingCopy(true).tab.reactivateFailed }), "danger");
    } finally {
      setBusy(false);
    }
  };

  return { busy, run };
}
