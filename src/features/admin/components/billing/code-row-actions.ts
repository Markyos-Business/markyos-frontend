import type { ActionItem } from "@/components/ui";
import type { PromoCodeRow } from "@/features/billing";
import type { PromoActions } from "../../hooks/billing/use-promo-actions";
import type { AdminPromoCopy } from "../../promo-copy";

/**
 * What can be done to one code, for its ⋯ menu: open it, copy it, disable it
 * or its whole batch. A code that's already disabled can't be disabled again;
 * the server refuses anything else that doesn't apply.
 */
export function codeActions(row: PromoCodeRow, p: AdminPromoCopy, actions: PromoActions, open?: () => void): ActionItem[] {
  const items: ActionItem[] = [];
  if (open) items.push({ label: p.actions.open, icon: "external-link-alt", onSelect: open });
  items.push({ label: p.actions.copy, icon: "copy", onSelect: () => void actions.copy(row.code) });
  if (row.status !== "disabled") items.push({ label: p.actions.disable, icon: "times", tone: "danger", onSelect: () => void actions.disable(row) });
  items.push({ label: p.actions.disableBatch, icon: "layer-group", tone: "danger", onSelect: () => void actions.disableAll(row.batchId) });
  return items;
}
