"use client";

import { EmptyState } from "@/components/ui";

/**
 * What a discovery page shows in the browser-only build. Forms live on the
 * server (the client answers through a link it serves), so the page says so
 * instead of showing a screen that can't save.
 */
export function NeedsServer({ isAr }: { isAr: boolean }) {
  return (
    <EmptyState
      icon="clipboard-list"
      title={isAr ? "نماذج الاستكشاف تحتاج إلى خادم ماركيوس" : "Discovery forms need the Markyos server"}
      description={
        isAr
          ? "هذه النسخة تحفظ كل شيء في المتصفح، والعميل يجيب عبر رابط يخدمه الخادم."
          : "This build keeps everything in the browser, and your client answers through a link the server provides."
      }
    />
  );
}
