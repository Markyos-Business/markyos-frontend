"use client";

import { plural } from "@/lib/i18n/plural";
import { BrandPlanOptions } from "./brand-plan-options";
import Link from "next/link";
import { Icon, StatTile, Section, Row, Badge, EmptyHint, Stagger } from "@/components/ui";
import { useCurrentAccount } from "@/contexts/AppContext";
import { ACCOUNT_TYPES, accountTypeOf } from "@/constants/accountTypes";
import { useLimits, usePlans } from "@/features/billing";
import { formatMoney } from "@/lib/i18n/format";
import { Workspace } from "@/types";
import { formatRelative } from "@/lib/utils";
import { lookup, planTable } from "../../utils/billing";
import { useAccountLang } from "../../hooks/shared/use-account-lang";

/**
 * Everything this account is actually paying for.
 *
 * Billing is per brand in this product — a Project Pass unlocks one guideline,
 * a subscription belongs to one brand — so the view is the list of
 * brands with what each one is on, not an invented invoice history. Nothing
 * plans confirmed by the backend, and a brand without a plan says so.
 */
export function BillingPanel({ workspaces }: { workspaces: Workspace[] }) {
  const account = useCurrentAccount();
  const type = ACCOUNT_TYPES[accountTypeOf(account)];
  const limits = useLimits(account).type;
  const plans = usePlans();
  const { t, isAr } = useAccountLang();
  // Prices are the server's (/billing/plans/); a retired Pass shows no price.
  const each = plans ? plans.types[accountTypeOf(account)].monthly / 100 : null;
  const money = (amount: number) => formatMoney(amount, plans?.currency.toUpperCase() ?? "USD", isAr ? "ar" : "en");
  const table = planTable(type);
  const priceOf = (plan: string) => (plan === "subscription" ? each : null);
  const labelOf = (plan: string) => (isAr ? lookup(table, plan).arLabel : lookup(table, plan).label);
  const paid = workspaces.filter((w) => w.billing.plan !== "free");
  const subscriptions = workspaces.filter((w) => w.billing.plan === "subscription");

  const monthly = each === null ? null : subscriptions.length * each;

  return (
    <>
      <p className="text-body text-text-muted">{isAr ? `حد الحساب: ${limits.brands ?? "غير محدود"} علامة. الخطط المدفوعة تخص كل علامة، ولا تغيّر هذا الحد.` : `Account brand limit: ${limits.brands ?? "unlimited"}. Paid plans apply per brand and do not change this limit.`}</p>
      <div className="flex flex-col gap-space-5">{workspaces.map(ws => <BrandPlanOptions key={ws.id} ws={ws} typeLabel={isAr ? type.arLabel : type.label} isAr={isAr} />)}</div>
      <Section title={t("Subscription", "الاشتراك")} icon="credit-card">
        {subscriptions.length ? (
          <Row
            label={isAr ? `${subscriptions.length} خطة شهرية مفعّلة` : `${subscriptions.length} active monthly brand plan${subscriptions.length === 1 ? "" : "s"}`}
            hint={monthly === null ? undefined : isAr ? `${money(monthly)} شهريًا لهذه العلامات.` : `${money(monthly)} per month across these brands.`}
            right={<Badge tone="success">{t("Active", "مفعّلة")}</Badge>}
          />
        ) : (
          <Row
            label={t("No subscription", "لا يوجد اشتراك")}
            hint={t("Subscribe a brand to its monthly plan above, with PayPal.", "اشترك لعلامة في خطتها الشهرية أعلاه عبر PayPal.")}
            right={<Badge tone="neutral">{t("None", "لا شيء")}</Badge>}
          />
        )}

        <Stagger className="grid grid-cols-1 gap-space-4 sm:grid-cols-2">
          <StatTile value={monthly === null ? "—" : money(monthly)} label={t("Recurring, per month", "متكرر شهريًا")} />
          <StatTile value={String(paid.length)} label={isAr
            ? plural("ar", workspaces.length, { one: "مدفوعة من علامة واحدة", two: "مدفوعة من علامتين", few: "مدفوعة من {n} علامات", other: "مدفوعة من {n} علامة" })
            : plural("en", workspaces.length, { one: "Paid of {n} brand", other: "Paid of {n} brands" })} />
        </Stagger>
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
                  className={`flex flex-wrap items-center gap-space-4 py-space-4 ${i > 0 ? "shadow-rule-t" : ""}`}
                >
                  <Link /* button-audit-ignore: the brand's name, a text link in its billing row */
                    href={`/w/${w.slug}/overview`}
                    dir="auto"
                    className="mk-tap bidi-auto w-full sm:w-auto sm:flex-1 min-w-0 truncate text-body font-medium"
                  >
                    {w.name}
                  </Link>
                  <span className="text-caption w-30 shrink-0 text-text-muted">
                    {w.billing.purchasedAt ? formatRelative(w.billing.purchasedAt) : "—"}
                  </span>
                  <span className={`text-caption font-medium tabular-nums w-17.5 shrink-0 text-end ${price ? "text-text" : "text-text-faint"}`}>
                    {price ? money(price) : "—"}
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
            what PayPal actually charged. */}
        <p className="text-caption flex items-start gap-space-3 text-text-faint">
          <Icon name="info-circle" size={16} className="shrink-0" />
          {t(
            "PayPal sends a receipt to your email for every payment. This page shows what each brand is on, not a copy of those receipts.",
            "يرسل PayPal إيصالًا إلى بريدك عن كل دفعة. تعرض هذه الصفحة خطة كل علامة، لا نسخة من تلك الإيصالات."
          )}
        </p>
      </Section>
    </>
  );
}

