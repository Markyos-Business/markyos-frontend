export interface NotificationItem {
  id: string; kind: string; data: Record<string,string>; targetUrl: string;
  createdAt: string; readAt: string|null;
}
export interface InboxPage {count:number; unreadCount:number; next:string|null; results:NotificationItem[]}
