"use client";

import type { ComponentProps } from "react";
import { Button } from "@/components/ui";
import type { Workspace } from "@/types";
import { PAGE_SECTION } from "../constants";
import { BrandDetailsCard } from "./BrandDetailsCard";
import { BrandInsightsCard } from "./BrandInsightsCard";
import { OverviewEditor } from "./OverviewEditor";

type OverviewViewProps = {
  ws: Workspace;
  isAr: boolean;
  onToggleLocale: () => void;
  editor: ComponentProps<typeof OverviewEditor>;
};

/** A brand's overview: its details, how complete it is, and the free-text overview. */
export function OverviewView({ ws, isAr, onToggleLocale, editor }: OverviewViewProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 px-7 py-6.5">
      {/* Wraps on a narrow window. */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-[30px] font-semibold tracking-tight">{isAr ? PAGE_SECTION.ar : PAGE_SECTION.en}</h1>
        <Button variant="soft" size="xs" onClick={onToggleLocale} className="shadow-edge">
          {isAr ? "Add English version" : "Add Arabic version"}
        </Button>
      </div>

      <div className="grid shrink-0 grid-cols-1 gap-4 lg:grid-cols-2">
        <BrandDetailsCard ws={ws} isAr={isAr} />
        <BrandInsightsCard ws={ws} isAr={isAr} />
      </div>

      <OverviewEditor {...editor} />
    </div>
  );
}
