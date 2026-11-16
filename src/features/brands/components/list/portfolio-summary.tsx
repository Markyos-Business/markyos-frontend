import { MetricCard } from "@/components/ui";
import type { Lang } from "@/types/lang";

export type PortfolioCounts = { total: number; owned: number; invited: number; published: number };

/** Account-scoped totals remain stable while the user searches their brand list. */
export function PortfolioSummary({ counts, lang }: { counts: PortfolioCounts; lang: Lang }) {
  const t = (en: string, ar: string) => lang === "ar" ? ar : en;
  const cards = [
    { label: t("All brands", "كل العلامات"), value: counts.total, caption: t("Brands you can access", "علامات يمكنك الوصول إليها") },
    { label: t("Owned by you", "علامات تملكها"), value: counts.owned, caption: t("Your own brands", "علاماتك الخاصة") },
    { label: t("Shared with you", "مشاركة معك"), value: counts.invited, caption: t("Through team membership", "من خلال عضوية الفريق") },
    { label: t("Published guidelines", "أدلة منشورة"), value: counts.published, caption: t("Access settings still apply", "تبقى إعدادات الوصول سارية") },
  ];
  return <section aria-label={t("Your workspace overview", "نظرة عامة على مساحاتك")} className="grid grid-cols-2 gap-space-3 xl:grid-cols-4">
    {cards.map(card => <MetricCard key={card.label} label={card.label} value={card.value.toLocaleString("en-US")} caption={card.caption} />)}
  </section>;
}
