import type { ActionItem } from "@/components/ui";
import type { AdminBillingCopy } from "../../billing-copy";
import type { BillingActions } from "../../hooks/billing/use-billing-actions";
import type { AdminCheckout } from "../../types";
import { compRunning } from "../../utils/billing";

/**
 * What can be done to one checkout, for its ⋯ menu and its page: sync a
 * PayPal subscription, comp the brand, or end a running comp. The server
 * refuses anything that doesn't apply; this only leaves out what can't.
 */
export function checkoutActions(checkout: AdminCheckout, b: AdminBillingCopy, actions: BillingActions, open?: () => void): ActionItem[] {
  const items: ActionItem[] = [];
  if (open) items.push({ label: b.actions.open, icon: "external-link-alt", onSelect: open });
  if (checkout.provider === "paypal" && checkout.subscriptionId) items.push({ label: b.actions.sync, icon: "sync", onSelect: () => actions.setSyncFor(checkout) });
  if (compRunning(checkout)) {
    items.push({ label: b.actions.endComp, icon: "times", tone: "danger", onSelect: () => void actions.end(checkout) });
  } else if (checkout.brand) {
    const brand = checkout.brand;
    items.push({ label: b.actions.comp, icon: "star", onSelect: () => actions.setCompFor({ id: brand.id, name: brand.name }) });
  }
  return items;
}
