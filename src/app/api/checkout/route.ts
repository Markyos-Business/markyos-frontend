import { NextRequest, NextResponse } from "next/server";
import { getStripe, priceInCents } from "@/components/features/billing/services/stripe.server";
import { ACCOUNT_TYPES, ACCOUNT_TYPE_KEYS } from "@/constants/accountTypes";
import type { AccountType } from "@/types";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");

const isAccountType = (v: unknown): v is AccountType => ACCOUNT_TYPE_KEYS.includes(v as AccountType);

/**
 * The account type to price this checkout at.
 *
 * With a backend it is read from the account the caller's token belongs to,
 * never from the request body: otherwise anyone could name the cheapest tier.
 * A browser-only build has no server to ask, so there the body's value is
 * all there is (and that build has no real accounts to protect).
 */
async function accountTypeFor(req: NextRequest, claimed: unknown): Promise<AccountType | Response> {
  if (!API_URL) return isAccountType(claimed) ? claimed : "studio";
  const auth = req.headers.get("authorization");
  if (!auth) return NextResponse.json({ error: "Sign in to check out." }, { status: 401 });
  const me = await fetch(`${API_URL}/auth/me/`, { headers: { Authorization: auth }, cache: "no-store" }).catch(() => null);
  if (!me?.ok) return NextResponse.json({ error: "Your session has ended. Sign in again." }, { status: 401 });
  const account = (await me.json()) as { accountType?: unknown };
  return isAccountType(account.accountType) ? account.accountType : "studio";
}

/**
 * Creates a real Stripe Checkout Session in test mode for the Project Pass
 * (one-time) or the monthly plan, priced by the account type (studio,
 * freelancer or company; see constants/accountTypes.ts).
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
  let body: { slug?: string; plan?: "pass" | "subscription"; accountType?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { slug, plan } = body;
  if (!slug || (plan !== "pass" && plan !== "subscription")) {
    return NextResponse.json({ error: "Missing slug or plan." }, { status: 400 });
  }
  const type = await accountTypeFor(req, body.accountType);
  if (type instanceof Response) return type;
  const typeLabel = ACCOUNT_TYPES[type].label;

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
                  unit_amount: priceInCents(type, "pass"),
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
                  unit_amount: priceInCents(type, "subscription"),
                  recurring: { interval: "month" },
                  product_data: {
                    name: `Markyos ${typeLabel} plan`,
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
