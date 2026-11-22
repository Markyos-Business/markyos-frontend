"use client";

import { useAppActions } from "@/contexts/AppContext";
import { useRequest } from "@/hooks/useRequest";
import type { Workspace } from "@/types";
import { fetchBrandBilling } from "../api/billing.api";

/**
 * One brand's billing for its owner (billing epic 3.3): the plan, the
 * subscription, what may be done and the payments. The billing it returns is
 * applied to the brand, so every page agrees with the tab. It reads again
 * whenever the brand's billing changes (a checkout settling, a cancel).
 */
export function useBrandBilling(ws: Workspace) {
  const { applyServerBilling } = useAppActions();
  const b = ws.billing;
  const key = [ws.id, b.plan, b.subscriptionStatus ?? "", b.paymentFailedAt ?? "", b.currentPeriodEnd ?? ""].join(":");
  return useRequest(async () => {
    const answer = await fetchBrandBilling(ws.id);
    applyServerBilling(ws.id, answer.billing);
    return answer;
  }, key);
}
