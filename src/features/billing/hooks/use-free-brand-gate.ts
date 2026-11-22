"use client";

import { useCallback } from "react";
import { useApp, useCurrentAccount } from "@/contexts/AppContext";
import { useUpgrade } from "../components/upgrade-provider";
import { useLimits } from "./use-limits";

/**
 * The Free rule for adding a brand (billing epic, decision 3): an account
 * may own one brand without a plan. `guard(action)` runs the action, or
 * first opens the upgrade modal on a brand without a plan and runs it once
 * that brand is subscribed. Every way of adding a brand (New brand, the
 * name form, importing a file) goes through here, before any work starts.
 */
export function useFreeBrandGate() {
  const { myWorkspaces, state } = useApp();
  const account = useCurrentAccount();
  const limits = useLimits(account);
  const upgrade = useUpgrade();
  const accountId = state.session?.accountId;

  return useCallback(
    (action: () => void) => {
      const unpaid = myWorkspaces.filter((w) => w.ownerAccountId === accountId && w.billing?.plan === "free");
      if (limits.freeBrands === null || unpaid.length < limits.freeBrands) return action();
      // With several unpaid brands (older accounts), each needs a plan
      // before another fits: the modal says how many and starts with one.
      upgrade.open({ ws: unpaid[0], reason: "brand_limit", count: unpaid.length, onDone: action });
    },
    [accountId, limits.freeBrands, myWorkspaces, upgrade],
  );
}
