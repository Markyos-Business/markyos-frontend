"use client";

import { AlertBanner, Badge, Button, ConfirmButton, formatDate, LinkButton, Row, Section } from "@/components/ui";
import type { BadgeTone } from "@/components/ui";
import { formatRelative } from "@/lib/utils";
import type { Workspace } from "@/types";
import { useCheckout } from "../../hooks/use-checkout";
import { usePayPalSubscription } from "../../hooks/use-paypal-subscription";
import { PayPalSubscribeButton } from "./paypal-subscribe-button";
import { PlanCard } from "./plan-card";

type BrandPlanOptionsProps = { ws: Workspace; typeLabel: string; prices: { pass: number; subscription: number }; isAr: boolean };

/** Where a PayPal subscriber changes the card or account PayPal charges. */
const PAYPAL_AUTOPAY = process.env.NEXT_PUBLIC_PAYPAL_ENV === "live"
  ? "https://www.paypal.com/myaccount/autopay/"
  : "https://www.sandbox.paypal.com/myaccount/autopay/";

/** PayPal statuses that are still running (and can be cancelled). */
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
 * A brand that already has a Project Pass or a Stripe subscription keeps it
 * and can still manage it; new plans are PayPal subscriptions only.
 */
export function BrandPlanOptions({ ws, typeLabel, prices, isAr }: BrandPlanOptionsProps) {
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const planName = isAr ? `خطة ${typeLabel}` : `${typeLabel} plan`;
  const { managing, manageSubscription } = useCheckout(ws);
  const paypal = usePayPalSubscription(ws, isAr);
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
            "PayPal is retrying it. The plan stays active until the end of the paid period; update the payment method in PayPal to keep it.",
            "يعيد PayPal المحاولة. تبقى الخطة مفعّلة حتى نهاية الفترة المدفوعة، وحدّث وسيلة الدفع في PayPal للاحتفاظ بها.",
          )}
        />
      )}

      {running && (
        <div className="flex flex-wrap gap-space-3">
          <LinkButton variant="outline" href={PAYPAL_AUTOPAY} external>
            {t("Update payment method in PayPal", "تحديث وسيلة الدفع في PayPal")}
          </LinkButton>
          <ConfirmButton
            mode="dialog"
            variant="outline"
            disabled={paypal.busy !== null}
            onConfirm={paypal.cancel}
            dialogTitle={t("Cancel this subscription?", "إلغاء هذا الاشتراك؟")}
            dialogDescription={t(
              "PayPal stops charging. The plan stays active until the end of the period already paid for.",
              "يتوقف PayPal عن الخصم، وتبقى الخطة مفعّلة حتى نهاية الفترة المدفوعة.",
            )}
            cancelLabel={t("Keep subscription", "إبقاء الاشتراك")}
            confirmLabel={t("Cancel subscription", "إلغاء الاشتراك")}
          >
            {paypal.busy === "cancelling" ? t("Cancelling…", "جارٍ الإلغاء…") : t("Cancel subscription", "إلغاء الاشتراك")}
          </ConfirmButton>
        </div>
      )}

      {/* A subscription from before PayPal is still managed where it was bought. */}
      {!onPayPal && subscriptionStatus && (
        <Button variant="outline" onClick={manageSubscription} disabled={managing}>
          {managing ? t("Opening billing…", "جارٍ فتح الفوترة…") : t("Manage subscription", "إدارة الاشتراك")}
        </Button>
      )}

      {plan !== "subscription" && !running && (
        <div className="mt-1 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <PlanCard
            name={planName}
            price={`$${prices.subscription}`}
            period={t("/month", "/شهريًا")}
            description={t("A monthly plan for this brand's guideline. Cancel any time.", "خطة شهرية لدليل هذه العلامة، ويمكن إلغاؤها في أي وقت.")}
            isAr={isAr}
            active={false}
            action={<PayPalSubscribeButton ws={ws} isAr={isAr} />}
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
