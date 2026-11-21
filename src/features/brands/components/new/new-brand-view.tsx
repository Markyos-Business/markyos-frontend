"use client";

import Link from "next/link";
import { Icon, MarkyosLogo, TabPanel, Tabs, useTabIds } from "@/components/ui";
import { START_TABS } from "../../constants";
import type { NewBrandView as NewBrandViewProps } from "../../hooks/new/use-new-brand-page";
import { ImportDropZone } from "../import/import-drop-zone";
import { ImportProgress } from "../import/import-progress";
import { ImportReview } from "../import/import-review";
import { ScratchForm } from "./scratch-form";
import { useInterfaceLang } from "@/contexts/useInterfaceLang";

/** Creating a brand: the bare chrome, the two ways to start, and the one in use. */
export function NewBrandView({ mode, onMode, onLogout, scratch, importer }: NewBrandViewProps) {
  const tabIds = useTabIds();
  const { isAr } = useInterfaceLang();
  const t = (en: string, ar: string) => (isAr ? ar : en);
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex h-16 shrink-0 items-center justify-between px-6">
        {/* A way back that isn't logging out. */}
        <div className="flex items-center gap-ctl-row">
          <MarkyosLogo variant="mark" className="h-5" isAr={isAr} />
          <Link href="/brands" className="mk-tap flex items-center gap-ctl-icon text-caption text-text-muted">
            <Icon name="arrow-left" size={16} />
            {t("All brands", "كل العلامات")}
          </Link>
        </div>
        <button type="button" onClick={onLogout} className="mk-tap cursor-pointer text-caption text-text-faint">
          {t("Log out", "تسجيل الخروج")}
        </button>
      </div>

      <div className="mx-auto flex w-full max-w-[680px] flex-1 flex-col justify-center px-6 sm:px-[72px] py-10">
        <Tabs {...tabIds}
          label={t("How to start", "طريقة البدء")}
          className="mb-space-10 max-w-full self-start"
          tabs={START_TABS.map((tab) => ({ key: tab.key, label: isAr ? tab.arLabel : tab.label }))}
          active={mode}
          onChange={onMode}
        />

        <TabPanel id={tabIds.panelId} tabsId={tabIds.id} active={mode}>
        {mode === "scratch" ? (
          <ScratchForm {...scratch} />
        ) : importer.stage === "idle" ? (
          <ImportDropZone onFile={importer.onFile} />
        ) : importer.stage === "extracting" ? (
          <ImportProgress fileName={importer.fileName} progress={importer.progress} />
        ) : importer.review ? (
          <ImportReview {...importer.review} />
        ) : null}
        </TabPanel>
      </div>

      <div className="px-6 sm:px-[72px] pb-10 text-caption text-text-faint">{t("Arabic and English are both on by default.", "العربية والإنجليزية مفعّلتان افتراضيًا.")}</div>
    </div>
  );
}
