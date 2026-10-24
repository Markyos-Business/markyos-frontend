import Stripe from "stripe";
import { ACCOUNT_TYPES } from "@/constants/accountTypes";
import type { AccountType } from "@/types";

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

/** The price of a plan for an account type, in cents (constants/accountTypes.ts). */
export function priceInCents(type: AccountType, plan: "pass" | "subscription"): number {
  return ACCOUNT_TYPES[type].prices[plan] * 100;
}
