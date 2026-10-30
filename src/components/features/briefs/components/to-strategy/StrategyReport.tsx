"use client";

import type { ComponentProps } from "react";
import type { Workspace } from "@/types";
import { useAddToStrategy } from "../../hooks/useAddToStrategy";
import { ReportView } from "../ReportView";
import { AddAllButton, itemActionFor } from "./AddToStrategy";

type StrategyReportProps = Omit<ComponentProps<typeof ReportView>, "sectionActions" | "itemAction"> & { workspace: Workspace };

/** The report, with Add to Strategy on each item and section for someone who can edit. */
export function StrategyReport({ workspace, ...report }: StrategyReportProps) {
  const strategy = useAddToStrategy(workspace, report.analysis, report.onSection);
  if (!report.canEdit) return <ReportView {...report} />;
  return (
    <ReportView
      {...report}
      sectionActions={(section) => <AddAllButton strategy={strategy} section={section} />}
      itemAction={(section) => itemActionFor(strategy, section)}
    />
  );
}
