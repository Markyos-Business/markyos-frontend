"use client";

import { useState } from "react";
import { DatePicker, FormDialog, TextareaField } from "@/components/ui";
import type { BillingActions } from "../../hooks/billing/use-billing-actions";
import { useAdminBillingLang } from "../../hooks/shared/use-admin-lang";
import { compBounds, REASON_MAX, validateComp, type CompErrors } from "../../utils/billing";

/**
 * Comp a plan for a brand: an end date (tomorrow to two years out) and a
 * reason, both required. The server checks both again and makes the plan.
 */
export function CompDialog({ actions }: { actions: BillingActions }) {
  const { b } = useAdminBillingLang();
  const target = actions.compFor;
  const [reason, setReason] = useState("");
  const [expiresOn, setExpiresOn] = useState<string | null>(null);
  const [errors, setErrors] = useState<CompErrors>({});
  const [now] = useState(() => new Date());
  const bounds = compBounds(now);
  const e = b.comp.errors;

  const close = () => {
    actions.setCompFor(null);
    setReason("");
    setExpiresOn(null);
    setErrors({});
  };

  return (
    <FormDialog
      open={!!target}
      title={target ? b.comp.title(target.name) : b.actions.comp}
      description={b.comp.description}
      submitLabel={b.comp.submit}
      errorMessage={b.comp.failed}
      onClose={close}
      onSubmit={async () => {
        if (!target) return;
        const found = validateComp({ reason, expiresOn }, new Date());
        setErrors(found);
        if (Object.keys(found).length || !expiresOn) return false;
        const failed = await actions.comp(target, reason, expiresOn);
        if (typeof failed === "string") return failed;
        close();
      }}
    >
      <DatePicker
        label={b.comp.expires}
        required
        value={expiresOn}
        onChange={(value) => {
          setExpiresOn(value);
          setErrors((prev) => ({ ...prev, expiresOn: undefined }));
        }}
        min={bounds.min}
        max={bounds.max}
        hint={b.comp.expiresHint}
        error={errors.expiresOn ? { required: e.dateRequired, past: e.datePast, tooFar: e.dateTooFar }[errors.expiresOn] : undefined}
      />
      <TextareaField
        label={b.comp.reason}
        required
        hint={b.comp.reasonHint}
        value={reason}
        onChange={(event) => {
          setReason(event.target.value);
          setErrors((prev) => ({ ...prev, reason: undefined }));
        }}
        maxLength={REASON_MAX}
        showCount
        rows={3}
        autoGrow
        maxRows={6}
        resizable={false}
        error={errors.reason ? (errors.reason === "required" ? e.reasonRequired : e.reasonTooLong) : undefined}
      />
    </FormDialog>
  );
}
