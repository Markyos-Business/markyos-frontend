"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppFooter, EmptyState, PageHeader } from "@/components/ui";
import { AccountHeader } from "@/features/shell";
import { useApp, useSession } from "@/contexts/AppContext";
import { useInterfaceLang } from "@/contexts/useInterfaceLang";
import { API_ENABLED } from "@/lib/api/client";
import { notificationHref } from "../copy";
import { useNotifications } from "../hooks/use-notifications";
import { InboxContent } from "./inbox-content";
export function NotificationsView(){
  const session=useSession();const {hydrated}=useApp();const router=useRouter();const {isAr}=useInterfaceLang();
  useEffect(()=>{if(hydrated&&!session)router.replace("/login?next=%2Fnotifications");},[hydrated,session,router]);
  if(!hydrated||!session)return null;
  return <div className="flex min-h-screen flex-col"><AccountHeader/><main className="mx-auto flex w-full max-w-190 flex-1 flex-col gap-space-6 px-space-6 pb-space-10 sm:px-space-10"><PageHeader title={isAr?"الإشعارات":"Notifications"} description={isAr?"تحديثات حسابك وعلاماتك، محفوظة لك.":"Account and brand updates, saved for you."}/>{API_ENABLED?<InboxPage key={session.accountId} isAr={isAr}/>:<EmptyState icon="bell" title={isAr?"الإشعارات غير متاحة في العرض التجريبي.":"Notifications aren't available in the demo."} description=""/>}<AppFooter lang={isAr?"ar":"en"} className="mt-auto"/></main></div>;
}
function InboxPage({isAr}:{isAr:boolean}){const [unread,setUnread]=useState(false);const n=useNotifications(true,unread);const router=useRouter();return <InboxContent n={n} isAr={isAr} unread={unread} setUnread={setUnread} onOpenItem={async item=>{if(await n.markOpened(item))router.push(notificationHref(item.targetUrl));}}/>;}
