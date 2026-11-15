"use client";
import { useId, useRef, useSyncExternalStore, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import { usePresence } from "@/hooks/usePresence";
import { EXIT, motionClass } from "@/lib/motion";
import { IconButton } from "../button/icon-button";
import { useUiStrings } from "../ui-strings";
import { usePopupLayer } from "./use-popup-layer";
export type PopupSize = "sm" | "md" | "lg" | "xl";
export type PopupProps = {
  id?: string; open: boolean; onOpenChange: (open: boolean) => void; title: ReactNode; label?: string;
  description?: ReactNode; children: ReactNode; footer?: ReactNode; size?: PopupSize;
  variant?: "center" | "sheet"; role?: "dialog" | "alertdialog"; dir?: "ltr" | "rtl";
  closeLabel?: string; showClose?: boolean; dismissOnEscape?: boolean; dismissOnOutside?: boolean;
  /** Prevent every dismissal while a save is in progress. */
  /** Internal composition: false only when the entire parent form is already portalled. */
  portal?: boolean;
  busy?: boolean; initialFocusRef?: RefObject<HTMLElement | null>; returnFocusRef?: RefObject<HTMLElement | null>;
};
const widths: Record<PopupSize, string> = { sm: "max-w-110", md: "max-w-145", lg: "max-w-180", xl: "max-w-275" };
const subscribe = () => () => {};
/** Shared, controlled modal surface. Keep feature data and submit logic in the caller. */
export function Popup({ id, open, onOpenChange, title, label, description, children, footer, size = "md", variant = "center", role = "dialog", dir, closeLabel, showClose = true, dismissOnEscape = true, dismissOnOutside = true, busy = false, portal = true, initialFocusRef, returnFocusRef }: PopupProps) {
  const ready = useSyncExternalStore(subscribe, () => true, () => false);
  const sheet = variant === "sheet"; const { mounted, closing } = usePresence(open, sheet ? EXIT.slow : EXIT.base);
  const root = useRef<HTMLDivElement>(null); const panel = useRef<HTMLDivElement>(null); const titleId = useId(); const descriptionId = useId(); const { t, isAr } = useUiStrings();
  const close = () => { if (!busy) onOpenChange(false); };
  usePopupLayer({ open: open && ready, panel, root, onClose: close, dismissOnEscape, initialFocusRef, returnFocusRef });
  if (!ready || !mounted) return null;
  const content = <div ref={root} data-popup-root aria-hidden={closing || undefined} inert={closing} dir={dir ?? (isAr ? "rtl" : document.documentElement.dir === "rtl" ? "rtl" : "ltr")}
    className={`fixed inset-0 z-dialog flex bg-scrim ${sheet ? "justify-end" : "items-center justify-center p-space-4"} ${closing ? "pointer-events-none animate-fade-out" : "animate-fade-in-base"}`}
    onMouseDown={event => { if (event.target === event.currentTarget && dismissOnOutside) close(); }}>
    <div ref={panel} id={id} data-popup-panel role={role} aria-modal="true" aria-label={label} aria-labelledby={label ? undefined : titleId} aria-describedby={description ? descriptionId : undefined} aria-busy={busy || undefined} tabIndex={-1}
      className={`flex w-full min-w-0 flex-col bg-surface-1 text-text shadow-edge-modal outline-none ${widths[size]} ${sheet ? "h-dvh" : "max-h-[calc(100dvh-2rem)] rounded-card"} ${motionClass(sheet ? "slideFromEnd" : "dialog", closing)}`}>
      <header className="flex shrink-0 items-start justify-between gap-space-4 px-space-8 pb-space-6 pt-space-8">
        <div className="min-w-0 flex-1">{label ? <div id={titleId}>{title}</div> : <h2 id={titleId} className="text-h4 font-medium">{title}</h2>}{description && <div id={descriptionId} className="mt-space-1 text-body text-text-muted">{description}</div>}</div>
        {showClose && <IconButton icon="times" label={closeLabel ?? t.close} disabled={busy} onClick={close} className="shrink-0" />}
      </header>
      <div className="flex min-h-0 flex-1 flex-col gap-space-6 overflow-y-auto overscroll-contain px-space-8 pb-space-8">{children}</div>
      {footer && <footer className="flex shrink-0 flex-wrap items-center justify-end gap-space-3 px-space-8 py-space-6 shadow-rule-t">{footer}</footer>}
    </div>
  </div>;
  return portal ? createPortal(content, document.body) : content;
}
