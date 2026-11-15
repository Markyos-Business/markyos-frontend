import { api } from "@/lib/api/client";
import type { InboxPage, NotificationItem } from "../types";

export const getInbox = (unread:boolean,page=1) => api<InboxPage>(`/notifications/?unread=${unread}&page=${page}`);
export const getUnreadCount = () => api<{unreadCount:number}>("/notifications/unread-count/");
export const setNotificationRead = (id:string,isRead:boolean) => api<NotificationItem>(`/notifications/${encodeURIComponent(id)}/`,{method:"PATCH",body:{isRead}});
export const readAllNotifications = () => api<{updated:number;unreadCount:number}>("/notifications/read-all/",{method:"POST"});
