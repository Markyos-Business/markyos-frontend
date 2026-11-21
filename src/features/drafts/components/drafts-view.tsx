"use client";

import { AppFooter, Button, EmptyState, TabPanel, Tabs, useTabIds, PageHeader } from "@/components/ui";
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
  /** Where proposals come from, offered when the queue is empty. */
  discoveryHref: string;
};

/** The queue: what's waiting, what's decided, one card each. */
export function DraftsView({ isAr, tab, onTab, pending, decided, shown, onAccept, onReject, discoveryHref }: DraftsViewProps) {
  const tabIds = useTabIds();
  const t = (en: string, ar: string) => (isAr ? ar : en);
  return (
    <div className="flex min-h-0 max-w-[860px] flex-1 flex-col gap-6 overflow-auto px-7 py-6.5">
      <PageHeader title={isAr ? "المسودات" : "Drafts"} description={t(
            "Everything a discovery questionnaire, an import or a palette read has proposed. Nothing here has changed the brand — it changes when you accept it.",
            "كل ما اقترحه استبيان استكشاف أو استيراد أو قراءة ألوان. لا شيء هنا غيّر العلامة بعد، فالتغيير يحدث عند قبولك."
          )} />

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
        tab === "pending" ? (
          <EmptyState
            icon="inbox"
            title={t("Nothing to review.", "لا شيء للمراجعة.")}
            description={t("Send a discovery questionnaire, or import a document, and what it proposes lands here.", "أرسل استبيان استكشاف أو استورد مستندًا، وسيصل ما يقترحه إلى هنا.")}
            action={<Button variant="secondary" href={discoveryHref}>{t("Open Discovery", "فتح الاكتشاف")}</Button>}
          />
        ) : (
          <EmptyState
            icon="check-circle"
            title={t("Nothing decided yet.", "لم يُحسم شيء بعد.")}
            description={t("Drafts you accept or reject are kept here, with their reasoning.", "تُحفظ هنا المسودات التي تقبلها أو ترفضها، مع مبرراتها.")}
          />
        )
      ) : (
        <div className="flex flex-col gap-3">
          {shown.map((d) => (
            <DraftCard key={d.id} draft={d} isAr={isAr} onAccept={onAccept} onReject={onReject} />
          ))}
        </div>
      )}
      </TabPanel>
      <AppFooter lang={isAr ? "ar" : "en"} className="mt-auto" />
    </div>
  );
}
