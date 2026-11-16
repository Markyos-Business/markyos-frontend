"use client";

import Link from "next/link";
import { ContentCard, Icon, Skeleton } from "@/components/ui";
import { useAdminLang } from "../../hooks/shared/use-admin-lang";
import type { AdminStats } from "../../types";

export function NeedsAttention({ stats, loading }: { stats: AdminStats | null; loading: boolean }) {
  const { isAr } = useAdminLang();
  const t = (en: string, ar: string) => isAr ? ar : en;
  const rows = stats ? [
    { status: "waiting", count: stats.users.pending, title: t("Awaiting setup", "بانتظار الإعداد"), body: t("Signup or invitation not completed", "لم يكتمل التسجيل أو قبول الدعوة") },
    { status: "deactivated", count: stats.users.deactivated, title: t("Deactivated", "معطّلة"), body: t("Access disabled by an administrator", "عطّل المسؤول الوصول") },
  ] : [];

  return (
    <ContentCard title={t("Account follow-up", "متابعة الحسابات")}>
      {!stats ? loading ? (
        <div aria-busy="true" className="flex flex-col gap-space-4">
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
        </div>
      ) : <p className="text-caption text-text-muted">{t("Counts are unavailable. Use Refresh to try again.", "الأعداد غير متاحة. استخدم التحديث لإعادة المحاولة.")}</p> : (
        <ul className="flex flex-col gap-space-3">
          {rows.map((item) => {
            const content = <>
              <div className="min-w-0 flex-1">
                <p className="text-body font-medium text-text">{item.title}</p>
                <p className="mt-space-1 text-caption text-text-muted">{item.body}</p>
              </div>
              <span className="text-title-sm font-medium tabular-nums text-text">{item.count.toLocaleString("en-US")}</span>
              {item.count > 0 && <Icon name="arrow-right" size={16} className="shrink-0 text-text-muted rtl:rotate-180" />}
            </>;
            const className = "flex items-center gap-space-4 rounded-widget border border-hairline px-space-4 py-space-3";
            return <li key={item.status}>{item.count > 0 ? (
              <Link href={`/admin/users?status=${item.status}`} className={`${className} mk-btn hover:bg-surface-2`} aria-label={`${t("Review", "مراجعة")} ${item.title}: ${item.count}`}>{content}</Link>
            ) : <div className={className}>{content}</div>}</li>;
          })}
        </ul>
      )}
    </ContentCard>
  );
}
