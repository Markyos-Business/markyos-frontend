"use client";

import { Dashboard, DashboardCard } from "@/components/ui";
import { useAdminLang } from "../../hooks/shared/use-admin-lang";
import type { AdminStats } from "../../types";

const { TaskList, TaskListItem, CardLinkButton } = Dashboard;

export function NeedsAttention({ stats, loading }: { stats: AdminStats | null; loading: boolean }) {
  const { isAr } = useAdminLang();
  const t = (en: string, ar: string) => isAr ? ar : en;
  const rows = stats ? [
    { status: "waiting", count: stats.users.pending, title: t("Awaiting setup", "بانتظار الإعداد"), body: t("Signup or invitation not completed", "لم يكتمل التسجيل أو قبول الدعوة") },
    { status: "deactivated", count: stats.users.deactivated, title: t("Deactivated", "معطّلة"), body: t("Access disabled by an administrator", "عطّل المسؤول الوصول") },
  ] : [];

  return (
    <DashboardCard title={t("Account follow-up", "متابعة الحسابات")} state={!stats && loading ? "loading" : "ready"} skeleton="list">
      {stats ? (
        <TaskList label={t("Account statuses", "حالات الحسابات")} count={rows.length}>
          {rows.map(item => (
            <TaskListItem
              key={item.status}
              title={item.title}
              meta={item.body}
              action={<div className="flex items-center gap-space-3">
                <span className="text-body font-medium tabular-nums text-text">{item.count.toLocaleString("en-US")}</span>
                {item.count > 0 && <CardLinkButton
                  href={`/admin/users?status=${item.status}`}
                  label={`${t("Review", "مراجعة")} ${item.title}: ${item.count}`}
                />}
              </div>}
            />
          ))}
        </TaskList>
      ) : <p className="text-caption text-text-muted">{t("Counts are unavailable. Use Refresh to try again.", "الأعداد غير متاحة. استخدم التحديث لإعادة المحاولة.")}</p>}
    </DashboardCard>
  );
}
