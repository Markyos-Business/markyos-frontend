"use client";

import type { ComponentProps } from "react";
import { Button, DashboardHeader, DashboardProvider } from "@/components/ui";
import type { Workspace } from "@/types";
import { PAGE_SECTION } from "../constants";
import { BrandDetailsCard } from "./brand-details-card";
import { BrandInsightsCard } from "./brand-insights-card";
import { OverviewEditor } from "./overview-editor";

type OverviewViewProps = {
  ws: Workspace;
  isAr: boolean;
  onToggleLocale: () => void;
  editor: ComponentProps<typeof OverviewEditor>;
};

/** A brand's overview: its details, how complete it is, and the free-text overview. */
export function OverviewView({ ws, isAr, onToggleLocale, editor }: OverviewViewProps) {
  return (
    <DashboardProvider lang={isAr ? "ar" : "en"}><div className="flex min-h-0 flex-1 flex-col gap-4 px-7 py-6.5">
      <DashboardHeader
        title={isAr ? PAGE_SECTION.ar : PAGE_SECTION.en}
        secondaryActions={<Button variant="outline" size="sm" onClick={onToggleLocale}>
          {isAr ? "إضافة النسخة الإنجليزية" : "Add Arabic version"}
        </Button>}
      />

      <div className="grid shrink-0 grid-cols-1 items-start gap-4 lg:grid-cols-2">
        <BrandDetailsCard ws={ws} isAr={isAr} />
        <BrandInsightsCard ws={ws} isAr={isAr} />
      </div>

      <OverviewEditor {...editor} />
    </div></DashboardProvider>
  );
}
