"use client";

import { useState } from "react";
import { FormDialog, TextareaField } from "@/components/ui";
import { useHelpCopy } from "../../hooks/use-help-copy";

/** Sends a language back to draft with a note the writer sees (and gets by email). */
export function SendBackDialog({ onClose, onSend }: { onClose: () => void; onSend: (comment: string) => Promise<string | void> }) {
  const { h } = useHelpCopy();
  const t = h.workflow.sendBackDialog;
  const [comment, setComment] = useState("");
  return (
    <FormDialog open title={t.title} submitLabel={t.submit} onClose={onClose} onSubmit={() => (comment.trim() ? onSend(comment.trim()) : t.required)}>
      <TextareaField label={t.comment} hint={t.hint} value={comment} dir="auto" rows={4} maxLength={2000} required onChange={(e) => setComment(e.target.value)} />
    </FormDialog>
  );
}
