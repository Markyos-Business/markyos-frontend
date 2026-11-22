"use client";

import { Button, EmptyState } from "@/components/ui";

/** A direct demo link explains the feature without promising unavailable work. */
export function NeedsServer({ isAr, feature = "discovery" }: { isAr: boolean; feature?: "discovery" | "analysis" }) {
  const analysis = feature === "analysis";
  return <EmptyState icon={analysis ? "chart-line" : "clipboard-list"}
    title={isAr ? (analysis ? "تحليل موجز العلامة" : "استبيانات الاستكشاف") : (analysis ? "Brand brief analysis" : "Discovery questionnaires")}
    description={isAr
      ? (analysis ? "يجمع التحليل إجابات الاستبيان وملاحظات المكالمات في تقرير موثّق بالمصادر. غير متاح في العرض التجريبي." : "اجمع موجز العلامة من خلال استبيان يُشارك برابط. غير متاح في العرض التجريبي.")
      : (analysis ? "Turn questionnaire answers and call notes into a report with source citations. Not available in the demo." : "Collect a brand brief through a questionnaire shared by link. Not available in the demo.")}
    action={<Button href="/brands" variant="secondary">{isAr ? "العودة إلى العلامات" : "Back to brands"}</Button>} />;
}
