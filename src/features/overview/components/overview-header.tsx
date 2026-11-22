"use client";

import type { ReactNode } from "react";
import { BrandMark, Tag, useTheme } from "@/components/ui";
import { pick } from "../logic";
import type { OverviewData } from "../types";

/**
 * The page's head: the brand's logo (or its initials), its name as the one
 * h1, a line under it (the client, the tagline), one status chip, and the
 * actions — at most one primary among them.
 */
export function OverviewHeader({
  header,
  isAr,
  subline,
  chip,
  actions,
}: {
  header: OverviewData["header"];
  isAr: boolean;
  subline?: ReactNode;
  chip?: { label: string; tone: "primary" | "success" | "neutral" };
  actions?: ReactNode;
}) {
  const { resolved } = useTheme();
  const tagline = pick(header.tagline, isAr);
  return (
    <header className="flex flex-col gap-space-5 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-space-5">
        <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-card bg-surface-2 text-h4 font-medium text-text">
          {header.logo ? (
            <BrandMark src={header.logo} alt="" onDark={resolved === "dark"} plate className="h-8 w-auto max-w-12" fallbackSize={18} />
          ) : (
            header.initials || header.name.slice(0, 1)
          )}
        </span>
        <div className="flex min-w-0 flex-col gap-space-1">
          <div className="flex min-w-0 flex-wrap items-center gap-space-3">
            <h1 dir="auto" className="bidi-auto min-w-0 truncate text-h2 font-medium text-text">{header.name}</h1>
            {chip && <Tag tone={chip.tone}>{chip.label}</Tag>}
          </div>
          {subline && <p className="min-w-0 truncate text-body text-text-muted">{subline}</p>}
          {tagline && <p dir="auto" className="bidi-auto min-w-0 truncate text-body text-text-muted">{tagline}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-ctl-row">{actions}</div>}
    </header>
  );
}
