"use client";

import { useState } from "react";
import { ActionsDropdown, Icon, Modal, Popover } from "@/components/ui";
import { SegmentedToggle } from "@/components/ui";
import { ShareLinksPanel } from "@/features/sharing";
import type { StrategyPageState } from "../../hooks/use-strategy-page";
import { TranslateStrategy } from "../translate/translate-strategy";

/**
 * The top bar's strategy actions. Share and the edit/read switch stay in
 * view; filling the other language and importing a file sit in one menu, so
 * the bar is one row on a phone.
 */
export function StrategyActions({ ws, isAr, mode, canEdit, onMode, onImport }: StrategyPageState["actions"]) {
  const [translating, setTranslating] = useState(false);
  if (!canEdit) return null;
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
      <SegmentedToggle
        label={isAr ? "وضع العرض" : "Mode"}
        off={{ label: isAr ? "تحرير" : "Edit", icon: "pen" }}
        on={{ label: isAr ? "قراءة" : "Read", icon: "book" }}
        value={mode === "read"}
        onChange={(read) => onMode(read ? "read" : "edit")}
      />
      <ActionsDropdown
        size="sm"
        label={isAr ? "المزيد" : "More"}
        title={isAr ? "إجراءات الاستراتيجية" : "Strategy actions"}
        align="end"
        items={[
          { label: isAr ? "تعبئة لغة أخرى" : "Fill another language", icon: "language", onSelect: () => setTranslating(true) },
          { label: isAr ? "استيراد من ملف" : "Import from file", icon: "upload", onSelect: onImport },
        ]}
      />
      {translating && (
        <Modal size="md" onClose={() => setTranslating(false)} title={isAr ? "تعبئة لغة أخرى" : "Fill another language"}>
          <div className="flex flex-col gap-space-3">
            <TranslateStrategy ws={ws} direction="ar-en" isAr={isAr} />
            <TranslateStrategy ws={ws} direction="en-ar" isAr={isAr} />
          </div>
        </Modal>
      )}
    </div>
  );
}
