"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { AlertBanner } from "../AlertBanner";
import { Button } from "../buttons/Button";
import { IconButton } from "../buttons/IconButton";
import { useUiStrings } from "../i18n/uiStrings";

type FormDialogProps = {
  open: boolean;
  title: string;
  description?: ReactNode;
  submitLabel: string;
  /** Default: the kit's "Cancel". */
  cancelLabel?: string;
  onClose: () => void;
  /**
   * Runs on submit. Resolve to an error message to keep the dialog open
   * and show it; to `false` to keep it open with nothing more to say (the
   * fields already show their errors); to nothing to close.
   */
  onSubmit: () => Promise<string | false | void> | string | false | void;
  /** `dialog` sits centred; `sheet` slides in from the end edge. Default `dialog`. */
  variant?: "dialog" | "sheet";
  /** Fields, usually InputFields fed by `useZodForm`. */
  children: ReactNode;
};

const FOCUSABLE = 'input,select,textarea,button,[href],[tabindex]:not([tabindex="-1"])';

/**
 * A form in a modal: title, fields, and Cancel / submit. Focus starts on the
 * first field and stays inside; Escape and Cancel close; the submit button
 * waits while `onSubmit` runs, and a returned message shows above the fields.
 */
const FormDialog = ({ open, title, description, submitLabel, cancelLabel, onClose, onSubmit, variant = "dialog", children }: FormDialogProps) => {
  const { t, isAr } = useUiStrings();
  const panel = useRef<HTMLFormElement>(null);
  const titleId = useId();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    panel.current?.querySelector<HTMLElement>("input,select,textarea")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key !== "Tab" || !panel.current) return;
      const items = [...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => !el.hasAttribute("disabled"));
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      opener?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    const failed = await onSubmit();
    setBusy(false);
    if (typeof failed === "string") setError(failed);
    else if (failed !== false) onClose();
  };

  const sheet = variant === "sheet";
  return (
    <div
      dir={isAr ? "rtl" : undefined}
      className={`fixed inset-0 z-dialog flex bg-scrim animate-fade-in ${sheet ? "justify-end" : "items-center justify-center p-6"}`}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <form
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        noValidate
        onSubmit={submit}
        className={`flex flex-col gap-space-6 bg-surface-1 p-space-10 shadow-edge-modal ${
          sheet ? "h-full w-full max-w-110 overflow-y-auto" : "w-full max-w-110 rounded-card"
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id={titleId} className="text-h4 font-medium text-text">{title}</h2>
            {description && <p className="mt-space-1 text-body text-text-muted">{description}</p>}
          </div>
          <IconButton icon="times" label={t.close} onClick={onClose} />
        </div>
        <AlertBanner message={error} />
        <div className="flex flex-col gap-space-5">{children}</div>
        <div className={`flex items-center justify-end gap-space-3 ${sheet ? "mt-auto" : ""}`}>
          <Button type="button" variant="outline" onClick={onClose}>{cancelLabel ?? t.cancel}</Button>
          <Button type="submit" variant="primary" disabled={busy}>{busy ? t.saving : submitLabel}</Button>
        </div>
      </form>
    </div>
  );
};

/** FormDialog as a sheet from the end edge: longer forms, or a form beside its context. */
const FormSheet = (props: Omit<FormDialogProps, "variant">) => <FormDialog {...props} variant="sheet" />;

export { FormDialog, FormSheet };
export type { FormDialogProps };
