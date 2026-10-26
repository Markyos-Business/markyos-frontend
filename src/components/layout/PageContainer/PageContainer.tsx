"use client";

import type { ReactNode } from "react";
import { API_ENABLED } from "@/lib/api/client";

type PageWidth = "default" | "wide";

const widths: Record<PageWidth, string> = {
  default: "max-w-[1240px]",
  wide: "max-w-[1440px]",
};

type PageContainerProps = {
  width?: PageWidth;
  /** Shown instead of the page in the browser-only build, for pages that need the server. */
  offline?: ReactNode;
  children: ReactNode;
};

/** The scrolling body of a page inside `AppLayout`, centred and padded. */
export function PageContainer({ width = "default", offline, children }: PageContainerProps) {
  return (
    <main className="min-h-0 flex-1 overflow-y-auto">
      <div className={`mx-auto flex w-full flex-col gap-5 px-space-6 pb-space-10 sm:px-space-10 ${widths[width]}`}>
        {offline && !API_ENABLED ? offline : children}
      </div>
    </main>
  );
}
