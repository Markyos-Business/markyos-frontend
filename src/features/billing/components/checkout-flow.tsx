"use client";

import { useEffect, useRef } from "react";
import { PayPalButtons, PayPalScriptProvider, usePayPalScriptReducer } from "@paypal/react-paypal-js";
import { AlertBanner, Button, Icon, Skeleton, useDialog, useToast } from "@/components/ui";
import type { Workspace } from "@/types";
import { startResume, startSubscription } from "../api/billing.api";
import { billingCopy, type BillingCopy } from "../copy";
import { billingErrorText } from "../hooks/use-plan-actions";
import { useCheckoutFlow } from "../hooks/use-checkout-flow";
import { usePlans } from "../hooks/use-plans";
import type { PromoRefusal } from "../types";
import { paypalClient } from "../utils/paypal-client";
import { promoRefusal } from "../utils/promo";

/** The build's public client id: a fallback for a server that sends none (never the plan or price). */
const ENV_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
/** A misconfiguration is reported once per page load, not on every render. */
let mismatchReported = false;

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
  code = null,
  onCodeRefused,
}: {
  ws: Workspace;
  isAr: boolean;
  copy: BillingCopy;
  onActive?: () => void;
  mode?: "subscribe" | "resume";
  /** A promo code the server accepted: start sends it back, and the server makes the subscription. */
  code?: string | null;
  /** The server refused the code at start (used up or expired since Apply). */
  onCodeRefused?: (reason: PromoRefusal) => void;
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
  const client = paypalClient(usePlans(), ENV_CLIENT_ID);
  const mismatch = client.state === "unavailable" && client.mismatch;

  useEffect(() => {
    if (!mismatch || mismatchReported) return;
    mismatchReported = true;
    console.error("PayPal client id mismatch: the server's /billing/plans/ paypal.clientId differs from NEXT_PUBLIC_PAYPAL_CLIENT_ID. Checkout is off until they match.");
  }, [mismatch]);

  if (client.state === "waiting") return <Skeleton className="h-ctl-md w-full rounded-control" />;
  if (client.state === "unavailable") return <p className="text-body text-text-muted">{copy.unavailable}</p>;
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
        options={{ clientId: client.clientId, vault: true, intent: "subscription", components: "buttons", locale: isAr ? "ar_SA" : "en_US" }}
      >
        <PayPalButtons
          fundingSource="paypal"
          style={{ layout: "horizontal", shape: "rect", color: "blue", label: "subscribe", height: 40, tagline: false }}
          // A code applied or removed changes how the subscription is made.
          forceReRender={[code]}
          createSubscription={async (_data, actions) => {
            reported.current = false;
            try {
              if (mode === "resume") {
                // Server-made, with the start date and price on it: approve only.
                const { subscriptionId } = await startResume(ws.id);
                return subscriptionId;
              }
              // Only the brand (and a code): the server picks the plan and price (C1).
              return await startSubscription(ws.id, code, (plan) => actions.subscription.create(plan));
            } catch (error) {
              reported.current = true;
              const refused = code ? promoRefusal(error) : null;
              if (refused) {
                showToast(copy.promo.reasons[refused], "danger");
                onCodeRefused?.(refused);
                throw error;
              }
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
