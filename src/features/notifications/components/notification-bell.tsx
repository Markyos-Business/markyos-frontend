"use client";
import { useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon, Popup } from "@/components/ui";
import { useSession } from "@/contexts/AppContext";
import { useInterfaceLang } from "@/contexts/useInterfaceLang";
import { API_ENABLED } from "@/lib/api/client";
import { notificationHref } from "../copy";
import { InboxContent } from "./inbox-content";
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
      <InboxContent n={n} isAr={isAr} unread={unread} setUnread={setUnread} onOpenItem={async item=>{if(await n.markOpened(item)){setOpen(false);router.push(notificationHref(item.targetUrl));}}}/>
    </Popup>
  </>;
}
