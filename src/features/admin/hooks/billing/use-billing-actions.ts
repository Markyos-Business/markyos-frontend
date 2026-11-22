"use client";

import { useState } from "react";
import { formatDayMonth, useDialog, useToast } from "@/components/ui";
import { errorText } from "@/lib/api/errorText";
import { compPlan, endComp, syncCheckout } from "../../api/admin-billing.api";
import type { AdminCheckout, AdminCheckoutDetail } from "../../types";
import { endOfDay } from "../../utils/billing";
import { useAdminBillingLang } from "../shared/use-admin-lang";

/** A brand an admin can comp: from a checkout, or from an account's brand list. */
export type CompTarget = { id: string; name: string };

/**
 * What an admin does to billing: sync a checkout from PayPal, comp a brand,
 * end a comp. Each asks first (a dialog with its reason), says the outcome
 * in a toast and hands the server's answer back; nothing here decides.
 */
export function useBillingActions(onChanged: (detail?: AdminCheckoutDetail) => void) {
  const { b, isAr, lang } = useAdminBillingLang();
  const { showToast } = useToast();
  const { prompt } = useDialog();
  const [syncFor, setSyncFor] = useState<AdminCheckout | null>(null);
  const [compFor, setCompFor] = useState<CompTarget | null>(null);
  // The checkout whose comp is being ended: its button spins and can't be pressed twice.
  const [ending, setEnding] = useState<string | null>(null);
  const fail = (err: unknown, fallback: { en: string; ar: string }) => errorText(err, lang, fallback);

  /** From the sync dialog: an error to show in it, or nothing once done. */
  async function sync(checkout: AdminCheckout, reason: string): Promise<string | void> {
    try {
      const detail = await syncCheckout(checkout.id, reason);
      showToast(b.sync.done, "success");
      onChanged(detail);
    } catch (err) {
      return fail(err, { en: "Couldn't sync with PayPal. Try again.", ar: "تعذّرت المزامنة مع PayPal. حاول مرة أخرى." });
    }
  }

  /** From the comp dialog. `expiresOn` is the day chosen; the comp lasts through it. */
  async function comp(target: CompTarget, reason: string, expiresOn: string): Promise<string | void> {
    try {
      await compPlan({ brandId: target.id, reason, expiresAt: endOfDay(expiresOn) });
      const [y, m, d] = expiresOn.split("-").map(Number);
      showToast(b.comp.done(target.name, formatDayMonth(new Date(y, m - 1, d), lang, true)), "success");
      onChanged();
    } catch (err) {
      return fail(err, { en: "Couldn't comp the plan. Try again.", ar: "تعذّر إهداء الخطة. حاول مرة أخرى." });
    }
  }

  /** Destructive: the reason is asked in a red confirm. */
  async function end(checkout: AdminCheckout) {
    if (ending) return;
    const name = checkout.brand?.name ?? b.table.deletedBrand;
    const reason = await prompt({
      title: b.endComp.title(name),
      body: b.endComp.body(name),
      label: b.endComp.reason,
      confirmLabel: b.endComp.confirm,
      tone: "danger",
      isAr,
    });
    if (!reason) return;
    setEnding(checkout.id);
    try {
      await endComp(checkout.id, reason);
      showToast(b.endComp.done, "success");
      onChanged();
    } catch (err) {
      showToast(fail(err, { en: "Couldn't end the comp. Try again.", ar: "تعذّر إنهاء الخطة المُهداة. حاول مرة أخرى." }), "danger");
    } finally {
      setEnding(null);
    }
  }

  return { syncFor, setSyncFor, compFor, setCompFor, ending, sync, comp, end };
}

export type BillingActions = ReturnType<typeof useBillingActions>;
