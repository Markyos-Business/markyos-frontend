"use client";

import Link from "next/link";
import { Icon } from "@/components/ui";
import { Section, Row, Badge, EmptyHint } from "@/components/ui/composites/SectionUI/SectionUI";
import { Workspace } from "@/types";
import { formatRelative } from "@/lib/utils";

const PLAN_LABEL: Record<Workspace["billing"]["plan"], string> = {
  free: "Free",
  pass: "Project Pass",
  subscription: "Studio plan",
};

/** What each plan costs, in the same units the checkout charges. */
const PLAN_PRICE: Record<Workspace["billing"]["plan"], { amount: number; note: string }> = {
  free: { amount: 0, note: "" },
  pass: { amount: 19, note: "one-time" },
  subscription: { amount: 29, note: "per month" },
};

/*
 * Both lookups are total, which they were not before.
 *
 * Everything in this app is rehydrated from a `localStorage` blob written by
 * whatever version of the code last ran in this browser. A plan name that has
 * since been renamed or removed reaches this component as a string that is in
 * neither table, and indexing straight into them returned `undefined` — then
 * `price.amount` threw and took the whole Account page down to a blank screen,
 * with no way to reach Profile or Organisation either.
 *
 * Falling back is the right call over rendering nothing: an unrecognised plan
 * is shown by name at no price, which is a row someone can look at and ask
 * about, rather than a page that doesn't load.
 */
const priceOf = (plan: string) =>
  PLAN_PRICE[plan as Workspace["billing"]["plan"]] ?? { amount: 0, note: "" };
const labelOf = (plan: string) =>
  PLAN_LABEL[plan as Workspace["billing"]["plan"]] ?? plan;

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
  const paid = workspaces.filter((w) => w.billing.plan !== "free");
  const subscription = workspaces.find((w) => w.billing.plan === "subscription");
  const passes = workspaces.filter((w) => w.billing.plan === "pass");

  const monthly = subscription ? PLAN_PRICE.subscription.amount : 0;
  const oneTimeTotal = passes.length * PLAN_PRICE.pass.amount;

  return (
    <>
      <Section title="Subscription" icon="credit-card">
        {subscription ? (
          <Row
            label="Studio plan — active"
            hint={`$${PLAN_PRICE.subscription.amount} per month · started ${formatRelative(subscription.billing.purchasedAt ?? subscription.updatedAt)} · unlocks every brand in this account.`}
            right={<Badge tone="success">Active</Badge>}
          />
        ) : (
          <Row
            label="No subscription"
            hint="Brands are unlocked one at a time with a Project Pass. A Studio plan unlocks all of them and is bought from any brand's Settings."
            right={<Badge tone="neutral">None</Badge>}
          />
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Tile value={`$${monthly}`} label="Recurring, per month" />
          <Tile value={`$${oneTimeTotal}`} label={`One-time, ${passes.length} pass${passes.length === 1 ? "" : "es"}`} />
          <Tile value={String(paid.length)} label={`Paid of ${workspaces.length} brand${workspaces.length === 1 ? "" : "s"}`} />
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
                  className="flex items-center gap-3 py-3"
                  style={i > 0 ? { boxShadow: "inset 0 1px 0 var(--hairline)" } : undefined}
                >
                  <Link
                    href={`/w/${w.slug}/settings`}
                    dir="auto"
                    className="mk-tap bidi-auto flex-1 min-w-0 truncate text-[13px] font-medium"
                  >
                    {w.name}
                  </Link>
                  <span className="text-[12px] w-[120px] shrink-0" style={{ color: "var(--text-muted)" }}>
                    {w.billing.purchasedAt ? formatRelative(w.billing.purchasedAt) : "—"}
                  </span>
                  <span
                    className="text-[12px] w-[70px] shrink-0 text-end"
                    style={{ fontFamily: "ui-monospace, Menlo, monospace", color: price.amount ? "var(--text)" : "var(--text-faint)" }}
                  >
                    {price.amount ? `$${price.amount}` : "—"}
                  </span>
                  <span className="w-[110px] shrink-0 flex justify-end">
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
        <p className="text-[11.5px] leading-[1.5] flex items-start gap-2" style={{ color: "var(--text-faint)" }}>
          <Icon name="info-circle" size={13} style={{ marginTop: 1, flexShrink: 0 }} />
          Checkout runs through Stripe in test mode. Receipts and invoices are issued by Stripe and
          sent to your email — this page shows what each brand is on, not a copy of those documents.
        </p>
      </Section>
    </>
  );
}

function Tile({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl p-3.5 flex flex-col gap-1" style={{ background: "var(--surface-2)" }}>
      <span className="text-[22px] font-semibold" style={{ fontFamily: "var(--font-display)" }}>
        {value}
      </span>
      <span className="text-[11px]" style={{ color: "var(--text-faint)" }}>{label}</span>
    </div>
  );
}
