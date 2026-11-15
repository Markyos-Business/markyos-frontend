"use client";
import Link from "next/link";
import { Button, ContentCard, Icon, Skeleton } from "@/components/ui";
import { useAdminLang } from "../../hooks/shared/use-admin-lang";
import type { DashboardActivity } from "../../types";
import { describeActivity } from "../../utils/activity";
import { relativeTime } from "../../utils/format";
export function RecentActivity({items,error,loading,onRetry}:{items:DashboardActivity[]|null;error:string|null;loading:boolean;onRetry:()=>void}){
  const {c,lang,isAr}=useAdminLang();const t=(en:string,ar:string)=>isAr?ar:en;
  return <ContentCard title={t("Recent activity","النشاط الأخير")}>
    <p className="mb-space-4 text-caption text-text-muted">{t("Latest registrations, email verifications and recorded admin actions.","أحدث التسجيلات والتحقق من البريد وإجراءات المسؤولين المسجّلة.")}</p>
    {error&&<div role="alert" className="mb-space-4 flex flex-wrap items-center justify-between gap-space-3 text-caption text-danger"><span>{items?t("Could not refresh. Showing previous activity.","تعذر التحديث. يظهر النشاط السابق."):t("Activity could not be loaded.","تعذر تحميل النشاط.")}</span><Button size="sm" variant="outline" onClick={onRetry} disabled={loading}>{t("Retry","إعادة المحاولة")}</Button></div>}
    {!items?loading?<div aria-busy="true" className="flex flex-col gap-space-4">{[0,1,2].map(i=><Skeleton key={i} className="h-12 w-full rounded-lg"/>)}</div>:null:!items.length?<p className="text-body text-text-muted">{t("No activity recorded yet.","لم يُسجّل أي نشاط بعد.")}</p>:<ol className="flex flex-col gap-space-4">{items.map(item=>{
      const description=item.kind==="removed"?{title:t("Account removed","تم حذف الحساب"),icon:"user-slash",time:relativeTime(item.at,lang),meta:item.detail.by?c.activity.by(String(item.detail.by)):undefined}:describeActivity({...item,kind:item.kind},c,lang);
      return <li key={item.id} className="flex min-w-0 items-start gap-space-3 border-b border-hairline pb-space-4 last:border-0 last:pb-0">
        <Icon name={description.icon} size={18} className="mt-space-1 shrink-0 text-text-muted"/>
        <div className="min-w-0 flex-1"><p className="text-body font-medium">{description.title}</p>{item.userId?<Link href={`/admin/users/${item.userId}?tab=activity`} dir="auto" className="block truncate text-caption text-accent-text underline">{item.subject}</Link>:<p dir="auto" className="truncate text-caption text-text-muted">{item.subject}</p>}{description.meta&&<p dir="auto" className="truncate text-caption text-text-muted">{description.meta}</p>}</div>
        <time dateTime={item.at} title={item.at} className="shrink-0 text-caption text-text-muted">{description.time}</time>
      </li>;
    })}</ol>}
  </ContentCard>;
}
