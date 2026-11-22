import type { Plans } from "../types";

/** What PayPal's button may load: a client id, or why not. */
export type PaypalClient =
  | { state: "waiting" }
  | { state: "ready"; clientId: string }
  | { state: "unavailable"; mismatch: boolean };

/**
 * The PayPal client id the checkout loads (billing epic 4.2). The server's
 * id comes first: it's the app the server bills through. The build's
 * NEXT_PUBLIC_PAYPAL_CLIENT_ID is a fallback only when the server sends
 * none. Both set and different is a misconfiguration: a subscription
 * approved in one PayPal app can't be read back from the other, so nothing
 * loads.
 */
export function paypalClient(plans: Plans | null, envClientId: string | undefined): PaypalClient {
  if (!plans) return { state: "waiting" };
  const server = plans.paypal?.clientId?.trim() || null;
  const env = envClientId?.trim() || null;
  if (server && env && server !== env) return { state: "unavailable", mismatch: true };
  const clientId = server ?? env;
  return clientId ? { state: "ready", clientId } : { state: "unavailable", mismatch: false };
}
