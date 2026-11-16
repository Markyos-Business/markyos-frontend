"use client";

import { AlertBanner, Button, PageHeader, Skeleton } from "@/components/ui";
import { ACCOUNT_TYPE_LABELS, AR_ACCOUNT_TYPE_LABELS, AR_PLAN_LABELS, AR_STAGE_LABELS, PLAN_LABELS, STAGE_LABELS, STAGE_ORDER } from "../../constants";
import { useAdminLang } from "../../hooks/shared/use-admin-lang";
import { useAdminStats } from "../../hooks/shared/use-admin-stats";
import { useRequest } from "@/hooks/useRequest";
import { getDashboardActivity } from "../../api/admin.api";
import { NeedsAttention } from "./needs-attention";
import { RecentActivity } from "./recent-activity";
import { Breakdown } from "./breakdown";
import { SignupsChart } from "./signups-chart";
import { DashboardSummary } from "./dashboard-summary";

export function AdminDashboardView() {
  const { data, error, loading, reload } = useAdminStats();
  const activity = useRequest(getDashboardActivity, "dashboard-activity");
  const refresh = () => { reload(); activity.reload(); };
  const { isAr, lang } = useAdminLang();
  const t = (en: string, ar: string) => (isAr ? ar : en);

  return (
    <>
      <PageHeader
        title={t("Dashboard", "لوحة المعلومات")}
        description={t("Account growth, brand activity and follow-up in one place.", "نمو الحسابات ونشاط العلامات والمتابعة في مكان واحد.")}
        actions={<Button href="/admin/users" variant="primary" size="sm">{t("Manage users", "إدارة المستخدمين")}</Button>}
        secondaryActions={
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading || activity.loading}>
            {loading || activity.loading ? t("Refreshing…", "جارٍ التحديث…") : t("Refresh", "تحديث")}
          </Button>
        }
      />

      <AlertBanner message={error} />

      <DashboardSummary stats={data} loading={loading} isAr={isAr} />

      <div className="grid grid-cols-1 items-start gap-space-5 xl:grid-cols-3">
        <div className="min-w-0 xl:col-span-2">
          {data ? <SignupsChart signups={data.signups} lang={lang} /> : loading ? (
            <Skeleton className="h-64 w-full rounded-card" />
          ) : null}
        </div>
        <NeedsAttention stats={data} loading={loading} />
        <div className="min-w-0 xl:col-start-3 xl:row-start-2">
          <RecentActivity items={activity.data} error={activity.error} loading={activity.loading} onRetry={activity.reload} />
        </div>
        {data && (
          <div className="grid min-w-0 grid-cols-1 items-start gap-space-5 sm:grid-cols-3 xl:col-span-2 xl:col-start-1 xl:row-start-2">
            <Breakdown title={t("Accounts by type", "الحسابات حسب النوع")} empty={t("Nothing yet.", "لا شيء بعد.")} counts={data.users.byType} labels={isAr ? AR_ACCOUNT_TYPE_LABELS : ACCOUNT_TYPE_LABELS} order={["studio", "freelancer", "company", "none"]} />
            <Breakdown title={t("Brands by stage", "العلامات حسب المرحلة")} empty={t("Nothing yet.", "لا شيء بعد.")} counts={data.brands.byStage} labels={isAr ? AR_STAGE_LABELS : STAGE_LABELS} order={STAGE_ORDER} />
            <Breakdown title={t("Brands by plan", "العلامات حسب الخطة")} empty={t("Nothing yet.", "لا شيء بعد.")} counts={data.brands.byPlan} labels={isAr ? AR_PLAN_LABELS : PLAN_LABELS} />
          </div>
        )}
      </div>
    </>
  );
}
