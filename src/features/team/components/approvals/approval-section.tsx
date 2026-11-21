"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import { useAppActions } from "@/contexts/AppContext";
import { ActionsDropdown, Badge, Button, EmptyHint, Icon, Section, useDialog, useToast } from "@/components/ui";
import { InputField } from "@/components/ui";
import { API_ENABLED, ApiError } from "@/lib/api/client";
import { formatRelative } from "@/lib/utils";
import type { ApprovalStatus, Workspace } from "@/types";

const STATUS_ICON = { approved: "check-circle", rejected: "exclamation-circle", pending: "clock" } as const;
const STATUS_COLOR = { approved: "text-success", rejected: "text-danger", pending: "text-warning" } as const;

type Props = { ws: Workspace; canGovern: boolean; canPropose: boolean; isAr: boolean };

/** The server confirms every proposal and decision before it appears here. */
export function ApprovalSection({ ws, canGovern, canPropose, isAr }: Props) {
  const { proposeApproval, resolveApproval, refreshApprovals } = useAppActions();
  const { showToast } = useToast();
  const { confirm } = useDialog();
  const [text, setText] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(API_ENABLED);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reads, setReads] = useState(0);
  const inFlight = useRef(false);
  const attempt = useRef<{ key: string; id: string } | null>(null);

  useEffect(() => {
    if (!API_ENABLED) return;
    let canceled = false;
    void refreshApprovals(ws.id).then(
      () => { if (!canceled) { setLoading(false); setError(null); } },
      () => { if (!canceled) { setLoading(false); setError(isAr ? "تعذّر تحميل طلبات الاعتماد. حاول التحديث مجددًا." : "The approval queue could not be loaded. Try refreshing again."); } },
    );
    return () => { canceled = true; };
  }, [ws.id, reads, refreshApprovals, isAr]);

  async function propose(event: FormEvent) {
    event.preventDefault();
    if (!canPropose || inFlight.current || !text.trim()) return;
    inFlight.current = true;
    setBusy("proposal");
    setError(null);
    try {
      const key = JSON.stringify([ws.id, text.trim()]);
      if (attempt.current?.key !== key) attempt.current = { key, id: crypto.randomUUID() };
      await proposeApproval(ws.id, text.trim(), attempt.current.id);
      attempt.current = null;
      setText("");
      showToast(isAr ? "تم إرسال المقترح لمراجعة المالك." : "Change proposed — waiting on an owner to review.", "success");
    } catch {
      setError(isAr ? "تعذّر إرسال المقترح. احتفظنا بالنص؛ حاول مجددًا." : "Your proposal could not be sent. Your text is kept; try again.");
    } finally { inFlight.current = false; setBusy(null); }
  }

  async function decide(id: string, status: Exclude<ApprovalStatus, "pending">) {
    if (!canGovern || inFlight.current) return;
    // Rejecting can't be taken back, so it asks first; approving is the queue's everyday job.
    if (status === "rejected") {
      const ok = await confirm({
        title: isAr ? "رفض هذا المقترح؟" : "Reject this proposal?",
        body: isAr ? "يُغلق المقترح ولا يمكن اعتماده بعد ذلك." : "It's closed and can't be approved afterwards.",
        confirmLabel: isAr ? "رفض" : "Reject",
        tone: "danger",
        isAr,
      });
      if (!ok) return;
    }
    inFlight.current = true;
    setBusy(id);
    setError(null);
    try {
      await resolveApproval(ws.id, id, status, (notes[id] ?? "").trim());
      showToast(status === "approved" ? (isAr ? "تم اعتماد المقترح." : "Proposal approved.") : (isAr ? "تم رفض المقترح." : "Proposal rejected."), "success");
    } catch (failure) {
      setError(failure instanceof ApiError && failure.status === 409
        ? (isAr ? "تم اتخاذ قرار بشأن هذا المقترح مسبقًا. حدّث القائمة للاطلاع على القرار الحالي." : "This proposal was already decided. Refresh the queue to see the current decision.")
        : (isAr ? "تعذّر حفظ القرار. لم يتم تأكيد أي تغيير." : "The decision could not be saved. No change has been confirmed."));
    } finally { inFlight.current = false; setBusy(null); }
  }

  const statusLabel = (status: ApprovalStatus) => isAr
    ? ({ pending: "قيد الانتظار", approved: "معتمد", rejected: "مرفوض" }[status])
    : ({ pending: "Pending", approved: "Approved", rejected: "Rejected" }[status]);

  return (
    <Section title={isAr ? "طلبات الاعتماد" : "Approval queue"} icon="check-circle"
      right={API_ENABLED ? <Button variant="link" size="sm" disabled={loading || busy !== null} onClick={() => { setLoading(true); setReads((n) => n + 1); }}>{loading ? (isAr ? "جارٍ التحميل…" : "Loading…") : (isAr ? "تحديث الطلبات" : "Refresh approvals")}</Button> : undefined}>
      {canPropose ? <form onSubmit={(event) => void propose(event)} className="flex items-end gap-ctl-row" aria-busy={busy === "proposal"}>
        <InputField size="sm" dir="auto" value={text} onChange={(event) => setText(event.target.value)} required maxLength={2000} disabled={loading || busy !== null}
          aria-label={isAr ? "صف التغيير الذي تقترحه" : "Describe the change you're proposing"}
          placeholder={isAr ? "اقترح تغييرًا — مثل إضافة لون ثانوي جديد" : "Propose a change — e.g. add a new secondary colour"} className="flex-1" />
        <Button type="submit" variant="soft" size="sm" disabled={loading || busy !== null} className="shrink-0 shadow-edge">{busy === "proposal" ? (isAr ? "جارٍ الإرسال…" : "Sending…") : (isAr ? "اقتراح" : "Propose")}</Button>
      </form> : <p className="text-[13px] text-text-muted">{isAr ? "يمكنك الاطلاع على المقترحات. يمكن للمالك والمحررين اقتراح تغييرات." : "You can view proposals. Owners and editors can propose changes."}</p>}
      {error && <p role="alert" className="text-[13px] text-danger">{error}</p>}
      {ws.approvals.length === 0 ? <EmptyHint>{loading ? (isAr ? "جارٍ تحميل المقترحات…" : "Loading proposals…") : (isAr ? "لا توجد مقترحات بعد. يقترح المحررون التغييرات ويعتمدها المالك أو يرفضها." : "No proposals yet. Editors propose changes here; owners approve or reject them.")}</EmptyHint> : <div className="flex flex-col gap-field-stack-compact">{ws.approvals.map((approval) => (
        <div key={approval.id} className="mk-surface flex items-start gap-ctl-row rounded-card bg-surface-2 p-3.5">
          <Icon name={STATUS_ICON[approval.status]} size={16} className={`mt-0.5 shrink-0 ${STATUS_COLOR[approval.status]}`} />
          <div className="min-w-0 flex-1 flex flex-col gap-field-stack-compact">
            <div dir="auto" className="bidi-auto text-[13px] text-text-secondary">{approval.summary}</div>
            <div className="flex flex-wrap items-center gap-ctl-row text-[12px] text-text-faint">
              <span dir="auto" className="bidi-auto">{approval.proposedBy}</span><span>· {formatRelative(approval.createdAt)}</span>
              <Badge tone={approval.status === "approved" ? "success" : approval.status === "rejected" ? "danger" : "warning"}>{statusLabel(approval.status)}</Badge>
              {approval.legacy && <Badge tone="neutral">{isAr ? "سجل سابق" : "Earlier record"}</Badge>}
            </div>
            {approval.reviewNote && <p dir="auto" className="bidi-auto text-[13px] text-text-muted">{approval.reviewNote}</p>}
            {approval.resolvedBy && <p dir="auto" className="bidi-auto text-[12px] text-text-faint">{isAr ? "القرار بواسطة: " : "Decided by: "}{approval.resolvedBy}{approval.resolvedAt ? ` · ${formatRelative(approval.resolvedAt)}` : ""}</p>}
            {approval.status === "pending" && canGovern && <div className="flex flex-col gap-field-stack-compact">
              <InputField size="sm" dir="auto" value={notes[approval.id] ?? ""} onChange={(event) => setNotes((previous) => ({ ...previous, [approval.id]: event.target.value }))} maxLength={2000} disabled={loading || busy !== null}
                aria-label={`${isAr ? "ملاحظة المراجعة: " : "Review note for "}${approval.summary}`}
                placeholder={isAr ? "ملاحظة مراجعة اختيارية" : "Optional review note"} />
            </div>}
          </div>
          {/* Approve and Reject in the row's ⋯ menu, at the end of the row like every list. */}
          {approval.status === "pending" && canGovern && (
            <ActionsDropdown
              iconOnly
              size="sm"
              label={isAr ? `إجراءات ${approval.summary}` : `${approval.summary} actions`}
              items={[
                { label: busy === approval.id ? (isAr ? "جارٍ الحفظ…" : "Saving…") : (isAr ? "اعتماد" : "Approve"), icon: "check", tone: "success", disabled: loading || busy !== null, onSelect: () => void decide(approval.id, "approved") },
                { label: isAr ? "رفض" : "Reject", icon: "times", tone: "danger", disabled: loading || busy !== null, onSelect: () => void decide(approval.id, "rejected") },
              ]}
            />
          )}
        </div>
      ))}</div>}
    </Section>
  );
}
