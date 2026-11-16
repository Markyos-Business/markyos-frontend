"use client";

import { useState } from "react";
import { BarChartCard, PeriodSelect, type DashboardPeriod } from "@/components/ui";
import type { AdminStats } from "../../types";
import type { Lang } from "@/types/lang";

/** The API supplies 30 days. Both choices derive from that same real series. */
export function SignupsChart({ signups, lang }: { signups: AdminStats["signups"]; lang: Lang }) {
  const [period, setPeriod] = useState<DashboardPeriod>("week");
  const t = (en: string, ar: string) => lang === "ar" ? ar : en;
  const selected = period === "week" ? signups.slice(-7) : signups;
  const total = selected.reduce((sum, day) => sum + day.count, 0);
  const date = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString(lang === "ar" ? "ar-u-nu-latn" : "en", { month: "short", day: "numeric" });
  const data = period === "week" ? selected.map(day => ({ label: new Date(`${day.date}T00:00:00`).toLocaleDateString(lang === "ar" ? "ar-u-nu-latn" : "en", { weekday: "short" }), value: day.count })) : Array.from({ length: Math.ceil(selected.length / 7) }, (_, i) => {
    const days = selected.slice(i * 7, i * 7 + 7);
    return { label: `${date(days[0].date)}–${date(days[days.length - 1].date)}`, value: days.reduce((sum, day) => sum + day.count, 0) };
  });
  return <BarChartCard
    title={t("Signups", "التسجيلات")}
    as="h2"
    subtitle={selected.length ? `${date(selected[0].date)} – ${date(selected[selected.length - 1].date)}` : undefined}
    actions={<PeriodSelect value={period} onChange={setPeriod} options={["week", "month"]} labels={{ week: t("Last 7 days", "آخر 7 أيام"), month: t("Last 30 days", "آخر 30 يومًا") }} />}
    data={data}
    label={t("New accounts by period", "الحسابات الجديدة حسب الفترة")}
    unit={t("accounts", "حسابات")}
    emptyMessage={t("No signup data yet.", "لا توجد بيانات تسجيل بعد.")}
    stats={[
      { label: t("New accounts", "حسابات جديدة"), value: total.toLocaleString("en-US") },
      { label: t("Daily average", "المتوسط اليومي"), value: (selected.length ? total / selected.length : 0).toLocaleString("en-US", { maximumFractionDigits: 1 }) },
    ]}
  />;
}
