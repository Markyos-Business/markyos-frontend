import { NextRequest, NextResponse } from "next/server";
import { getStripe, PROJECT_PASS_PRICE_USD, STUDIO_SUBSCRIPTION_PRICE_USD } from "@/lib/stripe";

/**
 * Creates a real Stripe Checkout Session in test mode for the v1.0 $19
 * Project Pass (one-time) or the Studio subscription (monthly).
 *
 * There's no server-side database in this build — the app's workspace
 * state lives in the browser (see lib/store.tsx). So this route only
 * handles payment; on success Stripe redirects back to the workspace
 * settings page with `?checkout=success&session_id=...`, and the client
 * marks the plan as purchased in local state itself. A real production
 * build would confirm purchase via a Stripe webhook against a real
 * database instead of trusting the redirect — flagged here, not built,
 * since there's nothing yet for a webhook to persist to.
 */
export async function POST(req: NextRequest) {
  let body: { slug?: string; plan?: "pass" | "subscription" };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { slug, plan } = body;
  if (!slug || (plan !== "pass" && plan !== "subscription")) {
    return NextResponse.json({ error: "Missing slug or plan." }, { status: 400 });
  }

  let stripe;
  try {
    stripe = getStripe();
  } catch {
    return NextResponse.json(
      {
        error:
          "Stripe isn't configured yet. Add STRIPE_SECRET_KEY to .env.local (a test-mode secret key from your Stripe dashboard) and restart the dev server.",
      },
      { status: 501 }
    );
  }

  const origin = req.headers.get("origin") ?? new URL(req.url).origin;
  const successUrl = `${origin}/w/${slug}/settings?checkout=success&plan=${plan}&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${origin}/w/${slug}/settings?checkout=cancelled`;

  try {
    const session = await stripe.checkout.sessions.create(
      plan === "pass"
        ? {
            mode: "payment",
            line_items: [
              {
                price_data: {
                  currency: "usd",
                  unit_amount: PROJECT_PASS_PRICE_USD,
                  product_data: {
                    name: "Markyos Project Pass",
                    description: `One-time client access pass — ${slug}`,
                  },
                },
                quantity: 1,
              },
            ],
            success_url: successUrl,
            cancel_url: cancelUrl,
          }
        : {
            mode: "subscription",
            line_items: [
              {
                price_data: {
                  currency: "usd",
                  unit_amount: STUDIO_SUBSCRIPTION_PRICE_USD,
                  recurring: { interval: "month" },
                  product_data: {
                    name: "Markyos Studio plan",
                    description: `Monthly subscription — ${slug}`,
                  },
                },
                quantity: 1,
              },
            ],
            success_url: successUrl,
            cancel_url: cancelUrl,
          }
    );
    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Stripe checkout failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
