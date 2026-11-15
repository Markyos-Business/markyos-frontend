"use client";
import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { AlertBanner } from "../alert-banner";
import { Button } from "../button/button";
import { Popup } from "../popup";
import { useUiStrings } from "../ui-strings";
export type FormDialogProps = {
  open: boolean; title: string; description?: ReactNode; submitLabel: string; cancelLabel?: string;
  onClose: () => void; onSubmit: () => Promise<string | false | void> | string | false | void;
  variant?: "dialog" | "sheet"; children: ReactNode;
  /** Safe, localized copy for an unexpected thrown error. */
  errorMessage?: string;
};
export function FormDialog({ open, title, description, submitLabel, cancelLabel, onClose, onSubmit, variant = "dialog", children, errorMessage }: FormDialogProps) {
  const { t, isAr } = useUiStrings(); const formId = useId(); const pending = useRef(false); const session = useRef(0); const alive = useRef(true);
  const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  useEffect(() => {
    session.current++;
    if (open) {
      pending.current = false;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset feedback for a new externally controlled session
      setError(null);
      setBusy(false);
    }
  }, [open]);
  async function submit(event: FormEvent) {
    event.preventDefault(); if (pending.current) return;
    const current = session.current; pending.current = true; setBusy(true); setError(null);
    try { const failed = await onSubmit(); if (!alive.current || current !== session.current) return; if (typeof failed === "string") setError(failed); else if (failed !== false) onClose(); }
    catch { if (alive.current && current === session.current) setError(errorMessage ?? t.form.inlineFailed); }
    finally { if (current === session.current) { pending.current = false; if (alive.current) setBusy(false); } }
  }
  return <Popup open={open} onOpenChange={next => { if (!next) onClose(); }} title={title} description={description} size="sm" variant={variant === "sheet" ? "sheet" : "center"} dir={isAr ? "rtl" : "ltr"} busy={busy}
    footer={<><Button type="button" variant="outline" onClick={onClose} disabled={busy}>{cancelLabel ?? t.cancel}</Button><Button type="submit" form={formId} disabled={busy}>{busy ? t.saving : submitLabel}</Button></>}>
    <form id={formId} noValidate onSubmit={submit} className="flex min-w-0 flex-col gap-space-5"><AlertBanner message={error} />{children}</form>
  </Popup>;
}
export const FormSheet = (props: Omit<FormDialogProps, "variant">) => <FormDialog {...props} variant="sheet" />;
