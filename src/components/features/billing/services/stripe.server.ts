import Stripe from "stripe";

/**
 * Server-only. Never import this from a "use client" file — it reads the
 * secret key and will throw if it's missing, which callers use to detect
 * "no Stripe key configured yet" and fall back gracefully.
 */
export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  return new Stripe(key);
}

export const PROJECT_PASS_PRICE_USD = 19_00;
export const STUDIO_SUBSCRIPTION_PRICE_USD = 29_00;
