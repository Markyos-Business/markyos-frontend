"use client";
import { useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AppDate, Button, Icon, Popup, Skeleton } from "@/components/ui";
import { useSession } from "@/contexts/AppContext";
import { useInterfaceLang } from "@/contexts/useInterfaceLang";
import { API_ENABLED } from "@/lib/api/client";
import { notificationHref, notificationText } from "../copy";
import { useNotifications } from "../hooks/use-notifications";
export function NotificationBell({isAr:givenIsAr}:{isAr?:boolean}){
  const session=useSession();const {isAr}=useInterfaceLang();
  if(!session||!API_ENABLED)return null;
  return <NotificationCenter key={session.accountId} isAr={givenIsAr??isAr}/>;
}
/** Shared inbox surface; the public bell mounts it only for an API session. */
export function NotificationCenter({isAr}:{isAr:boolean}){
  const [open,setOpen]=useState(false);const [unread,setUnread]=useState(false);const panelId=useId();const trigger=useRef<HTMLButtonElement>(null);const n=useNotifications(open,unread);const router=useRouter();const t=(en:string,ar:string)=>isAr?ar:en;
  const title=t("Notifications","الإشعارات");const label=n.count===null?title:t(`${title}, ${n.count} unread`,`${title}، ${n.count} غير مقروءة`);
  return <>
    <button ref={trigger} type="button" aria-label={label} title={title} aria-haspopup="dialog" aria-expanded={open} aria-controls={open?panelId:undefined} onClick={()=>setOpen(true)} className="mk-btn relative flex size-10 shrink-0 items-center justify-center rounded-lg text-text-muted">
      <Icon name="bell" size={18}/>{n.count!==null&&n.count>0&&<span aria-hidden className="absolute -end-space-1 -top-space-1 min-w-4 rounded-md bg-accent px-space-1 text-center text-caption font-medium tabular-nums text-accent-ink">{n.count>99?"99+":n.count}</span>}
    </button>
    <Popup id={panelId} open={open} onOpenChange={setOpen} title={title} description={t("Account and brand updates, saved for you.","تحديثات حسابك وعلاماتك، محفوظة لك.")} variant="sheet" size="md" dir={isAr?"rtl":"ltr"} returnFocusRef={trigger} busy={n.busy}>
      <div className="flex flex-wrap items-center justify-between gap-space-3">
        <div role="group" aria-label={t("Notification view","عرض الإشعارات")} className="flex gap-space-2">{[false,true].map(value=><Button key={String(value)} size="sm" variant={unread===value?"soft":"outline"} aria-pressed={unread===value} onClick={()=>setUnread(value)} disabled={n.busy}>{value?t("Unread","غير المقروءة"):t("All","الكل")}</Button>)}</div>
        <div className="flex flex-wrap gap-space-3"><Button size="sm" variant="outline" disabled={n.loading||n.busy} onClick={()=>void n.reload()}>{t("Refresh","تحديث")}</Button><Button size="sm" variant="link" onClick={()=>void n.markAll()} disabled={n.loading||n.busy||!n.count}>{t("Mark all as read","تحديد الكل كمقروء")}</Button></div>
      </div>
      {(n.error||n.actionError)&&<div role="alert" className="flex flex-wrap items-center justify-between gap-space-3 rounded-lg bg-danger-soft p-space-4 text-caption text-danger"><span>{n.actionError?t("Could not save your change. Try again.","تعذر حفظ التغيير. حاول مرة أخرى."):t("Could not load notifications. Try again.","تعذر تحميل الإشعارات. حاول مرة أخرى.")}</span>{n.error&&<Button size="sm" variant="outline" disabled={n.loading||n.busy} onClick={()=>void n.reload()}>{t("Retry","إعادة المحاولة")}</Button>}</div>}
      {n.loading&&!n.items?<div aria-busy="true" className="flex flex-col gap-space-4">{[0,1,2].map(i=><Skeleton key={i} className="h-20 w-full rounded-lg"/>)}</div>:n.items?.length===0?<div role="status" className="py-space-10 text-center"><Icon name="bell" size={22} className="mb-space-3 text-text-muted"/><h3 className="text-body font-medium">{unread?t("You're all caught up","لا توجد إشعارات غير مقروءة"):t("No notifications yet","لا توجد إشعارات بعد")}</h3><p className="mt-space-2 text-caption text-text-muted">{t("New account and form updates will appear here.","ستظهر تحديثات الحساب والنماذج الجديدة هنا.")}</p></div>:<ul className="flex flex-col gap-space-3">{n.items?.map(item=>{
        const copy=notificationText(item,isAr);return <li key={item.id} className={`min-w-0 rounded-lg border p-space-4 ${item.readAt?"border-hairline bg-surface-1":"border-accent-edge bg-accent-soft"}`}>
          <div className="flex items-start gap-space-3"><div className="min-w-0 flex-1"><button type="button" disabled={n.busy||n.loading} onClick={async()=>{const saved=await n.markOpened(item);if(saved){setOpen(false);router.push(notificationHref(item.targetUrl));}}} className="mk-btn w-full text-start text-body font-medium text-text"><span className="break-words">{copy.title}</span></button>{copy.body&&<p dir="auto" className="mt-space-1 break-words text-caption text-text-muted">{copy.body}</p>}</div>{!item.readAt&&<span role="img" aria-label={t("Unread","غير مقروء")} className="mt-space-2 size-2 shrink-0 rounded-full bg-accent"/>}</div>
          <div className="mt-space-3 flex flex-wrap items-center justify-between gap-space-2"><AppDate value={item.createdAt} format="relative" locale={isAr?"ar-u-nu-latn":"en-GB"} className="text-caption text-text-muted"/><Button size="xs" variant="link" disabled={n.busy||n.loading} onClick={()=>void n.mark(item)} aria-label={`${item.readAt?t("Mark as unread","تحديد كغير مقروء"):t("Mark as read","تحديد كمقروء")}: ${copy.title}`}>{item.readAt?t("Mark as unread","تحديد كغير مقروء"):t("Mark as read","تحديد كمقروء")}</Button></div>
        </li>;
      })}</ul>}
      {n.more&&<Button variant="outline" disabled={n.loading||n.busy} onClick={()=>void n.loadMore()}>{n.loading?t("Loading…","جارٍ التحميل…"):t("Load more","تحميل المزيد")}</Button>}
    </Popup>
  </>;
}
