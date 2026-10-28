import type { AccountTypeInfo } from "@/constants/accountTypes";
import type { Workspace } from "@/types";

type Plan = Workspace["billing"]["plan"];

/** What each plan is called and costs for this account type, in the units checkout charges. */
export const planTable = (type: AccountTypeInfo): Record<Plan, { label: string; amount: number; note: string }> => ({
  free: { label: "Free", amount: 0, note: "" },
  pass: { label: "Project Pass", amount: type.prices.pass, note: "one-time" },
  subscription: { label: `${type.label} plan`, amount: type.prices.subscription, note: "per month" },
});

/*
 * Both lookups are total, which they were not before.
 *
 * Everything in this app is rehydrated from a `localStorage` blob written by
 * whatever version of the code last ran in this browser. A plan name that has
 * since been renamed or removed reaches this component as a string that is in
 * neither table, and indexing straight into them returned `undefined` — then
 * `price.amount` threw and took the whole Account page down to a blank screen,
 * with no way to reach Profile or Organisation either.
 *
 * Falling back is the right call over rendering nothing: an unrecognised plan
 * is shown by name at no price, which is a row someone can look at and ask
 * about, rather than a page that doesn't load.
 */
export const lookup = (table: ReturnType<typeof planTable>, plan: string) =>
  table[plan as Plan] ?? { label: plan, amount: 0, note: "" };
