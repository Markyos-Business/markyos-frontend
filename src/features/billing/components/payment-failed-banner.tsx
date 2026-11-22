"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { AlertBanner, Button, formatDayMonth } from "@/components/ui";
import { useSession } from "@/contexts/AppContext";
import { roleOn } from "@/lib/data/access";
import { useUrlTab } from "@/hooks/useUrlTab";
import type { Workspace } from "@/types";
import { billingCopy } from "../copy";
import { failureBannerDue } from "../utils/billing-state";

const TABS = ["billing"] as const;

/**
 * Above every page of a brand while a failed renewal is in its grace (D6,
 * billing epic 3.2), for the owner only: who else could fix it. It reads the
 * brand's billing as the server set it and leads to the Billing tab, where
 * it doesn't repeat itself.
 */
export function PaymentFailedBanner({ ws, isAr }: { ws: Workspace; isAr: boolean }) {
  const owner = roleOn(ws, useSession()) === "owner";
  const [now] = useState(() => Date.now());
  const pathname = usePathname();
  const [tab] = useUrlTab<"billing" | "other">(TABS, "other");
  const onBillingTab = tab === "billing" && /\/settings\/?$/.test(pathname ?? "");
  if (!owner || onBillingTab || !failureBannerDue(ws.billing, now)) return null;
  const copy = billingCopy(isAr).banner;
  const date = formatDayMonth(new Date(ws.billing.graceEndsAt), isAr ? "ar" : "en", true);
  return (
    <div className="px-space-8 pt-space-5" data-payment-failed-banner>
      <AlertBanner
        tone="warning"
        actionPlacement="below"
        message={copy.failed(ws.name, date)}
        action={
          <Button size="sm" variant="secondary" href={`/w/${ws.slug}/settings?tab=billing`}>
            {copy.action}
          </Button>
        }
      />
    </div>
  );
}
