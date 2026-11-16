import { MetricCard, Stagger } from "@/components/ui";
import type { AdminStats } from "../../types";

/** The four platform totals; activation and team counts explain their scope. */
export function DashboardSummary({ stats, loading, isAr }: {
  stats: AdminStats | null;
  loading: boolean;
  isAr: boolean;
}) {
  const t = (en: string, ar: string) => isAr ? ar : en;
  const number = (value: number | undefined) => value?.toLocaleString("en-US") ?? "—";
  const cards = [
    {
      label: t("All accounts", "كل الحسابات"),
      value: stats ? number(stats.users.total + stats.users.pending) : "—",
      note: stats ? t(`${number(stats.users.pending)} awaiting setup`, `${number(stats.users.pending)} بانتظار الإعداد`) : t("Includes accounts awaiting setup", "تشمل الحسابات بانتظار الإعداد"),
    },
    {
      label: t("Signed in · 30 days", "سجّلوا الدخول · 30 يومًا"),
      value: number(stats?.users.activeLast30d),
      note: t("Unique accounts", "حسابات فريدة"),
    },
    {
      label: t("Brands", "العلامات"),
      value: number(stats?.brands.total),
      note: stats ? t(`${number(stats.brands.shared)} with a team`, `${number(stats.brands.shared)} لديها فريق`) : t("Across the platform", "عبر المنصة"),
    },
    {
      label: t("People on teams", "أشخاص في الفرق"),
      value: number(stats?.members.people),
      note: t("Unique people", "أشخاص فريدون"),
    },
  ];
  return (
    <section aria-label={t("Platform overview", "نظرة عامة على المنصة")} aria-busy={loading}>
      <Stagger className="grid grid-cols-2 gap-space-3 xl:grid-cols-4">
        {cards.map((card) => <MetricCard key={card.label} label={card.label} value={card.value} caption={card.note} state={loading && !stats ? "loading" : "ready"} />)}
      </Stagger>
    </section>
  );
}
