"use client";
import { AppDate, Button, Icon, SegmentedToggle, Skeleton } from "@/components/ui";
import { useMinBusy } from "@/hooks/useMinBusy";
import { notificationText } from "../copy";
import type { NotificationItem } from "../types";
import type { useNotifications } from "../hooks/use-notifications";
export function InboxContent({n,isAr,unread,setUnread,onOpenItem}:{n:ReturnType<typeof useNotifications>;isAr:boolean;unread:boolean;setUnread:(value:boolean)=>void;onOpenItem:(item:NotificationItem)=>Promise<void>}){
  const t=(en:string,ar:string)=>isAr?ar:en;
  const refreshing=useMinBusy(n.refreshing);
  // While `loading`, the Button is already blocked through aria-disabled; leaving native
  // `disabled` off keeps keyboard focus on it. Other loads (load more, filters, marking) only disable it.
  return <>
      <div className="flex flex-wrap items-center justify-between gap-space-3">
        <SegmentedToggle label={t("Notification view","عرض الإشعارات")} off={{label:t("All","الكل")}} on={{label:t("Unread","غير المقروءة")}} value={unread} onChange={setUnread} disabled={n.busy}/>
        <div className="flex flex-wrap gap-space-3"><Button size="sm" variant="outline" icon={<Icon name="sync" size={18}/>} disabled={(n.busy||n.loading)&&!refreshing} loading={refreshing} loadingText={t("Refreshing…","جارٍ التحديث…")} onClick={()=>void n.reload()}>{t("Refresh","تحديث")}</Button><Button size="sm" variant="link" onClick={()=>void n.markAll()} disabled={n.loading||n.busy||!n.count}>{t("Mark all as read","تحديد الكل كمقروء")}</Button></div>
      </div>
      {(n.error||n.actionError)&&<div role="alert" className="flex flex-wrap items-center justify-between gap-space-3 rounded-lg bg-danger-soft p-space-4 text-caption text-danger"><span>{n.actionError?t("Could not save your change. Try again.","تعذر حفظ التغيير. حاول مرة أخرى."):t("Could not load notifications. Try again.","تعذر تحميل الإشعارات. حاول مرة أخرى.")}</span>{n.error&&<Button size="sm" variant="outline" disabled={n.loading||n.busy} onClick={()=>void n.reload()}>{t("Retry","إعادة المحاولة")}</Button>}</div>}
      {n.loading&&!n.items?<div aria-busy="true" className="flex flex-col gap-space-4">{[0,1,2].map(i=><Skeleton key={i} className="h-20 w-full rounded-lg"/>)}</div>:n.items?.length===0?<div role="status" className="py-space-10 text-center"><Icon name="bell" size={22} className="mb-space-3 text-text-muted"/><h3 className="text-body font-medium">{unread?t("You're all caught up","لا توجد إشعارات غير مقروءة"):t("No notifications yet","لا توجد إشعارات بعد")}</h3><p className="mt-space-2 text-caption text-text-muted">{t("New account and form updates will appear here.","ستظهر تحديثات الحساب والنماذج الجديدة هنا.")}</p></div>:<ul className="flex flex-col gap-space-3">{n.items?.map(item=>{
        const copy=notificationText(item,isAr);return <li key={item.id} className={`min-w-0 rounded-lg border p-space-4 ${item.readAt?"border-hairline bg-surface-1":"border-hairline bg-surface-2"}`}>
          <div className="flex items-start gap-space-3"><div className="min-w-0 flex-1"><button type="button" disabled={n.busy||n.loading} onClick={()=>void onOpenItem(item)} className={`mk-btn w-full text-start text-body ${item.readAt?"font-normal text-text-muted":"font-medium text-text"}`}><span className="break-words">{copy.title}</span></button>{copy.body&&<p dir="auto" className="mt-space-1 break-words text-caption text-text-muted">{copy.body}</p>}</div>{!item.readAt&&<span role="img" aria-label={t("Unread","غير مقروء")} className="mt-space-2 size-2 shrink-0 rounded-full bg-accent"/>}</div>
          <div className="mt-space-3 flex flex-wrap items-center justify-between gap-space-2"><AppDate value={item.createdAt} format="relative" locale={isAr?"ar-u-nu-latn":"en-GB"} className="text-caption text-text-muted"/><Button size="xs" variant="link" disabled={n.busy||n.loading} onClick={()=>void n.mark(item)} aria-label={`${item.readAt?t("Mark as unread","تحديد كغير مقروء"):t("Mark as read","تحديد كمقروء")}: ${copy.title}`}>{item.readAt?t("Mark as unread","تحديد كغير مقروء"):t("Mark as read","تحديد كمقروء")}</Button></div>
        </li>;
      })}</ul>}
      {n.more&&<Button variant="outline" disabled={n.loading||n.busy} onClick={()=>void n.loadMore()}>{n.loading?t("Loading…","جارٍ التحميل…"):t("Load more","تحميل المزيد")}</Button>}
  </>;
}
