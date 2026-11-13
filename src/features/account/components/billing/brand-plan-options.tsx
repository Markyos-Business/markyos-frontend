"use client";

import { API_ENABLED } from "@/lib/api/client";
import { Badge, Button, Row, Section } from "@/components/ui";
import { formatRelative } from "@/lib/utils";
import type { Workspace } from "@/types";
import { useCheckout } from "../../hooks/use-checkout";
import { PlanCard } from "./plan-card";

type BrandPlanOptionsProps = { ws: Workspace; typeLabel: string; prices: { pass: number; subscription: number }; isAr: boolean };

/** One billing location: per-brand plans and the verified checkout flow. */
export function BrandPlanOptions({ ws, typeLabel, prices, isAr }: BrandPlanOptionsProps) {
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const planName = isAr ? `خطة ${typeLabel}` : `${typeLabel} plan`;
  const { loading, managing, checkout, manageSubscription } = useCheckout(ws);
  const { plan, purchasedAt } = ws.billing;
  return (
    <Section title={isAr ? `خطة ${ws.name}` : `${ws.name} plan`} icon="credit-card">
      <Row
        label={t("Current plan", "الخطة الحالية")}
        hint={
          purchasedAt
            ? isAr ? `مفعّلة منذ ${formatRelative(purchasedAt)}` : `Active since ${formatRelative(purchasedAt)}`
            : t("No active plan — this guideline isn't shareable until a plan is active.", "لا توجد خطة مفعّلة، ولا يمكن مشاركة هذا الدليل حتى تُفعَّل خطة.")
        }
        right={
          <Badge tone={plan === "free" ? "neutral" : "accent"}>{plan === "pass" ? t("Project Pass", "تصريح المشروع") : plan === "subscription" ? planName : t("Free", "مجانية")}</Badge>
        }
      />
      {ws.billing.subscriptionStatus && (
        <Button variant="outline" onClick={manageSubscription} disabled={managing}>
          {managing ? t("Opening billing…", "جارٍ فتح الفوترة…") : t("Manage subscription", "إدارة الاشتراك")}
        </Button>
      )}
      <div className="mt-1 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <PlanCard
          enabled={API_ENABLED}
          name={t("Project Pass", "تصريح المشروع")}
          price={`$${prices.pass}`}
          period={t("one-time", "لمرة واحدة")}
          description={t("Unlock sharing for this guideline. No recurring charge.", "يفتح مشاركة هذا الدليل وحده، دون رسوم متكررة.")}
          isAr={isAr}
          active={plan === "pass"}
          loading={loading === "pass"}
          onSelect={() => checkout("pass")}
        />
        <PlanCard
          enabled={API_ENABLED}
          name={planName}
          price={`$${prices.subscription}`}
          period={t("/month", "/شهريًا")}
          description={t("A monthly plan for this brand's guideline.", "خطة شهرية لدليل هذه العلامة.")}
          isAr={isAr}
          active={plan === "subscription"}
          loading={loading === "subscription"}
          onSelect={() => checkout("subscription")}
        />
      </div>
      <p className="text-[12px] text-text-faint">
        {t("Plans apply to this brand. Payments are verified by Stripe before activation.", "تُعالج المدفوعات بأمان عبر Stripe، وتُفعَّل خطتك بعد التحقق من الدفع.")}
      </p>
    </Section>
  );
}
