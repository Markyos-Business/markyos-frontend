"use client";

import { useRef } from "react";
import { PayPalButtons, PayPalScriptProvider, usePayPalScriptReducer } from "@paypal/react-paypal-js";
import type { Workspace } from "@/types";
import { PAYPAL_CLIENT_ID, usePayPalSubscription } from "../../hooks/use-paypal-subscription";

/**
 * PayPal's Subscribe button for one brand's monthly plan.
 *
 * The plan and the brand link (custom_id) come from our server when the
 * buyer clicks, never from this page. Approval only hands the subscription id
 * to the server, which reads it back from PayPal before anything changes.
 * The button itself is PayPal's iframe and keeps PayPal's own styling.
 */
export function PayPalSubscribeButton({ ws, isAr, disabled }: { ws: Workspace; isAr: boolean; disabled?: boolean }) {
  const paypal = usePayPalSubscription(ws, isAr);
  // Our server's refusal (already subscribed, not configured) is the useful
  // message; PayPal then reports the same failure again, generically.
  const reported = useRef(false);
  if (!paypal.available) {
    return (
      <p className="text-caption text-text-muted">
        {isAr ? "الدفع عبر PayPal غير مُعدّ بعد." : "PayPal payments aren't set up yet."}
      </p>
    );
  }
  return (
    <PayPalScriptProvider
      options={{ clientId: PAYPAL_CLIENT_ID, vault: true, intent: "subscription", components: "buttons", locale: isAr ? "ar_SA" : "en_US" }}
    >
      <div className={paypal.busy ? "pointer-events-none opacity-60" : undefined} aria-busy={paypal.busy === "confirming" || undefined}>
        <PayPalButtons
          disabled={disabled || paypal.busy !== null}
          fundingSource="paypal"
          style={{ layout: "horizontal", shape: "rect", color: "blue", label: "subscribe", height: 40, tagline: false }}
          createSubscription={async (_data, actions) => {
            reported.current = false;
            try {
              const { planId, customId } = await paypal.start();
              return await actions.subscription.create({ plan_id: planId, custom_id: customId });
            } catch (error) {
              reported.current = true;
              paypal.failed(error);
              throw error;
            }
          }}
          onApprove={async (data) => {
            if (data.subscriptionID) paypal.confirm(data.subscriptionID);
          }}
          onError={(error) => {
            if (!reported.current) paypal.failed(error);
          }}
        />
        <ScriptFailed isAr={isAr} />
      </div>
    </PayPalScriptProvider>
  );
}

/** PayPal's script didn't load (blocked, offline, or a wrong client id). */
function ScriptFailed({ isAr }: { isAr: boolean }) {
  const [{ isRejected }] = usePayPalScriptReducer();
  if (!isRejected) return null;
  return (
    <p className="text-caption text-text-muted">
      {isAr ? "تعذّر تحميل PayPal. أعد تحميل الصفحة أو حاول لاحقًا." : "PayPal couldn't load. Reload the page or try again later."}
    </p>
  );
}
