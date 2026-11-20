"use client";

import type { ComponentProps } from "react";
import { Button, DashboardHeader, DashboardProvider, Icon } from "@/components/ui";
import type { Workspace } from "@/types";
import { PAGE_SECTION } from "../constants";
import { BrandDetailsCard } from "./brand-details-card";
import { BrandInsightsCard } from "./brand-insights-card";
import { OverviewEditor } from "./overview-editor";

type OverviewViewProps = {
  ws: Workspace;
  isAr: boolean;
  editor: ComponentProps<typeof OverviewEditor>;
};

/** A brand's overview: its details, how complete it is, and the free-text overview. */
export function OverviewView({ ws, isAr, editor }: OverviewViewProps) {
  const brandLang = ws.primaryLocale === "ar" ? (isAr ? "العربية" : "Arabic") : isAr ? "الإنجليزية" : "English";
  return (
    <DashboardProvider lang={isAr ? "ar" : "en"}><div className="flex min-h-0 flex-1 flex-col gap-4 px-7 py-6.5">
      <DashboardHeader
        title={isAr ? PAGE_SECTION.ar : PAGE_SECTION.en}
        // This used to read "Add Arabic version" but switched the brand's own
        // language, the one the published guideline opens in, from a label
        // that promised something else. That choice lives in Settings; this
        // says what it is and goes there.
        secondaryActions={<Button variant="outline" size="sm" href={`/w/${ws.slug}/settings`} icon={<Icon name="language" size={16} />}>
          {isAr ? `لغة العلامة: ${brandLang}` : `Brand language: ${brandLang}`}
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
