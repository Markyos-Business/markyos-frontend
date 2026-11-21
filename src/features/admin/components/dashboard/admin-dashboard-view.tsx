"use client";

import { AlertBanner, Button, Icon, Skeleton } from "@/components/ui";
import { useMinBusy } from "@/hooks/useMinBusy";
import { ACCOUNT_TYPE_LABELS, AR_ACCOUNT_TYPE_LABELS, AR_PLAN_LABELS, AR_STAGE_LABELS, PLAN_LABELS, STAGE_LABELS, STAGE_ORDER } from "../../constants";
import { useAdminLang } from "../../hooks/shared/use-admin-lang";
import { errorText } from "@/lib/api/errorText";
import { useAdminStats } from "../../hooks/shared/use-admin-stats";
import { useRequest } from "@/hooks/useRequest";
import { getDashboardActivity } from "../../api/admin.api";
import { NeedsAttention } from "./needs-attention";
import { RecentActivity } from "./recent-activity";
import { Breakdown } from "./breakdown";
import { SignupsChart } from "./signups-chart";
import { DashboardHeader, DashboardProvider } from "@/components/ui";
import { WelcomeMessage } from "@/features/account";
import { DashboardSummary } from "./dashboard-summary";

export function AdminDashboardView() {
  const { data, failure, loading, reload } = useAdminStats();
  const activity = useRequest(getDashboardActivity, "dashboard-activity");
  const refresh = () => { reload(); activity.reload(); };
  // A reload has data on screen already; the first load is the skeleton's job, so the button only disables.
  const refreshing = useMinBusy((loading && data !== null) || (activity.loading && activity.data !== null));
  const { isAr, lang } = useAdminLang();
  const t = (en: string, ar: string) => (isAr ? ar : en);

  return (
    <DashboardProvider lang={lang}>
      <DashboardHeader
        title={t("Dashboard", "لوحة المعلومات")}
        subtitle={t("Account growth, brand activity and follow-up in one place.", "نمو الحسابات ونشاط العلامات والمتابعة في مكان واحد.")}
        primaryAction={<Button href="/admin/users" variant="primary">{t("Manage users", "إدارة المستخدمين")}</Button>}
        secondaryActions={
          <Button variant="outline" size="sm" icon={<Icon name="sync" size={18} />} onClick={refresh} disabled={(loading || activity.loading) && !refreshing} loading={refreshing} loadingText={t("Refreshing…", "جارٍ التحديث…")}>
            {t("Refresh", "تحديث")}
          </Button>
        }
      />

      <WelcomeMessage
        message={
          data && data.users.pending > 0
            ? t(`${data.users.pending} accounts are waiting for setup.`, `${data.users.pending} حسابات بانتظار الإعداد.`)
            : t("Accounts, brands and website content, all in one place.", "الحسابات والعلامات ومحتوى الموقع في مكان واحد.")
        }
        actions={[{ label: t("Website content", "محتوى الموقع"), href: "/admin/cms" }]}
      />

      <AlertBanner message={failure ? errorText(failure, lang) : null} />

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
            <RecentActivity items={activity.data} error={activity.failure ? errorText(activity.failure, lang) : null} loading={activity.loading} onRetry={activity.reload} />
          </div>
        </div>
      </div>
    </DashboardProvider>
  );
}
