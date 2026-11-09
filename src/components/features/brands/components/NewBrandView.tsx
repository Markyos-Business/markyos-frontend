"use client";

import { Tabs } from "@/components/ui";
import { START_TABS } from "../constants";
import type { NewBrandView as NewBrandViewProps } from "../hooks/useNewBrandPage";
import { ImportDropZone } from "./import/ImportDropZone";
import { ImportProgress } from "./import/ImportProgress";
import { ImportReview } from "./import/ImportReview";
import { ScratchForm } from "./ScratchForm";
import { useInterfaceLang } from "@/contexts/useInterfaceLang";

/** Creating a brand: the bare chrome, the two ways to start, and the one in use. */
export function NewBrandView({ mode, onMode, onLogout, scratch, importer }: NewBrandViewProps) {
  const { isAr } = useInterfaceLang();
  const t = (en: string, ar: string) => (isAr ? ar : en);
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex h-16 shrink-0 items-center justify-between px-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/markyos-mark.svg" alt="Markyos" className="h-5 [filter:var(--chrome-mark-invert)]" />
        <button type="button" onClick={onLogout} className="mk-tap cursor-pointer text-caption text-text-faint">
          {t("Log out", "تسجيل الخروج")}
        </button>
      </div>

      <div className="mx-auto flex w-full max-w-[680px] flex-1 flex-col justify-center px-[72px] py-10">
        <Tabs
          label={t("How to start", "طريقة البدء")}
          className="mb-space-10 self-start"
          tabs={START_TABS.map((tab) => ({ key: tab.key, label: isAr ? tab.arLabel : tab.label }))}
          active={mode}
          onChange={onMode}
        />

        {mode === "scratch" ? (
          <ScratchForm {...scratch} />
        ) : importer.stage === "idle" ? (
          <ImportDropZone onFile={importer.onFile} />
        ) : importer.stage === "extracting" ? (
          <ImportProgress fileName={importer.fileName} progress={importer.progress} />
        ) : importer.review ? (
          <ImportReview {...importer.review} />
        ) : null}
      </div>

      <div className="px-[72px] pb-10 text-caption text-text-faint">{t("Arabic and English are both on by default.", "العربية والإنجليزية مفعّلتان افتراضيًا.")}</div>
    </div>
  );
}
