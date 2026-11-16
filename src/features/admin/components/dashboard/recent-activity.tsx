"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { Button, Icon, Skeleton } from "@/components/ui";
import { DashboardCard } from "@/components/ui";
import { useAdminLang } from "../../hooks/shared/use-admin-lang";
import type { DashboardActivity } from "../../types";
import { describeActivity } from "../../utils/activity";
import { relativeTime } from "../../utils/format";

const PREVIEW_COUNT = 5;

export function RecentActivity({ items, error, loading, onRetry }: {
  items: DashboardActivity[] | null;
  error: string | null;
  loading: boolean;
  onRetry: () => void;
}) {
  const { c, lang, isAr } = useAdminLang();
  const [expanded, setExpanded] = useState(false);
  const listId = useId();
  const t = (en: string, ar: string) => isAr ? ar : en;
  const visible = expanded ? items : items?.slice(0, PREVIEW_COUNT);

  return (
    <DashboardCard
      title={t("Recent activity", "النشاط الأخير")}
      footer={items && items.length > PREVIEW_COUNT ? (
        <div className="flex flex-wrap items-center justify-between gap-space-3">
          <span className="text-caption text-text-muted">{t(
            `${visible?.length} of ${items.length} latest events`,
            `${visible?.length} من أحدث ${items.length} حدثًا`,
          )}</span>
          <Button size="sm" variant="outline" aria-expanded={expanded} aria-controls={listId} onClick={() => setExpanded(!expanded)}>
            {expanded ? t("Show less", "عرض أقل") : t("Show more", "عرض المزيد")}
          </Button>
        </div>
      ) : undefined}
    >
      {error && <div role="alert" className="mb-space-4 flex flex-wrap items-center justify-between gap-space-3 text-caption text-danger">
        <span>{items ? t("Could not refresh. Showing previous activity.", "تعذر التحديث. يظهر النشاط السابق.") : t("Activity could not be loaded.", "تعذر تحميل النشاط.")}</span>
        <Button size="sm" variant="outline" onClick={onRetry} disabled={loading}>{t("Retry", "إعادة المحاولة")}</Button>
      </div>}
      {!items ? loading ? (
        <div aria-busy="true" className="flex flex-col gap-space-4">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
        </div>
      ) : null : !items.length ? (
        <p className="text-body text-text-muted">{t("No activity recorded yet.", "لم يُسجّل أي نشاط بعد.")}</p>
      ) : (
        <ol id={listId} className="divide-y divide-hairline">
          {visible?.map((item) => {
            const description = item.kind === "removed" ? {
              title: t("Account removed", "تم حذف الحساب"), icon: "user-slash",
              time: relativeTime(item.at, lang),
              meta: item.detail.by ? c.activity.by(String(item.detail.by)) : undefined,
            } : describeActivity({ ...item, kind: item.kind }, c, lang);
            return (
              <li key={item.id} className="flex min-w-0 items-start gap-space-3 py-space-3 first:pt-0 last:pb-0">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-widget bg-surface-2 text-text-muted">
                  <Icon name={description.icon} size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-space-3">
                    <p className="text-caption font-medium text-text">{description.title}</p>
                    <time dateTime={item.at} title={item.at} className="shrink-0 text-caption text-text-faint">{description.time}</time>
                  </div>
                  {item.userId ? (
                    <Link href={`/admin/users/${item.userId}?tab=activity`} dir="auto" className="block truncate text-caption text-text-muted hover:text-accent-text hover:underline">{item.subject}</Link>
                  ) : <p dir="auto" className="truncate text-caption text-text-muted">{item.subject}</p>}
                  {description.meta && <p dir="auto" className="truncate text-caption text-text-faint">{description.meta}</p>}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </DashboardCard>
  );
}
