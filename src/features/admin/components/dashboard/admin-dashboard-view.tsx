"use client";

import { AlertBanner, Button, Skeleton } from "@/components/ui";
import { ACCOUNT_TYPE_LABELS, AR_ACCOUNT_TYPE_LABELS, AR_PLAN_LABELS, AR_STAGE_LABELS, PLAN_LABELS, STAGE_LABELS, STAGE_ORDER } from "../../constants";
import { useAdminLang } from "../../hooks/shared/use-admin-lang";
import { useAdminStats } from "../../hooks/shared/use-admin-stats";
import { useRequest } from "@/hooks/useRequest";
import { getDashboardActivity } from "../../api/admin.api";
import { NeedsAttention } from "./needs-attention";
import { RecentActivity } from "./recent-activity";
import { Breakdown } from "./breakdown";
import { SignupsChart } from "./signups-chart";
import { DashboardHeader, DashboardProvider } from "@/components/ui";
import { DashboardSummary } from "./dashboard-summary";

export function AdminDashboardView() {
  const { data, error, loading, reload } = useAdminStats();
  const activity = useRequest(getDashboardActivity, "dashboard-activity");
  const refresh = () => { reload(); activity.reload(); };
  const { isAr, lang } = useAdminLang();
  const t = (en: string, ar: string) => (isAr ? ar : en);

  return (
    <DashboardProvider lang={lang}>
      <DashboardHeader
        title={t("Dashboard", "لوحة المعلومات")}
        subtitle={t("Account growth, brand activity and follow-up in one place.", "نمو الحسابات ونشاط العلامات والمتابعة في مكان واحد.")}
        primaryAction={<Button href="/admin/users" variant="primary" size="sm">{t("Manage users", "إدارة المستخدمين")}</Button>}
        secondaryActions={
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading || activity.loading}>
            {loading || activity.loading ? t("Refreshing…", "جارٍ التحديث…") : t("Refresh", "تحديث")}
          </Button>
        }
      />

      <AlertBanner message={error} />

      <DashboardSummary stats={data} loading={loading} isAr={isAr} />

      <div className="grid grid-cols-1 items-start gap-space-5 xl:grid-cols-3">
        <div className="contents xl:col-span-2 xl:flex xl:min-w-0 xl:flex-col xl:gap-space-5">
          <div className="order-1 min-w-0">
            {data ? <SignupsChart signups={data.signups} lang={lang} /> : loading ? (
              <Skeleton className="h-64 w-full rounded-card" />
            ) : null}
          </div>
          {data && (
            <div className="order-4 grid min-w-0 grid-cols-1 items-start gap-space-5 sm:grid-cols-3">
              <Breakdown title={t("Accounts by type", "الحسابات حسب النوع")} empty={t("Nothing yet.", "لا شيء بعد.")} counts={data.users.byType} labels={isAr ? AR_ACCOUNT_TYPE_LABELS : ACCOUNT_TYPE_LABELS} order={["studio", "freelancer", "company", "none"]} />
              <Breakdown title={t("Brands by stage", "العلامات حسب المرحلة")} empty={t("Nothing yet.", "لا شيء بعد.")} counts={data.brands.byStage} labels={isAr ? AR_STAGE_LABELS : STAGE_LABELS} order={STAGE_ORDER} />
              <Breakdown title={t("Brands by plan", "العلامات حسب الخطة")} empty={t("Nothing yet.", "لا شيء بعد.")} counts={data.brands.byPlan} labels={isAr ? AR_PLAN_LABELS : PLAN_LABELS} />
            </div>
          )}
        </div>
        <div className="contents xl:flex xl:min-w-0 xl:flex-col xl:gap-space-5">
          <div className="order-2 min-w-0"><NeedsAttention stats={data} loading={loading} /></div>
          <div className="order-3 min-w-0">
            <RecentActivity items={activity.data} error={activity.error} loading={activity.loading} onRetry={activity.reload} />
          </div>
        </div>
      </div>
    </DashboardProvider>
  );
}
