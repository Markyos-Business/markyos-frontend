"use client";

import type { ComponentProps } from "react";
import { Button, Icon } from "@/components/ui";
import type { Workspace } from "@/types";
import { useSectionEditor } from "../../hooks/report/useSectionEditor";
import { useAddToStrategy } from "../../hooks/to-strategy/useAddToStrategy";
import { AddAllButton, itemActionFor } from "../to-strategy/AddToStrategy";
import { ReportView } from "./ReportView";
import { SectionEditor } from "./SectionEditor";

type StudioReportProps = Omit<ComponentProps<typeof ReportView>, "sectionActions" | "itemAction" | "sectionBody"> & { workspace: Workspace };

/**
 * The report with what a studio can do to it: edit a section, and add its
 * items to Strategy. Someone who can only read gets the plain report.
 */
export function StudioReport({ workspace, ...report }: StudioReportProps) {
  const strategy = useAddToStrategy(workspace, report.analysis, report.onSection);
  const editor = useSectionEditor(report.analysis, report.onSection);
  const isAr = report.analysis.language === "ar";
  if (!report.canEdit) return <ReportView {...report} />;
  return (
    <ReportView
      {...report}
      sectionBody={(section) => (editor.editing === section.key ? <SectionEditor editor={editor} isAr={isAr} /> : undefined)}
      sectionActions={(section) =>
        editor.editing === section.key ? null : (
          <>
            {section.status === "ready" && (
              <Button variant="outline" size="sm" icon={<Icon name="pen" size={16} />} onClick={() => editor.start(section)} disabled={!!editor.editing}>
                {isAr ? "تعديل" : "Edit"}
              </Button>
            )}
            {section.editedByUser && (
              <Button variant="link" onClick={() => void editor.reset(section)} disabled={!!editor.editing}>
                {isAr ? "العودة إلى نسخة التحليل" : "Back to the analysis's version"}
              </Button>
            )}
            <AddAllButton strategy={strategy} section={section} />
          </>
        )
      }
      // While a section is open for editing, its items aren't added from the old copy.
      itemAction={(section) => (editor.editing === section.key ? undefined : itemActionFor(strategy, section))}
    />
  );
}
