"use client";

import { type FormEvent, useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { Badge, Button, EmptyHint, Icon, Section, useToast } from "@/components/ui";
import { TextInput } from "@/components/form";
import { formatRelative } from "@/lib/utils";
import type { Workspace } from "@/types";

const STATUS_ICON = {
  approved: "check-circle",
  rejected: "exclamation-circle",
  pending: "clock",
} as const;
const STATUS_COLOR = {
  approved: "text-success",
  rejected: "text-danger",
  pending: "text-warning",
} as const;

type ApprovalSectionProps = {
  ws: Workspace;
  canGovern: boolean;
  actorName: string;
};

/** Proposed changes: editors propose, owners approve or reject. */
export function ApprovalSection({ ws, canGovern, actorName }: ApprovalSectionProps) {
  const { proposeApproval, resolveApproval } = useApp();
  const { showToast } = useToast();
  const [text, setText] = useState("");

  function propose(e: FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    proposeApproval(ws.id, text.trim(), actorName);
    setText("");
    showToast("Change proposed — waiting on an owner to review.", "success");
  }

  return (
    <Section title="Approval queue" icon="check-circle">
      <form onSubmit={propose} className="flex items-end gap-2.5">
        <TextInput
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-label="Describe the change you're proposing"
          placeholder="Propose a change — e.g. add a new secondary color"
          className="flex-1"
        />
        <Button type="submit" variant="soft" size="sm" className="shrink-0 shadow-edge">
          Propose
        </Button>
      </form>
      {ws.approvals.length === 0 ? (
        <EmptyHint>No proposals yet. Editors propose changes here; owners approve or reject them.</EmptyHint>
      ) : (
        <div className="flex flex-col gap-2">
          {ws.approvals.map((a) => (
            <div key={a.id} className="mk-surface flex items-start gap-3 rounded-xl bg-surface-2 p-3.5">
              <Icon name={STATUS_ICON[a.status]} size={16} className={`mt-0.5 shrink-0 ${STATUS_COLOR[a.status]}`} />
              <div className="min-w-0 flex-1">
                <div className="text-[13px] text-text-secondary">{a.summary}</div>
                <div className="mt-0.5 text-[11px] text-text-faint">
                  {a.proposedBy} · {formatRelative(a.createdAt)}
                  {a.reviewNote ? ` · "${a.reviewNote}"` : ""}
                </div>
              </div>
              {a.status === "pending" ? (
                canGovern ? (
                  <div className="flex shrink-0 gap-space-3">
                    <Button variant="success-soft" size="sm" onClick={() => resolveApproval(ws.id, a.id, "approved")}>
                      Approve
                    </Button>
                    <Button variant="danger-soft" size="sm" onClick={() => resolveApproval(ws.id, a.id, "rejected")}>
                      Reject
                    </Button>
                  </div>
                ) : (
                  <Badge tone="warning">Pending</Badge>
                )
              ) : (
                <Badge tone={a.status === "approved" ? "success" : "danger"}>{a.status}</Badge>
              )}
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}
