"use client";

import { Badge, Button, Icon } from "@/components/ui";
import type { Draft } from "@/types";
import { formatRelative } from "@/lib/utils";
import { SOURCE_META, STATUS_TONE } from "../constants";
import { targetLabel } from "../hooks/useDraftsPage";

type DraftCardProps = {
  draft: Draft;
  isAr: boolean;
  onAccept: (d: Draft) => void;
  onReject: (d: Draft) => void;
};

/** One proposal: where it came from, what it says verbatim, and the decision. */
export function DraftCard({ draft: d, isAr, onAccept, onReject }: DraftCardProps) {
  return (
    <article className="mk-surface flex flex-col gap-3 rounded-2xl bg-surface-1 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 rounded bg-surface-3 px-2 py-[3px] text-[10px] font-semibold text-text-secondary">
            <Icon name={SOURCE_META[d.source].icon} size={10} />
            {isAr ? SOURCE_META[d.source].arLabel : SOURCE_META[d.source].label}
          </span>
          <span className="text-[13px] font-semibold">{targetLabel(d)}</span>
          {d.status !== "pending" && <Badge tone={STATUS_TONE[d.status]}>{d.status}</Badge>}
        </div>
        <span className="shrink-0 text-[11px] text-text-faint">{formatRelative(d.createdAt)}</span>
      </div>

      {/* The proposal, in the reviewer's hands verbatim. A draft
          summarised or trimmed is a draft nobody can judge. */}
      <p dir="auto" className="bidi-auto whitespace-pre-wrap text-[14px] leading-[1.6] text-text-secondary">
        {d.content}
      </p>

      <div className="flex flex-col gap-0.5 text-[11.5px] text-text-faint">
        <span dir="auto" className="bidi-auto">
          {d.provenance.summary}
        </span>
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
          <Button size="sm" onClick={() => void onAccept(d)}>
            Accept
          </Button>
          <Button size="sm" variant="outline" onClick={() => onReject(d)}>
            Reject
          </Button>
        </div>
      )}
    </article>
  );
}
