"use client";

import { Icon, Popover } from "@/components/ui";
import { SegmentedToggle } from "@/components/form";
import { ShareLinksPanel } from "@/components/features/sharing";
import type { DepartmentsPageState } from "../hooks/useDepartmentsPage";

/** The top bar's department actions: share it, and edit or read it. */
export function DepartmentActions({ ws, isAr, departmentId, mode, onMode }: NonNullable<DepartmentsPageState["actions"]>) {
  return (
    <div className="flex items-center gap-2">
      {/* Same move as Strategy: sharing a department is reachable from the
          department, not only from its Read view. */}
      <Popover
        label={isAr ? "مشاركة هذا القسم" : "Share this department"}
        width={430}
        trigger="pill"
        button={
          <>
            <Icon name="link" size={16} />
            {isAr ? "مشاركة" : "Share"}
          </>
        }
      >
        {() => (
          <div className="p-1">
            <ShareLinksPanel ws={ws} scope="department" departmentId={departmentId} isAr={isAr} />
          </div>
        )}
      </Popover>
      <SegmentedToggle
        label={isAr ? "وضع العرض" : "Mode"}
        off={{ label: isAr ? "تحرير" : "Edit", icon: "pen" }}
        on={{ label: isAr ? "قراءة" : "Read", icon: "book" }}
        value={mode === "read"}
        onChange={(read) => onMode(read ? "read" : "edit")}
      />
    </div>
  );
}
