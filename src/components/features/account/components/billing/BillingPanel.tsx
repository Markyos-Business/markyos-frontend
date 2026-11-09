"use client";

import Link from "next/link";
import { Icon, StatTile, Section, Row, Badge, EmptyHint } from "@/components/ui";
import { useCurrentAccount } from "@/contexts/AppContext";
import { ACCOUNT_TYPES, accountTypeOf } from "@/constants/accountTypes";
import { Workspace } from "@/types";
import { formatRelative } from "@/lib/utils";
import { lookup, planTable } from "../../utils/billing";
import { useAccountLang } from "../../hooks/shared/useAccountLang";

/**
 * Everything this account is actually paying for.
 *
 * Billing is per brand in this product — a Project Pass unlocks one guideline,
 * a subscription belongs to one brand — so the view is the list of
 * brands with what each one is on, not an invented invoice history. Nothing
 * plans confirmed by the backend, and a brand without a plan says so.
 */
export function BillingPanel({ workspaces }: { workspaces: Workspace[] }) {
  const type = ACCOUNT_TYPES[accountTypeOf(useCurrentAccount())];
  const { t, isAr } = useAccountLang();
  const table = planTable(type);
  const priceOf = (plan: string) => lookup(table, plan);
  const labelOf = (plan: string) => (isAr ? lookup(table, plan).arLabel : lookup(table, plan).label);
  const paid = workspaces.filter((w) => w.billing.plan !== "free");
  const subscriptions = workspaces.filter((w) => w.billing.plan === "subscription");
  const passes = workspaces.filter((w) => w.billing.plan === "pass");

  const monthly = subscriptions.length * table.subscription.amount;
  const oneTimeTotal = passes.length * table.pass.amount;

  return (
    <>
      <Section title={t("Subscription", "الاشتراك")} icon="credit-card">
        {subscriptions.length ? (
          <Row
            label={isAr ? `${subscriptions.length} خطة شهرية مفعّلة` : `${subscriptions.length} active monthly brand plan${subscriptions.length === 1 ? "" : "s"}`}
            hint={isAr ? `$${monthly} شهريًا لهذه العلامات.` : `$${monthly} per month across these brands.`}
            right={<Badge tone="success">{t("Active", "مفعّلة")}</Badge>}
          />
        ) : (
          <Row
            label={t("No subscription", "لا يوجد اشتراك")}
            hint={t("Choose a Project Pass or a monthly plan from each brand's Settings.", "اختر تصريح مشروع أو خطة شهرية من إعدادات كل علامة.")}
            right={<Badge tone="neutral">{t("None", "لا شيء")}</Badge>}
          />
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-4">
          <StatTile value={`$${monthly}`} label={t("Recurring, per month", "متكرر شهريًا")} />
          <StatTile value={`$${oneTimeTotal}`} label={isAr ? `لمرة واحدة، ${passes.length} تصريح` : `One-time, ${passes.length} pass${passes.length === 1 ? "" : "es"}`} />
          <StatTile value={String(paid.length)} label={isAr ? `مدفوعة من ${workspaces.length} علامات` : `Paid of ${workspaces.length} brand${workspaces.length === 1 ? "" : "s"}`} />
        </div>
      </Section>

      <Section title={t("Payments by brand", "المدفوعات حسب العلامة")} icon="receipt">
        {workspaces.length === 0 ? (
          <EmptyHint>{t("No brands yet.", "لا توجد علامات بعد.")}</EmptyHint>
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
          {t(
            "Receipts and invoices are issued by Stripe and sent to your email — this page shows what each brand is on, not a copy of those documents.",
            "تصدر Stripe الإيصالات والفواتير وترسلها إلى بريدك. هذه الصفحة تعرض خطة كل علامة، لا نسخة من تلك المستندات."
          )}
        </p>
      </Section>
    </>
  );
}

