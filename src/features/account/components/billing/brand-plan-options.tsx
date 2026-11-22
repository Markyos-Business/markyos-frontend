"use client";

import { AlertBanner, Badge, Button, formatDate, Row, Section } from "@/components/ui";
import type { BadgeTone } from "@/components/ui";
import { formatRelative } from "@/lib/utils";
import type { Workspace } from "@/types";
import { formatMoney } from "@/lib/i18n/format";
import { usePlans, useUpgrade } from "@/features/billing";
import { PlanCard } from "./plan-card";

type BrandPlanOptionsProps = { ws: Workspace; typeLabel: string; isAr: boolean };

/** PayPal statuses that are still running. */
const RUNNING = ["approval_pending", "approved", "active", "suspended"];

const STATUS: Record<string, { en: string; ar: string; tone: BadgeTone }> = {
  active: { en: "Active", ar: "مفعّل", tone: "success" },
  approval_pending: { en: "Waiting for PayPal", ar: "بانتظار PayPal", tone: "warning" },
  approved: { en: "Waiting for PayPal", ar: "بانتظار PayPal", tone: "warning" },
  suspended: { en: "Suspended", ar: "موقوف", tone: "danger" },
  cancelled: { en: "Cancelled", ar: "ملغى", tone: "neutral" },
  expired: { en: "Ended", ar: "منتهٍ", tone: "neutral" },
};

/**
 * One brand's plan: a monthly subscription through PayPal.
 *
 * Everything shown comes from the billing the server verified with PayPal.
 * Managing it (payment method, cancel, resume) is in the brand's Billing tab
 * (billing epic 3.3); this links there.
 */
export function BrandPlanOptions({ ws, typeLabel, isAr }: BrandPlanOptionsProps) {
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const planName = isAr ? `خطة ${typeLabel}` : `${typeLabel} plan`;
  const upgrade = useUpgrade();
  // The price is the server's, for the owner's account type (never a copy here).
  const plans = usePlans();
  const monthly = plans && ws.ownerAccountType ? plans.types[ws.ownerAccountType].monthly : null;
  const price = plans && monthly !== null ? formatMoney(monthly / 100, plans.currency.toUpperCase(), isAr ? "ar" : "en") : "—";
  const { plan, purchasedAt, provider, subscriptionStatus, currentPeriodEnd, paymentFailedAt } = ws.billing;
  const onPayPal = provider === "paypal" && Boolean(subscriptionStatus);
  const running = onPayPal && RUNNING.includes(subscriptionStatus ?? "");
  const status = STATUS[subscriptionStatus ?? ""];
  // "16 Dec 2026", never US order.
  const date = (ms: number) => formatDate(new Date(ms), "short", isAr ? "ar" : "en-GB");

  return (
    <Section title={isAr ? `خطة ${ws.name}` : `${ws.name} plan`} icon="credit-card">
      <Row
        label={t("Current plan", "الخطة الحالية")}
        hint={
          purchasedAt
            ? isAr ? `مفعّلة منذ ${formatRelative(purchasedAt)}` : `Active since ${formatRelative(purchasedAt)}`
            : t("No active plan. This guideline isn't shareable until a plan is active.", "لا توجد خطة مفعّلة، ولا يمكن مشاركة هذا الدليل حتى تُفعَّل خطة.")
        }
        right={
          <Badge tone={plan === "free" ? "neutral" : "accent"}>{plan === "pass" ? t("Project Pass", "تصريح المشروع") : plan === "subscription" ? planName : t("Free", "مجانية")}</Badge>
        }
      />

      {onPayPal && (
        <Row
          label={t("PayPal subscription", "اشتراك PayPal")}
          hint={
            currentPeriodEnd ? (
              subscriptionStatus === "active" ? (
                `${t("Next billing date: ", "موعد الفوترة التالي: ")}${date(currentPeriodEnd)}`
              ) : plan === "subscription" ? (
                `${t("Access until ", "الوصول متاح حتى ")}${date(currentPeriodEnd)}`
              ) : undefined
            ) : undefined
          }
          right={status ? <Badge tone={status.tone}>{isAr ? status.ar : status.en}</Badge> : undefined}
        />
      )}

      {onPayPal && paymentFailedAt && (
        <AlertBanner
          tone="warning"
          title={t("The last payment failed", "تعذّر الدفع الأخير")}
          message={t(
            "PayPal is retrying it. Update the payment method from Manage billing to keep the plan.",
            "يعيد PayPal المحاولة. حدّث وسيلة الدفع من «إدارة الفوترة» للاحتفاظ بالخطة.",
          )}
        />
      )}

      <div className="flex flex-wrap gap-ctl-row">
        <Button variant="secondary" href={`/w/${ws.slug}/settings?tab=billing`}>
          {t("Manage billing", "إدارة الفوترة")}
        </Button>
      </div>

      {/* Stripe plans are retired: honoured to the end of 2026, stopped by us on request. */}
      {!onPayPal && subscriptionStatus && (
        <p className="text-caption text-text-muted">
          {t(
            "This plan was bought before payments moved to PayPal. It stays active until 31 Dec 2026; contact us to cancel it sooner.",
            "اشتُريت هذه الخطة قبل انتقال الدفع إلى PayPal، وتبقى مفعّلة حتى 31 ديسمبر 2026. تواصل معنا لإلغائها قبل ذلك.",
          )}
        </p>
      )}

      {plan !== "subscription" && !running && (
        <div className="mt-1 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <PlanCard
            name={planName}
            price={price}
            period={t("/month", "/شهريًا")}
            description={t("A monthly plan for this brand's guideline. Cancel any time.", "خطة شهرية لدليل هذه العلامة، ويمكن إلغاؤها في أي وقت.")}
            isAr={isAr}
            active={false}
            action={
              <Button variant="primary" onClick={() => upgrade.open({ ws, reason: "billing" })}>
                {t("Subscribe", "اشترك")}
              </Button>
            }
          />
        </div>
      )}

      <p className="text-[12px] text-text-faint">
        {t(
          "Plans apply to this brand. Payments go through PayPal and the plan activates once PayPal confirms it.",
          "تخص الخطط هذه العلامة. يتم الدفع عبر PayPal، وتُفعَّل الخطة بعد أن يؤكدها PayPal.",
        )}
      </p>
    </Section>
  );
}
