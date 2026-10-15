"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useApp } from "@/lib/store";
import { useToast } from "@/components/Toast";
import { useDialog } from "@/components/Dialog";
import { TopBar } from "@/components/workspace/TopBar";
import { Icon } from "@/components/Icon";
import { Badge, EmptyHint } from "@/components/workspace/SectionUI";
import { PillButton } from "@/components/PillButton";
import { Draft, DraftSource, DraftStatus } from "@/lib/types";
import { formatRelative } from "@/lib/utils";

/**
 * One queue for everything proposed into this brand.
 *
 * The brief, document import and palette extraction all write here rather than
 * into the brand, and this is where a person decides. Keeping it in one place
 * is the point: a reviewer should not have to visit eight tabs to find out what
 * is waiting, and a producer should not get to choose whether it is reviewed.
 */

const SOURCE_META: Record<DraftSource, { label: string; arLabel: string; icon: string }> = {
  brief: { label: "Brief", arLabel: "الموجز", icon: "clipboard-list" },
  ai: { label: "AI", arLabel: "ذكاء اصطناعي", icon: "robot" },
  ingestion: { label: "Import", arLabel: "استيراد", icon: "file-import" },
  palette: { label: "Palette", arLabel: "لوحة الألوان", icon: "palette" },
};

/** Human names for the strategy fields a draft can target. */
const FIELD_LABEL: Record<string, string> = {
  purpose: "Purpose",
  mission: "Mission",
  vision: "Vision",
  targetAudienceSummary: "Target audience",
  positioningStatement: "Brand positioning",
  uvp: "Unique value proposition",
  purposeAr: "Purpose (Arabic)",
  missionAr: "Mission (Arabic)",
  visionAr: "Vision (Arabic)",
  targetAudienceSummaryAr: "Target audience (Arabic)",
  positioningStatementAr: "Brand positioning (Arabic)",
  uvpAr: "Unique value proposition (Arabic)",
};

const STATUS_TONE: Record<DraftStatus, "accent" | "success" | "neutral" | "warning"> = {
  pending: "accent",
  accepted: "success",
  rejected: "neutral",
  superseded: "neutral",
};

type Tab = "pending" | "decided";

export default function DraftsPage() {
  const params = useParams<{ slug: string }>();
  const { getWorkspace, acceptDraft, rejectDraft, uiLang } = useApp();
  const { showToast } = useToast();
  const { confirm } = useDialog();
  const ws = getWorkspace(params.slug);

  const [tab, setTab] = useState<Tab>("pending");

  const { pending, decided } = useMemo(() => {
    const all = ws?.drafts ?? [];
    return {
      pending: all.filter((d) => d.status === "pending"),
      decided: all.filter((d) => d.status !== "pending"),
    };
  }, [ws?.drafts]);

  if (!ws) return null;
  const isAr = uiLang(ws) === "ar";

  function targetLabel(d: Draft) {
    if (d.targetType === "strategyField") return FIELD_LABEL[d.targetRef] ?? d.targetRef;
    return d.targetRef;
  }

  /**
   * Accepting overwrites whatever is in the field today, so when there is
   * something to lose the person is shown it first. A confirm on an empty
   * field would be ceremony; a silent overwrite of a written positioning
   * statement would be a loss.
   */
  async function handleAccept(d: Draft) {
    const current =
      d.targetType === "strategyField"
        ? ((ws!.strategy as unknown as Record<string, string | undefined>)[d.targetRef] ?? "")
        : "";

    if (current.trim()) {
      const ok = await confirm({
        title: `Replace ${targetLabel(d)}?`,
        body: `There is already something written here. Accepting replaces it.\n\nCurrent:\n${current.slice(0, 220)}`,
        confirmLabel: "Replace it",
        tone: "danger",
      });
      if (!ok) return;
    }
    acceptDraft(ws!.id, d.id);
    showToast(`Accepted into ${targetLabel(d)}.`, "success");
  }

  const shown = tab === "pending" ? pending : decided;

  return (
    <>
      <TopBar workspace={ws} section="Drafts" arSection="المسودات" />
      <div className="flex-1 min-h-0 px-7 py-6.5 flex flex-col gap-6 overflow-auto max-w-[860px]">
        <div>
          <h1 className="text-[30px] font-semibold tracking-tight mb-1.5" style={{ fontFamily: "var(--font-display)" }}>
            {isAr ? "المسودات" : "Drafts"}
          </h1>
          <p className="text-[14px]" style={{ color: "var(--text-muted)" }}>
            Everything the brief, an import or a palette read has proposed. Nothing here has changed the
            brand — it changes when you accept it.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {(["pending", "decided"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className="h-8 px-3.5 rounded-full text-[12px] font-semibold cursor-pointer"
              style={{
                background: tab === t ? "var(--accent-soft)" : "var(--surface-1)",
                color: tab === t ? "var(--accent-on-soft)" : "var(--text-muted)",
              }}
            >
              {t === "pending" ? `Waiting (${pending.length})` : `Decided (${decided.length})`}
            </button>
          ))}
        </div>

        {shown.length === 0 ? (
          <EmptyHint>
            {tab === "pending"
              ? "Nothing waiting. Send a discovery brief, or import a document, and answers land here for review."
              : "Nothing decided yet."}
          </EmptyHint>
        ) : (
          <div className="flex flex-col gap-3">
            {shown.map((d) => (
              <article
                key={d.id}
                className="rounded-2xl p-5 flex flex-col gap-3"
                style={{ background: "var(--surface-1)", boxShadow: "inset 0 0 0 1px var(--hairline-strong)" }}
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="text-[10px] font-semibold px-2 py-[3px] rounded flex items-center gap-1.5"
                      style={{ background: "var(--surface-3)", color: "var(--text-secondary)" }}
                    >
                      <Icon name={SOURCE_META[d.source].icon} size={10} />
                      {isAr ? SOURCE_META[d.source].arLabel : SOURCE_META[d.source].label}
                    </span>
                    <span className="text-[13px] font-semibold">{targetLabel(d)}</span>
                    {d.status !== "pending" && <Badge tone={STATUS_TONE[d.status]}>{d.status}</Badge>}
                  </div>
                  <span className="text-[11px] shrink-0" style={{ color: "var(--text-faint)" }}>
                    {formatRelative(d.createdAt)}
                  </span>
                </div>

                {/* The proposal, in the reviewer's hands verbatim. A draft
                    summarised or trimmed is a draft nobody can judge. */}
                <p
                  dir="auto"
                  className="bidi-auto text-[14px] leading-[1.6] whitespace-pre-wrap"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {d.content}
                </p>

                <div className="text-[11.5px] flex flex-col gap-0.5" style={{ color: "var(--text-faint)" }}>
                  <span dir="auto" className="bidi-auto">{d.provenance.summary}</span>
                  <span>
                    From {d.provenance.requestedBy}
                    {d.provenance.inputs.length > 0 && ` · ${d.provenance.inputs.join(", ")}`}
                    {d.provenance.model && ` · ${d.provenance.model}`}
                  </span>
                  {d.decidedAt && (
                    <span>
                      {d.status} by {d.decidedBy ?? "someone"} {formatRelative(d.decidedAt)}
                    </span>
                  )}
                </div>

                {d.status === "pending" && (
                  <div className="flex items-center gap-2 pt-1">
                    <PillButton size="sm" onClick={() => void handleAccept(d)}>
                      Accept
                    </PillButton>
                    <PillButton
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        rejectDraft(ws.id, d.id);
                        showToast("Rejected — kept with its reasoning.");
                      }}
                    >
                      Reject
                    </PillButton>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
