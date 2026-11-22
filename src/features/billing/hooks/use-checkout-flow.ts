"use client";

import { useCallback, useRef, useState } from "react";
import { useAppActions } from "@/contexts/AppContext";
import { api } from "@/lib/api/client";
import type { Billing, Workspace } from "@/types";

export type Answer = { status: string; billing: Billing };

export type FlowState = "idle" | "confirming" | "active" | "slow" | "failed" | "refused" | "cancelled";

/**
 * What a server answer settles, or null to keep waiting. Only the server's
 * status counts; a brand is active once its billing says subscription.
 */
export function outcomeOf(answer: Answer): FlowState | null {
  if (answer.status === "active" && answer.billing.plan === "subscription") return "active";
  if (answer.status === "refused") return "refused";
  if (answer.status === "cancelled" || answer.status === "expired") return "cancelled";
  if (["suspended", "refunded", "reversed"].includes(answer.status)) return "failed";
  return null; // approval_pending, approved, none (PayPal or the webhook still on its way)
}

/** Poll every few seconds for a minute, then say it's slow (never stuck). */
export const POLL_MS = 3000;
export const POLL_FOR_MS = 60_000;

/**
 * One brand's checkout after PayPal's approval (billing epic 2.5/2.6): the
 * server reads the subscription back from PayPal; while PayPal hasn't made
 * it active we poll our server, which re-reads PayPal, until it is or a
 * minute has passed. Only the billing the server returns is applied: the
 * browser never decides the plan, price or status.
 */
export function useCheckoutFlow(ws: Workspace, onActive?: () => void) {
  const { applyServerBilling } = useAppActions();
  const [state, setState] = useState<FlowState>("idle");
  // Each wait gets a number; stopping (or a newer wait) ends the older loop.
  const run = useRef(0);

  const stop = useCallback(() => {
    run.current += 1;
  }, []);
  // Closing the modal doesn't stop the wait: the loop runs to its deadline
  // and applies the server's billing, so the brand updates as the "slow"
  // message promises (its own state updates are then simply dropped).

  const settle = useCallback(
    (answer: Answer) => {
      applyServerBilling(ws.id, answer.billing);
      const outcome = outcomeOf(answer);
      if (!outcome) return false;
      stop();
      setState(outcome);
      if (outcome === "active") onActive?.();
      return true;
    },
    [applyServerBilling, onActive, stop, ws.id],
  );

  const poll = useCallback(async () => {
    const mine = ++run.current;
    const deadline = Date.now() + POLL_FOR_MS;
    while (mine === run.current) {
      await new Promise((resolve) => window.setTimeout(resolve, POLL_MS));
      if (mine !== run.current) return;
      try {
        const answer = await api<Answer>(`/billing/paypal/status/?brandId=${encodeURIComponent(ws.id)}`);
        if (mine !== run.current || settle(answer)) return;
      } catch {
        /* a blip: keep polling until the deadline */
      }
      if (Date.now() >= deadline) {
        setState("slow");
        return;
      }
    }
  }, [settle, ws.id]);

  const keepWaiting = useCallback(() => {
    setState("confirming");
    void poll();
  }, [poll]);

  const approved = useCallback(
    async (subscriptionId: string) => {
      setState("confirming");
      try {
        const answer = await api<Answer>("/billing/paypal/confirm/", {
          method: "POST",
          body: { brandId: ws.id, subscriptionId },
        });
        if (!settle(answer)) void poll();
      } catch {
        // A refusal is recorded before it's raised, and PayPal can lag just
        // after approval: ask our server what the row says rather than
        // guessing from the error (security review L1).
        void poll();
      }
    },
    [poll, settle, ws.id],
  );

  const cancel = useCallback(async () => {
    stop();
    try {
      const answer = await api<Answer>("/billing/paypal/cancel/", { method: "POST", body: { brandId: ws.id } });
      applyServerBilling(ws.id, answer.billing);
      setState("cancelled");
    } catch {
      setState("failed");
    }
  }, [applyServerBilling, stop, ws.id]);

  return { state, approved, keepWaiting, cancel };
}
