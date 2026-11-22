"use client";

import { accountTypeOf } from "@/constants/accountTypes";
import type { Account, Workspace } from "@/types";
import type { Plans } from "../types";
import { usePlans } from "./use-plans";

export type Limits = { brands: number | null; editors: number | null };
const NONE: Limits = { brands: null, editors: null };

/**
 * The limits the server enforces (apps/brands/services.py), from the plans
 * it publishes, so the app explains a limit before it's hit. Without plans
 * nothing is limited here; the server still refuses.
 *
 * - `type`: what the account type allows on a paid brand. Plans don't raise it.
 * - `freeBrands`: how many brands without a plan the account may own, or
 *   null when the Free rules don't apply (admins, the staging switch).
 * - `editorsOn(ws)`: editors allowed on that brand: none without a plan.
 */
export function limitsFor(plans: Plans | null, account: Account | null) {
  const type = !plans || account?.isAdmin ? NONE : plans.types[accountTypeOf(account)].limits;
  const free = Boolean(plans?.freeRulesApply) && !account?.isAdmin;
  const freeBrands = free && plans ? plans.free.brands : null;
  const editorsOn = (ws: Pick<Workspace, "billing">): number | null => {
    const cap = plans?.free.editors ?? null;
    if (!free || cap === null || ws.billing?.plan !== "free") return type.editors;
    return type.editors === null ? cap : Math.min(type.editors, cap);
  };
  return { type, freeBrands, editorsOn, ready: plans !== null };
}

export function useLimits(account: Account | null) {
  return limitsFor(usePlans(), account);
}
