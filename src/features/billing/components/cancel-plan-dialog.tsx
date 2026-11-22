"use client";

import { useState } from "react";
import { AlertBanner, Button, formatDayMonth, Modal, RadioField, TextareaField } from "@/components/ui";
import type { Billing, Workspace } from "@/types";
import { cancelPlan } from "../api/billing.api";
import { billingCopy } from "../copy";
import { billingErrorText } from "../hooks/use-plan-actions";
import { CANCEL_NOTE_MAX, CANCEL_REASONS, type CancelReason } from "../types";

type Step = "reason" | "offer";

/**
 * Cancelling at the period end (billing epic 3.4), in two steps: why
 * (required), then what it means, which is the confirmation. There is no
 * discount: the offer is only that the plan stays to the end of the paid
 * month either way (or, on a brand already on Free, that PayPal stops
 * charging). `endsAt` is the server's date.
 */
export function CancelPlanDialog({
  ws,
  isAr,
  endsAt,
  onFree = false,
  onClose,
  onCancelled,
}: {
  ws: Workspace;
  isAr: boolean;
  endsAt: number | null;
  /** The brand is already on Free (suspended after the grace): cancelling only stops PayPal charging. */
  onFree?: boolean;
  onClose: () => void;
  onCancelled: (billing: Billing) => void;
}) {
  const copy = billingCopy(isAr);
  const words = copy.cancelFlow;
  const [step, setStep] = useState<Step>("reason");
  const [reason, setReason] = useState<CancelReason | "">("");
  const [note, setNote] = useState("");
  const [missing, setMissing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const date = endsAt ? formatDayMonth(new Date(endsAt), isAr ? "ar" : "en", true) : null;

  const next = () => {
    if (!reason) {
      setMissing(true);
      return;
    }
    setStep("offer");
  };

  const confirm = async () => {
    if (!reason || busy) return;
    setBusy(true);
    setError(null);
    try {
      const answer = await cancelPlan(ws.id, reason, note);
      onCancelled(answer.billing);
    } catch (err) {
      setError(billingErrorText(err, isAr, { en: billingCopy(false).cancelFlow.failed, ar: billingCopy(true).cancelFlow.failed }));
      setBusy(false);
    }
  };

  return (
    <Modal
      onClose={onClose}
      busy={busy}
      size="sm"
      dir={isAr ? "rtl" : "ltr"}
      title={step === "reason" ? words.title(ws.name) : words.offerTitle}
      description={step === "reason" ? (onFree ? words.descriptionFree : words.description) : undefined}
      footer={
        step === "reason" ? (
          <>
            <Button variant="secondary" onClick={onClose}>
              {words.keep}
            </Button>
            <Button variant="primary" onClick={next}>
              {words.continue}
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" onClick={() => setStep("reason")} disabled={busy}>
              {words.back}
            </Button>
            <Button variant="secondary" onClick={onClose} disabled={busy}>
              {words.keep}
            </Button>
            <Button variant="danger" onClick={() => void confirm()} loading={busy} loadingText={words.cancelling}>
              {words.confirm}
            </Button>
          </>
        )
      }
    >
      {step === "reason" ? (
        <div className="flex flex-col gap-field-stack">
          <RadioField
            label={words.reasonLabel}
            orientation="vertical"
            required
            value={reason}
            onChange={(value) => {
              setReason(value as CancelReason);
              setMissing(false);
            }}
            options={CANCEL_REASONS.map((value) => ({ value, label: words.reasons[value] }))}
            error={missing ? words.reasonRequired : undefined}
          />
          <TextareaField
            label={words.noteLabel}
            optional
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={CANCEL_NOTE_MAX}
            showCount
            rows={3}
            autoGrow
            maxRows={6}
            resizable={false}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-space-5">
          <AlertBanner message={error} />
          <p className="text-body text-text">{onFree ? words.offerFree(ws.name) : words.offer(date)}</p>
        </div>
      )}
    </Modal>
  );
}
