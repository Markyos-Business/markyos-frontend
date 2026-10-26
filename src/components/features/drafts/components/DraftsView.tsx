"use client";

import { EmptyHint, Tabs } from "@/components/ui";
import type { Draft } from "@/types";
import type { DraftsTab } from "../hooks/useDraftsPage";
import { DraftCard } from "./DraftCard";

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
  return (
    <div className="flex min-h-0 max-w-[860px] flex-1 flex-col gap-6 overflow-auto px-7 py-6.5">
      <div>
        <h1 className="mb-1.5 font-display text-[30px] font-semibold tracking-tight">{isAr ? "المسودات" : "Drafts"}</h1>
        <p className="text-[14px] text-text-muted">
          Everything a discovery form, an import or a palette read has proposed. Nothing here has changed the
          brand — it changes when you accept it.
        </p>
      </div>

      <Tabs
        variant="pill"
        label={isAr ? "المسودات" : "Drafts"}
        active={tab}
        onChange={onTab}
        tabs={[
          { key: "pending", label: `Waiting (${pending.length})` },
          { key: "decided", label: `Decided (${decided.length})` },
        ]}
      />

      {shown.length === 0 ? (
        <EmptyHint>
          {tab === "pending"
            ? "Nothing waiting. Send a discovery form, or import a document, and answers land here for review."
            : "Nothing decided yet."}
        </EmptyHint>
      ) : (
        <div className="flex flex-col gap-3">
          {shown.map((d) => (
            <DraftCard key={d.id} draft={d} isAr={isAr} onAccept={onAccept} onReject={onReject} />
          ))}
        </div>
      )}
    </div>
  );
}
