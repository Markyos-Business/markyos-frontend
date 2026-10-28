"use client";

import Link from "next/link";
import { Icon, StatTile, Section, Row, Badge, EmptyHint } from "@/components/ui";
import { useCurrentAccount } from "@/contexts/AppContext";
import { ACCOUNT_TYPES, accountTypeOf } from "@/constants/accountTypes";
import { Workspace } from "@/types";
import { formatRelative } from "@/lib/utils";
import { lookup, planTable } from "../../utils/billing";

/**
 * Everything this account is actually paying for.
 *
 * Billing is per brand in this product — a Project Pass unlocks one guideline,
 * a Studio subscription unlocks the account — so the honest view is the list of
 * brands with what each one is on, not an invented invoice history. Nothing
 * here is fabricated: every row is a real `billing` record written by a real
 * checkout, and a brand that has never been paid for says so.
 */
export function BillingPanel({ workspaces }: { workspaces: Workspace[] }) {
  const type = ACCOUNT_TYPES[accountTypeOf(useCurrentAccount())];
  const table = planTable(type);
  const priceOf = (plan: string) => lookup(table, plan);
  const labelOf = (plan: string) => lookup(table, plan).label;
  const paid = workspaces.filter((w) => w.billing.plan !== "free");
  const subscription = workspaces.find((w) => w.billing.plan === "subscription");
  const passes = workspaces.filter((w) => w.billing.plan === "pass");

  const monthly = subscription ? table.subscription.amount : 0;
  const oneTimeTotal = passes.length * table.pass.amount;

  return (
    <>
      <Section title="Subscription" icon="credit-card">
        {subscription ? (
          <Row
            label={`${table.subscription.label} — active`}
            hint={`$${table.subscription.amount} per month · started ${formatRelative(subscription.billing.purchasedAt ?? subscription.updatedAt)} · unlocks every brand in this account.`}
            right={<Badge tone="success">Active</Badge>}
          />
        ) : (
          <Row
            label="No subscription"
            hint={`Brands are unlocked one at a time with a Project Pass. A ${table.subscription.label} unlocks all of them and is bought from any brand's Settings.`}
            right={<Badge tone="neutral">None</Badge>}
          />
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-4">
          <StatTile value={`$${monthly}`} label="Recurring, per month" />
          <StatTile value={`$${oneTimeTotal}`} label={`One-time, ${passes.length} pass${passes.length === 1 ? "" : "es"}`} />
          <StatTile value={String(paid.length)} label={`Paid of ${workspaces.length} brand${workspaces.length === 1 ? "" : "s"}`} />
        </div>
      </Section>

      <Section title="Payments by brand" icon="receipt">
        {workspaces.length === 0 ? (
          <EmptyHint>No brands yet.</EmptyHint>
        ) : (
          <div className="flex flex-col">
            {workspaces.map((w, i) => {
              const price = priceOf(w.billing.plan);
              return (
                <div
                  key={w.id}
                  className={`flex items-center gap-space-4 py-space-4 ${i > 0 ? "shadow-rule-t" : ""}`}
                >
                  <Link
                    href={`/w/${w.slug}/settings`}
                    dir="auto"
                    className="mk-tap bidi-auto flex-1 min-w-0 truncate text-body font-medium"
                  >
                    {w.name}
                  </Link>
                  <span className="text-caption w-30 shrink-0 text-text-muted">
                    {w.billing.purchasedAt ? formatRelative(w.billing.purchasedAt) : "—"}
                  </span>
                  <span className={`text-caption font-medium tabular-nums w-17.5 shrink-0 text-end ${price.amount ? "text-text" : "text-text-faint"}`}>
                    {price.amount ? `$${price.amount}` : "—"}
                  </span>
                  <span className="w-27.5 shrink-0 flex justify-end">
                    <Badge tone={w.billing.plan === "free" ? "neutral" : "accent"}>{labelOf(w.billing.plan)}</Badge>
                  </span>
                </div>
              );
            })}
          </div>
        )}
        {/* Receipts live with the processor that issued them. Reprinting them
            here would mean inventing them, since this build has no record of
            what Stripe actually charged. */}
        <p className="text-caption flex items-start gap-space-3 text-text-faint">
          <Icon name="info-circle" size={16} className="shrink-0" />
          Checkout runs through Stripe in test mode. Receipts and invoices are issued by Stripe and
          sent to your email — this page shows what each brand is on, not a copy of those documents.
        </p>
      </Section>
    </>
  );
}

