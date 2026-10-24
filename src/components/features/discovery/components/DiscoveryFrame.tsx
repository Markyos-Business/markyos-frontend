"use client";

import type { ReactNode } from "react";
import { EmptyState } from "@/components/ui";
import { API_ENABLED } from "@/lib/api/client";

type DiscoveryFrameProps = { isAr: boolean; wide?: boolean; children: ReactNode };

/**
 * The scrolling body of a discovery page. Forms live on the server (the
 * client answers through a link it serves), so the browser-only build says
 * so instead of showing a screen that can't save.
 */
export function DiscoveryFrame({ isAr, wide = false, children }: DiscoveryFrameProps) {
  return (
    <div className="min-h-0 flex-1 overflow-auto">
      <div className={`mx-auto flex w-full flex-col gap-5 px-space-6 pb-space-10 sm:px-space-10 ${wide ? "max-w-[1440px]" : "max-w-[1240px]"}`}>
        {API_ENABLED ? (
          children
        ) : (
          <EmptyState
            icon="clipboard-list"
            title={isAr ? "نماذج الاستكشاف تحتاج إلى خادم ماركيوس" : "Discovery forms need the Markyos server"}
            description={
              isAr
                ? "هذه النسخة تحفظ كل شيء في المتصفح، والعميل يجيب عبر رابط يخدمه الخادم."
                : "This build keeps everything in the browser, and your client answers through a link the server provides."
            }
          />
        )}
      </div>
    </div>
  );
}
