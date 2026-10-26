"use client";

import { Badge, Row, Section } from "@/components/ui";
import { formatRelative } from "@/lib/utils";
import type { Workspace } from "@/types";
import { useCheckout } from "../hooks/useCheckout";
import { PlanCard } from "./PlanCard";

type BillingSectionProps = { ws: Workspace; typeLabel: string; prices: { pass: number; subscription: number } };

/** The brand's plan, the two to choose from, and the payment rails still to come. */
export function BillingSection({ ws, typeLabel, prices }: BillingSectionProps) {
  const { loading, checkout } = useCheckout(ws);
  const { plan, purchasedAt } = ws.billing;
  return (
    <Section title="Billing" icon="credit-card">
      <Row
        label="Current plan"
        hint={purchasedAt ? `Active since ${formatRelative(purchasedAt)}` : "No plan purchased yet — this guideline isn't shareable until one is."}
        right={
          <Badge tone={plan === "free" ? "neutral" : "accent"}>{plan === "pass" ? "Project Pass" : plan === "subscription" ? `${typeLabel} plan` : "Free"}</Badge>
        }
      />
      <div className="mt-1 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <PlanCard
          name="Project Pass"
          price={`$${prices.pass}`}
          period="one-time"
          description="Unlock the client link for this one guideline. No recurring charge."
          active={plan === "pass"}
          loading={loading === "pass"}
          onSelect={() => checkout("pass")}
        />
        <PlanCard
          name={`${typeLabel} plan`}
          price={`$${prices.subscription}`}
          period="/month"
          description="Unlock every guideline in your account, plus priority sign-off pins."
          active={plan === "subscription"}
          loading={loading === "subscription"}
          onSelect={() => checkout("subscription")}
        />
      </div>
      <p className="text-[12px] text-text-faint">Checkout runs through Stripe in test mode — use card 4242 4242 4242 4242, any future date and CVC.</p>
      <div className="mt-1 pt-3.5 shadow-rule-t">
        <Row label="Saudi payment rails" hint="Mada · SAR · Apple Pay via a SAMA-licensed processor (Tap, HyperPay or Moyasar)" right={<Badge tone="neutral">Planned — v3.0</Badge>} />
      </div>
    </Section>
  );
}
