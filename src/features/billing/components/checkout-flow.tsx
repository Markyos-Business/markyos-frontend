"use client";

import { useRef } from "react";
import { PayPalButtons, PayPalScriptProvider, usePayPalScriptReducer } from "@paypal/react-paypal-js";
import { AlertBanner, Button, Icon, useDialog, useToast } from "@/components/ui";
import { api } from "@/lib/api/client";
import type { Workspace } from "@/types";
/** Public sandbox/live client id; the plan and price never come from here. */
const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? "";
import { startResume } from "../api/billing.api";
import { billingCopy, type BillingCopy } from "../copy";
import { billingErrorText } from "../hooks/use-plan-actions";
import { useCheckoutFlow } from "../hooks/use-checkout-flow";

/**
 * PayPal's button and what happens after it, in place (billing epic 2.5):
 * the plan and the brand link come from our server; approval hands the
 * subscription id to the server, then we wait for PayPal (2.6).
 *
 * `mode="resume"` (3.4): the server creates the subscription, starting when
 * the paid month ends, and the button only asks PayPal to approve it.
 */
export function CheckoutFlow({
  ws,
  isAr,
  copy,
  onActive,
  mode = "subscribe",
}: {
  ws: Workspace;
  isAr: boolean;
  copy: BillingCopy;
  onActive?: () => void;
  mode?: "subscribe" | "resume";
}) {
  const { showToast } = useToast();
  const { confirm } = useDialog();
  // Cancelling stops PayPal billing: it asks first, like every destructive action.
  const cancel = async () => {
    const ok = await confirm({
      title: copy.state.cancelAsk,
      body: copy.state.cancelAskBody,
      confirmLabel: copy.state.cancel,
      cancelLabel: copy.state.keepWaiting,
      tone: "danger",
      isAr,
    });
    if (ok) await flow.cancel();
  };
  const flow = useCheckoutFlow(ws, onActive);
  const reported = useRef(false);

  if (!PAYPAL_CLIENT_ID) return <p className="text-body text-text-muted">{copy.unavailable}</p>;
  if (flow.state === "confirming") {
    return (
      <p role="status" className="flex items-center gap-space-3 text-body text-text">
        <Icon name="clock" size={18} className="text-accent-text" />
        {copy.state.confirming}
      </p>
    );
  }
  if (flow.state === "active") return <AlertBanner tone="success" message={copy.state.active} />;
  if (flow.state === "slow") {
    return (
      <div className="flex flex-col gap-space-4">
        <AlertBanner tone="info" message={copy.state.slow} />
        <div className="flex flex-wrap gap-ctl-row">
          <Button variant="secondary" onClick={flow.keepWaiting}>{copy.state.keepWaiting}</Button>
          <Button variant="ghost" onClick={() => void cancel()}>{copy.state.cancel}</Button>
        </div>
      </div>
    );
  }
  if (flow.state === "cancelled") return <AlertBanner tone="info" message={copy.state.cancelled} />;
  if (flow.state === "refused") return <AlertBanner tone="danger" message={copy.state.refused} />;

  return (
    <div className="flex flex-col gap-space-3">
      {flow.state === "failed" && <AlertBanner tone="danger" message={copy.state.failed} />}
      <PayPalScriptProvider
        options={{ clientId: PAYPAL_CLIENT_ID, vault: true, intent: "subscription", components: "buttons", locale: isAr ? "ar_SA" : "en_US" }}
      >
        <PayPalButtons
          fundingSource="paypal"
          style={{ layout: "horizontal", shape: "rect", color: "blue", label: "subscribe", height: 40, tagline: false }}
          createSubscription={async (_data, actions) => {
            reported.current = false;
            try {
              if (mode === "resume") {
                // Server-made, with the start date and price on it: approve only.
                const { subscriptionId } = await startResume(ws.id);
                return subscriptionId;
              }
              // Only the brand: the server picks the plan and price (C1).
              const { planId, customId } = await api<{ planId: string; customId: string }>("/billing/paypal/start/", {
                method: "POST",
                body: { brandId: ws.id },
              });
              return await actions.subscription.create({ plan_id: planId, custom_id: customId });
            } catch (error) {
              reported.current = true;
              // Refusal codes (nothing_to_resume) in the reader's language.
              showToast(billingErrorText(error, isAr, { en: billingCopy(false).state.failed, ar: billingCopy(true).state.failed }), "danger");
              throw error;
            }
          }}
          onApprove={async (data) => {
            if (data.subscriptionID) await flow.approved(data.subscriptionID);
          }}
          onError={() => {
            if (!reported.current) showToast(copy.state.failed, "danger");
          }}
        />
        <ScriptFailed copy={copy} />
      </PayPalScriptProvider>
    </div>
  );
}

function ScriptFailed({ copy }: { copy: BillingCopy }) {
  const [{ isRejected }] = usePayPalScriptReducer();
  return isRejected ? <p className="text-caption text-text-muted">{copy.unavailable}</p> : null;
}
