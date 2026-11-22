"use client";

import { Badge } from "@/components/ui";
import { useAdminBillingLang } from "../../hooks/shared/use-admin-lang";
import { checkoutStatus } from "../../utils/billing";

/** A checkout's status (ours or PayPal's) as the server sent it, in words and a tone. */
export function CheckoutStatusBadge({ status, refused = false }: { status: string | null | undefined; refused?: boolean }) {
  const { b } = useAdminBillingLang();
  const s = checkoutStatus(status, refused);
  return (
    <Badge tone={s.tone} dot>
      {s.key === "other" && status ? status : b.statuses[s.key]}
    </Badge>
  );
}
