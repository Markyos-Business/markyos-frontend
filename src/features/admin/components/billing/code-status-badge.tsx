"use client";

import { Badge } from "@/components/ui";
import type { PromoStatus } from "@/features/billing";
import { useAdminPromoLang } from "../../hooks/shared/use-admin-lang";
import { promoStatusTone } from "../../utils/promo";

/** A code's status as the server sent it, in words and a tone. */
export function CodeStatusBadge({ status }: { status: string }) {
  const { p } = useAdminPromoLang();
  return (
    <Badge tone={promoStatusTone(status)} dot>
      {p.statuses[status as PromoStatus] ?? status}
    </Badge>
  );
}
