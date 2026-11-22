"use client";

import { useState } from "react";
import { FormDialog, TextareaField } from "@/components/ui";
import type { BillingActions } from "../../hooks/billing/use-billing-actions";
import { useAdminBillingLang } from "../../hooks/shared/use-admin-lang";
import { REASON_MAX } from "../../utils/billing";

/** Sync one checkout from PayPal, with an optional reason for the audit log. */
export function SyncDialog({ actions }: { actions: BillingActions }) {
  const { b } = useAdminBillingLang();
  const checkout = actions.syncFor;
  const [reason, setReason] = useState("");
  const close = () => {
    actions.setSyncFor(null);
    setReason("");
  };
  return (
    <FormDialog
      open={!!checkout}
      title={b.sync.title}
      description={checkout ? `${checkout.brand?.name ?? b.table.deletedBrand} · ${b.sync.description}` : undefined}
      submitLabel={b.sync.submit}
      errorMessage={b.sync.failed}
      onClose={close}
      onSubmit={async () => {
        if (!checkout) return;
        const failed = await actions.sync(checkout, reason);
        if (typeof failed === "string") return failed;
        setReason("");
      }}
    >
      <TextareaField label={b.sync.reason} optional value={reason} onChange={(e) => setReason(e.target.value)} maxLength={REASON_MAX} rows={3} autoGrow maxRows={6} resizable={false} />
    </FormDialog>
  );
}
