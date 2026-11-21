"use client";

import type { ReactNode } from "react";
import { AppFooter } from "@/components/ui";
import { useInterfaceLang } from "@/contexts/useInterfaceLang";
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
  /**
   * Room above the heading. The account-level pages sit straight under the
   * beta notice with no top bar of their own, and their h1 touched it.
   */
  spaced?: boolean;
};

/**
 * The scrolling body of a page inside `AppLayout`, centred and padded, with
 * the app footer at its end. The column is at least the pane's height, so the
 * footer sits at the bottom of a short page and after the content of a long one.
 */
export function PageContainer({ width = "default", offline, children, spaced = false }: PageContainerProps) {
  const { lang } = useInterfaceLang();
  return (
    <main className="min-h-0 flex-1 overflow-y-auto">
      <div className={`mx-auto flex min-h-full w-full flex-col gap-5 px-space-6 pb-space-8 sm:px-space-10 ${spaced ? "pt-space-8" : ""} ${widths[width]}`}>
        {offline && !API_ENABLED ? offline : children}
        <AppFooter lang={lang} className="mt-auto" />
      </div>
    </main>
  );
}
