"use client";

import { Badge, Button, Row, Section } from "@/components/ui";
import { formatRelative } from "@/lib/utils";
import type { Workspace } from "@/types";
import { useCheckout } from "../hooks/useCheckout";
import { PlanCard } from "./PlanCard";

type BillingSectionProps = { ws: Workspace; typeLabel: string; prices: { pass: number; subscription: number }; isAr: boolean };

/** The brand's plan, the two to choose from, and the payment rails still to come. */
export function BillingSection({ ws, typeLabel, prices, isAr }: BillingSectionProps) {
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const planName = isAr ? `خطة ${typeLabel}` : `${typeLabel} plan`;
  const { loading, managing, checkout, manageSubscription } = useCheckout(ws);
  const { plan, purchasedAt } = ws.billing;
  return (
    <Section title={t("Billing", "الفوترة")} icon="credit-card">
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
          name={t("Project Pass", "تصريح المشروع")}
          price={`$${prices.pass}`}
          period={t("one-time", "لمرة واحدة")}
          description={t("Unlock the client link for this one guideline. No recurring charge.", "يفتح رابط العميل لهذا الدليل وحده، دون رسوم متكررة.")}
          isAr={isAr}
          active={plan === "pass"}
          loading={loading === "pass"}
          onSelect={() => checkout("pass")}
        />
        <PlanCard
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
        {t("Payments are processed securely by Stripe. Your plan activates after payment is verified.", "تُعالج المدفوعات بأمان عبر Stripe، وتُفعَّل خطتك بعد التحقق من الدفع.")}
      </p>
      <div className="mt-1 pt-3.5 shadow-rule-t">
        <Row
          label={t("Saudi payment rails", "وسائل الدفع السعودية")}
          hint={t("Mada · SAR · Apple Pay via a SAMA-licensed processor (Tap, HyperPay or Moyasar)", "مدى · ريال · Apple Pay عبر معالج مرخّص من ساما (Tap أو HyperPay أو Moyasar)")}
          right={<Badge tone="neutral">{t("Planned — v3.0", "مخطط له — الإصدار 3.0")}</Badge>}
        />
      </div>
    </Section>
  );
}
