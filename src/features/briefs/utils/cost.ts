import { ApiError } from "@/lib/api/client";
import type { Quote } from "../types";

/**
 * Runs a paid action: tries it unconfirmed, and if the server asks for the
 * cost to be confirmed, asks the person (with the cost and balance) and tries
 * again. Resolves to the result, or null when they decline.
 */
export async function withCostConfirm<T>(
  action: (confirmCost: boolean) => Promise<T>,
  ask: (quote: Quote) => Promise<boolean>
): Promise<T | null> {
  try {
    return await action(false);
  } catch (err) {
    const data = err instanceof ApiError ? (err.data as { code?: string; quote?: Quote } | null) : null;
    if (err instanceof ApiError && err.status === 402 && data?.code === "confirm_cost" && data.quote) {
      if (!(await ask(data.quote))) return null;
      return action(true);
    }
    throw err;
  }
}

/** "10 credits · 40 left", or just the cost when there's no limit. */
export function costLine(quote: Quote, isAr: boolean) {
  const cost = isAr ? `${quote.credits} رصيد` : `${quote.credits} credits`;
  if (quote.balance == null) return cost;
  return isAr ? `${cost} · يتبقى ${quote.balance}` : `${cost} · ${quote.balance} left`;
}
