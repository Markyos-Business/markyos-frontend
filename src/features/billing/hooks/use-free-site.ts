"use client";

import { useSession } from "@/contexts/AppContext";
import { useRequest } from "@/hooks/useRequest";
import { API_ENABLED } from "@/lib/api/client";
import { roleOn } from "@/lib/data/access";
import type { Workspace } from "@/types";
import { fetchBrandBilling } from "../api/billing.api";
import { freeSiteOf, type FreeSite } from "../utils/billing-state";

/**
 * Whether an unpaid brand is, may take, or is kept from the owner's one free
 * live guideline site (25 Nov 2026), from GET /billing/brands/<id>/.
 *
 * Only the owner can read that answer, so for anyone else, a paid brand, the
 * offline demo, a failed request or an older server this is null and the app
 * keeps today's rule. It reads again when the brand's plan or live state
 * changes (a publish or unpublish moves the slot). Display only: the server
 * refuses a publish the slot doesn't allow.
 */
export function useFreeSite(ws: Workspace | undefined): FreeSite | null {
  const session = useSession();
  const enabled = Boolean(API_ENABLED && ws && ws.billing?.plan === "free" && roleOn(ws, session) === "owner");
  const key = enabled && ws ? [ws.id, ws.billing.plan, ws.billing.subscriptionStatus ?? "", String(ws.live ?? ""), ws.publishedAt ?? ""].join(":") : "off";
  const id = ws?.id ?? "";
  const request = useRequest(async () => (enabled ? { id, answer: await fetchBrandBilling(id) } : null), key);
  // An answer still on screen from another brand says nothing about this one.
  return enabled && request.data?.id === id ? freeSiteOf(request.data.answer, id) : null;
}
