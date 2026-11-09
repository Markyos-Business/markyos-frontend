"use client";

import { AlertBanner, Button, PageHeader, Stagger, StatTile } from "@/components/ui";
import { ACCOUNT_TYPE_LABELS, AR_ACCOUNT_TYPE_LABELS, AR_PLAN_LABELS, AR_STAGE_LABELS, PLAN_LABELS, STAGE_LABELS, STAGE_ORDER } from "../../constants";
import { useAdminLang } from "../../hooks/shared/useAdminLang";
import { useAdminStats } from "../../hooks/shared/useAdminStats";
import { Breakdown } from "./Breakdown";
import { SignupsChart } from "./SignupsChart";

export function AdminDashboardView() {
  const { data, error, loading, reload } = useAdminStats();
  const { isAr, lang } = useAdminLang();
  const t = (en: string, ar: string) => (isAr ? ar : en);

  return (
    <>
      <PageHeader
        title={t("Dashboard", "لوحة المعلومات")}
        description={t("Everyone on Markyos, and what they're building.", "كل من على ماركيوس، وما يبنونه.")}
        actions={
          <Button variant="outline" size="sm" onClick={reload} disabled={loading}>
            {loading ? t("Refreshing…", "جارٍ التحديث…") : t("Refresh", "تحديث")}
          </Button>
        }
      />

      <AlertBanner message={error} />

      {data && (
        <>
          <Stagger className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
            <StatTile value={data.users.total} label={t("Accounts", "الحسابات")} />
            <StatTile value={data.users.pending} label={t("Waiting to join", "بانتظار الانضمام")} />
            <StatTile value={data.users.activeLast30d} label={t("Active in 30 days", "نشطة خلال 30 يومًا")} />
            <StatTile value={data.users.new7d} label={t("New this week", "جديدة هذا الأسبوع")} />
            <StatTile value={data.brands.total} label={t("Brands", "العلامات")} />
            <StatTile value={data.brands.shared} label={t("Brands with a team", "علامات لها فريق")} />
            <StatTile value={data.members.people} label={t("People on teams", "أشخاص في الفرق")} />
          </Stagger>

          <SignupsChart signups={data.signups} lang={lang} />

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <Breakdown title={t("Accounts by type", "الحسابات حسب النوع")} empty={t("Nothing yet.", "لا شيء بعد.")} counts={data.users.byType} labels={isAr ? AR_ACCOUNT_TYPE_LABELS : ACCOUNT_TYPE_LABELS} order={["studio", "freelancer", "company", "none"]} />
            <Breakdown title={t("Brands by stage", "العلامات حسب المرحلة")} empty={t("Nothing yet.", "لا شيء بعد.")} counts={data.brands.byStage} labels={isAr ? AR_STAGE_LABELS : STAGE_LABELS} order={STAGE_ORDER} />
            <Breakdown title={t("Brands by plan", "العلامات حسب الخطة")} empty={t("Nothing yet.", "لا شيء بعد.")} counts={data.brands.byPlan} labels={isAr ? AR_PLAN_LABELS : PLAN_LABELS} />
          </div>

          <p className="text-caption text-text-faint">
            {isAr
              ? `${data.users.active} من ${data.users.total} حسابات نشطة · ${data.users.admins} مسؤول · ${data.users.new30d} انضموا خلال آخر 30 يومًا`
              : `${data.users.active} of ${data.users.total} accounts are active · ${data.users.admins} admin${data.users.admins === 1 ? "" : "s"} · ${data.users.new30d} joined in the last 30 days`}
          </p>
        </>
      )}
    </>
  );
}
