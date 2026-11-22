"use client";

import { useState } from "react";
import { ActionsDropdown, AlertBanner, Button, StatusDot, useToast } from "@/components/ui";
import type { ActionItem } from "@/components/ui";
import { ApiError } from "@/lib/api/client";
import { errorText } from "@/lib/api/errorText";
import { createHelpPreview, helpWorkflow } from "../../api/help.api";
import { useHelpCopy } from "../../hooks/use-help-copy";
import type { HelpArticleDoc, HelpLocale, HelpWorkflowAction } from "../../types";
import { ScheduleDialog } from "./schedule-dialog";
import { SendBackDialog } from "./send-back-dialog";
import { inZone, zoneName } from "./zone";

type Props = {
  doc: HelpArticleDoc;
  locale: HelpLocale;
  canWrite: boolean;
  canManage: boolean;
  dirty: boolean;
  save: () => Promise<HelpArticleDoc | null>;
  adopt: (doc: HelpArticleDoc) => void;
};

/**
 * One language's place in the workflow: its status, the reviewer's note, and
 * the steps this person may take. Each language moves on its own; unsaved
 * edits are saved first, so what's submitted or published is what's on screen.
 */
export function WorkflowBar({ doc, locale, canWrite, canManage, dirty, save, adopt }: Props) {
  const { h, lang } = useHelpCopy();
  const w = h.workflow;
  const { showToast } = useToast();
  const [dialog, setDialog] = useState<null | "schedule" | "send_back">(null);
  const [busy, setBusy] = useState(false);
  const t = doc.translations[locale];
  const language = h.articles.language[locale];

  if (!t) return <p className="text-caption text-text-muted">{w.notWritten}</p>;

  const step = async (action: HelpWorkflowAction, extra: { at?: string; comment?: string } = {}): Promise<string | void> => {
    setBusy(true);
    try {
      const current = dirty ? await save() : doc;
      if (!current) return;
      adopt(await helpWorkflow(doc.id, locale, action, { version: current.version, ...extra }));
      showToast(w.toast[action], "success");
      setDialog(null);
    } catch (e: unknown) {
      const body = e instanceof ApiError ? (e.data as { code?: string; current?: HelpArticleDoc } | null) : null;
      const message = body?.code === "not_ready" ? w.notReady : body?.code === "bad_time" ? w.scheduleDialog.future : body?.current ? w.wrongStep : errorText(e, lang);
      if (body?.current) adopt(body.current);
      if (dialog) return message;
      showToast(message, "danger");
    } finally {
      setBusy(false);
    }
  };

  const copyPreview = async () => {
    try {
      const link = await createHelpPreview(doc.id, locale);
      await navigator.clipboard.writeText(`${window.location.origin}${link.path}`);
      showToast(w.toast.preview, "success");
    } catch (e: unknown) {
      showToast(errorText(e, lang), "danger");
    }
  };

  const s = t.status;
  const canGoLive = canManage && (s === "draft" || s === "in_review" || s === "scheduled");
  const more: ActionItem[] = [
    ...(canGoLive ? [{ label: w.actions.schedule, icon: "calendar", onSelect: () => setDialog("schedule") }] : []),
    ...(canManage && s === "scheduled" ? [{ label: w.actions.unschedule, icon: "undo", onSelect: () => void step("unschedule") }] : []),
    ...(canManage && (s === "in_review" || s === "scheduled") ? [{ label: w.actions.send_back, icon: "undo", onSelect: () => setDialog("send_back") }] : []),
    ...(canManage && s === "published" ? [{ label: w.actions.archive, icon: "inbox", onSelect: () => void step("archive") }] : []),
    ...(canManage && s === "archived" ? [{ label: w.actions.unarchive, icon: "undo", onSelect: () => void step("unarchive") }] : []),
    { label: w.actions.preview, icon: "link", onSelect: () => void copyPreview() },
  ];
  const detail =
    s === "scheduled" && t.scheduledFor ? w.scheduledFor(inZone(t.scheduledFor, doc.timezone, lang), zoneName(doc.timezone, lang))
    : s === "published" && t.publishedAt ? w.publishedAt(inZone(t.publishedAt, doc.timezone, lang))
    : s === "in_review" && t.submittedBy ? w.submittedBy(t.submittedBy)
    : "";

  return (
    <div className="flex flex-col gap-space-4 rounded-card bg-surface-2 p-space-5" role="group" aria-label={w.label(language)}>
      <div className="flex flex-wrap items-center gap-ctl-row">
        <div className="flex min-w-0 flex-1 flex-col gap-space-1">
          <StatusDot tone={s === "published" ? "success" : s === "in_review" ? "warning" : s === "scheduled" ? "info" : "neutral"} label={h.editor.statusIn(language, h.articles.status[s])} />
          {detail && <span className="text-caption text-text-muted">{detail}</span>}
        </div>
        {canWrite && s === "draft" && !canManage && (
          <Button variant="primary" size="sm" disabled={busy} onClick={() => void step("submit")}>{w.actions.submit}</Button>
        )}
        {canGoLive && (
          <Button variant="primary" size="sm" disabled={busy} onClick={() => void step("publish")}>{w.actions.publish}</Button>
        )}
        <ActionsDropdown iconOnly size="sm" label={w.moreLabel(language)} items={more} />
      </div>
      {s === "draft" && t.reviewComment && (
        <AlertBanner tone="warning" title={t.reviewedBy ? w.sentBack(t.reviewedBy) : undefined} message={t.reviewComment} />
      )}
      {dialog === "schedule" && <ScheduleDialog zone={doc.timezone} onClose={() => setDialog(null)} onSchedule={(at) => step("schedule", { at })} />}
      {dialog === "send_back" && <SendBackDialog onClose={() => setDialog(null)} onSend={(comment) => step("send_back", { comment })} />}
    </div>
  );
}
