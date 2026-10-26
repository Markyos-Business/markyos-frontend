"use client";

import { Button, Icon, Popover } from "@/components/ui";
import { SegmentedToggle } from "@/components/form";
import { ShareLinksPanel } from "@/components/features/sharing";
import type { StrategyPageState } from "../hooks/useStrategyPage";
import { TranslateStrategy } from "./TranslateStrategy";

/** The top bar's strategy actions: share, translate, edit or read, import. */
export function StrategyActions({ ws, isAr, mode, onMode, onImport }: StrategyPageState["actions"]) {
  return (
    <div className="flex items-center gap-2">
      {/* Share sits in the top bar, in both modes: sharing is a thing you
          decide about the page, not a thing you do while reading it. */}
      <Popover
        label={isAr ? "مشاركة الاستراتيجية" : "Share the strategy"}
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
            <ShareLinksPanel ws={ws} scope="strategy" isAr={isAr} />
          </div>
        )}
      </Popover>
      <TranslateStrategy ws={ws} direction={isAr ? "en-ar" : "ar-en"} isAr={isAr} />
      <SegmentedToggle
        label={isAr ? "وضع العرض" : "Mode"}
        off={{ label: isAr ? "تحرير" : "Edit", icon: "pen" }}
        on={{ label: isAr ? "قراءة" : "Read", icon: "book" }}
        value={mode === "read"}
        onChange={(read) => onMode(read ? "read" : "edit")}
      />
      <Button variant="soft" size="xs" onClick={onImport} icon={<Icon name="upload" size={16} />}>
        {isAr ? "استيراد من ملف" : "Import from file"}
      </Button>
    </div>
  );
}
