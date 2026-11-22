"use client";
import { useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { IconButton, Popup } from "@/components/ui";
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
    <span className="relative inline-flex shrink-0">
      <IconButton ref={trigger} icon="bell" label={label} title={title} aria-haspopup="dialog" aria-expanded={open} aria-controls={open?panelId:undefined} onClick={()=>setOpen(true)}/>
      {n.count!==null&&n.count>0&&<span aria-hidden className="pointer-events-none absolute -end-space-1 -top-space-1 min-w-4 rounded-md bg-accent px-space-1 text-center text-caption font-medium tabular-nums text-accent-ink">{n.count>99?"99+":n.count}</span>}
    </span>
    <Popup id={panelId} open={open} onOpenChange={setOpen} title={title} description={t("Account and brand updates, saved for you.","تحديثات حسابك وعلاماتك، محفوظة لك.")} variant="sheet" size="md" dir={isAr?"rtl":"ltr"} returnFocusRef={trigger} busy={n.busy}>
      <InboxContent n={n} isAr={isAr} unread={unread} setUnread={setUnread} onOpenItem={async item=>{if(await n.markOpened(item)){setOpen(false);router.push(notificationHref(item.targetUrl));}}}/>
    </Popup>
  </>;
}
