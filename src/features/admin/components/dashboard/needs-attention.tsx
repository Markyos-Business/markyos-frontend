"use client";
import { Button, ContentCard, Skeleton } from "@/components/ui";
import { useAdminLang } from "../../hooks/shared/use-admin-lang";
import type { AdminStats } from "../../types";
export function NeedsAttention({stats,loading}:{stats:AdminStats|null;loading:boolean}){
  const {isAr}=useAdminLang();const t=(en:string,ar:string)=>isAr?ar:en;
  return <ContentCard title={t("Needs attention","بحاجة إلى المتابعة")}>
    {!stats ? loading ? <div aria-busy="true" className="flex flex-col gap-space-4"><Skeleton className="h-16 w-full rounded-lg"/><Skeleton className="h-16 w-full rounded-lg"/></div> : <p className="text-body text-text-muted">{t("Counts are unavailable. Retry with Refresh above.","الأعداد غير متاحة. أعد المحاولة باستخدام زر التحديث أعلاه.")}</p> : <ul className="flex flex-col gap-space-5">
      {[
        {status:"waiting",count:stats.users.pending,title:t("Pending activation","بانتظار التفعيل"),body:t("Review accounts waiting to complete setup.","راجع الحسابات التي تنتظر إكمال الإعداد.")},
        {status:"deactivated",count:stats.users.deactivated,title:t("Deactivated accounts","الحسابات المعطّلة"),body:t("Review disabled access when follow-up is needed.","راجع الوصول المعطّل عند الحاجة إلى المتابعة.")},
      ].map(item=><li key={item.status} className="flex flex-wrap items-center justify-between gap-space-3">
        <div className="min-w-0 flex-1"><p className="text-body font-medium">{item.title} <span className="ms-space-2 tabular-nums text-text-muted">{item.count}</span></p><p className="mt-space-1 text-caption text-text-muted">{item.count?item.body:t("No accounts in this status.","لا توجد حسابات بهذه الحالة.")}</p></div>
        {item.count>0&&<Button href={`/admin/users?status=${item.status}`} size="sm" variant="outline" aria-label={`${t("Review","مراجعة")} ${item.title}`}>{t("Review","مراجعة")}</Button>}
      </li>)}
    </ul>}
    <p className="mt-space-5 text-caption text-text-faint">{t("Deactivation may be intentional; these counts are review shortcuts, not system alerts.","قد يكون التعطيل مقصودًا؛ هذه اختصارات للمراجعة وليست تنبيهات للنظام.")}</p>
  </ContentCard>;
}
