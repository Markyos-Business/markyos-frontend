"use client";

import { EmptyHint, TabPanel, Tabs, useTabIds } from "@/components/ui";
import type { Draft } from "@/types";
import type { DraftsTab } from "../hooks/use-drafts-page";
import { DraftCard } from "./draft-card";

type DraftsViewProps = {
  isAr: boolean;
  tab: DraftsTab;
  onTab: (tab: DraftsTab) => void;
  pending: Draft[];
  decided: Draft[];
  shown: Draft[];
  onAccept: (d: Draft) => void;
  onReject: (d: Draft) => void;
};

/** The queue: what's waiting, what's decided, one card each. */
export function DraftsView({ isAr, tab, onTab, pending, decided, shown, onAccept, onReject }: DraftsViewProps) {
  const tabIds = useTabIds();
  const t = (en: string, ar: string) => (isAr ? ar : en);
  return (
    <div className="flex min-h-0 max-w-[860px] flex-1 flex-col gap-6 overflow-auto px-7 py-6.5">
      <div>
        <h1 className="mb-1.5 font-display text-[30px] font-semibold tracking-tight">{isAr ? "المسودات" : "Drafts"}</h1>
        <p className="text-[14px] text-text-muted">
          {t(
            "Everything a discovery questionnaire, an import or a palette read has proposed. Nothing here has changed the brand — it changes when you accept it.",
            "كل ما اقترحه استبيان استكشاف أو استيراد أو قراءة ألوان. لا شيء هنا غيّر العلامة بعد، فالتغيير يحدث عند قبولك."
          )}
        </p>
      </div>

      <Tabs {...tabIds}
        variant="pill"
        label={isAr ? "المسودات" : "Drafts"}
        active={tab}
        onChange={onTab}
        tabs={[
          { key: "pending", label: `${t("Waiting", "بانتظار القرار")} (${pending.length})` },
          { key: "decided", label: `${t("Decided", "محسومة")} (${decided.length})` },
        ]}
      />

      <TabPanel id={tabIds.panelId} tabsId={tabIds.id} active={tab}>
      {shown.length === 0 ? (
        <EmptyHint>
          {tab === "pending"
            ? t("Nothing waiting. Send a discovery questionnaire, or import a document, and answers land here for review.", "لا شيء بانتظار القرار. أرسل استبيان استكشاف أو استورد مستندًا، وستصل الإجابات هنا للمراجعة.")
            : t("Nothing decided yet.", "لم يُحسم شيء بعد.")}
        </EmptyHint>
      ) : (
        <div className="flex flex-col gap-3">
          {shown.map((d) => (
            <DraftCard key={d.id} draft={d} isAr={isAr} onAccept={onAccept} onReject={onReject} />
          ))}
        </div>
      )}
      </TabPanel>
    </div>
  );
}
