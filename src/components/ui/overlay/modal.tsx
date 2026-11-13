"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { IconButton } from "../button/icon-button";
import { useUiStrings } from "../ui-strings";
import { EXIT, motionClass } from "@/lib/motion";
import { usePresence } from "@/hooks/usePresence";

type ModalSize = "sm" | "md" | "lg" | "xl";

const widths: Record<ModalSize, string> = {
  sm: "max-w-110",
  md: "max-w-145",
  lg: "max-w-180",
  xl: "max-w-275",
};

type ModalProps = {
  /** Default true, for a modal its parent mounts only while it is open. */
  open?: boolean;
  title: ReactNode;
  /**
   * The dialog's accessible name, when the title is not plain text (an
   * editable name, say). The title then renders as is, not as a heading.
   */
  label?: string;
  /** One line under the title: what this is for. */
  description?: ReactNode;
  onClose: () => void;
  /** sm 440 · md 580 · lg 720 · xl 1100. Default md. */
  size?: ModalSize;
  /** `center` sits in the middle; `sheet` slides in from the end edge, full height. */
  variant?: "center" | "sheet";
  /** Pinned under the content, which scrolls between header and footer. */
  footer?: ReactNode;
  /** The close button's name, when this opens outside the app's language (a client site). */
  closeLabel?: string;
  children: ReactNode;
};

const FOCUSABLE = 'input,select,textarea,button,[href],[tabindex]:not([tabindex="-1"])';

/**
 * A centred panel over the page for work that carries its own layout: an
 * importer with steps, a preview, a picker. (A plain form is `FormDialog`; a
 * yes/no is `useDialog().confirm`.)
 *
 * It owns the behaviour every modal needs and the hand-built ones each got
 * partly right: Escape and the scrim close it, Tab stays inside, focus starts
 * on the first control and goes back to the opener afterwards, and it zooms
 * in and out with the dialog motion.
 */
const Modal = ({ open = true, title, label, description, onClose, size = "md", variant = "center", footer, closeLabel, children }: ModalProps) => {
  const sheet = variant === "sheet";
  const { mounted, closing } = usePresence(open, sheet ? EXIT.slow : EXIT.base);
  const { t } = useUiStrings();
  const panel = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    const first = panel.current?.querySelector<HTMLElement>("input,select,textarea") ?? panel.current;
    first?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        closeRef.current();
      }
      if (e.key !== "Tab" || !panel.current) return;
      const items = [...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => !el.hasAttribute("disabled"));
      const head = items[0];
      const tail = items[items.length - 1];
      if (e.shiftKey && document.activeElement === head) {
        e.preventDefault();
        tail?.focus();
      } else if (!e.shiftKey && document.activeElement === tail) {
        e.preventDefault();
        head?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      opener?.focus?.();
    };
  }, [open]);

  if (!mounted) return null;
  return (
    <div
      className={`fixed inset-0 z-dialog flex bg-scrim ${sheet ? "justify-end" : "items-center justify-center p-6"} ${closing ? "pointer-events-none animate-fade-out" : "animate-fade-in-base"}`}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={label ? undefined : titleId}
        aria-label={label}
        tabIndex={-1}
        className={`flex w-full flex-col bg-surface-1 shadow-edge-modal outline-none ${widths[size]} ${
          sheet ? "h-full" : "max-h-[86vh] rounded-card"
        } ${motionClass(sheet ? "slideFromEnd" : "dialog", closing)}`}
      >
        <div className="flex shrink-0 items-start justify-between gap-space-4 px-space-8 pt-space-8 pb-space-6">
          <div className="min-w-0 flex-1">
            {label ? (
              title
            ) : (
              <h2 id={titleId} className="text-h4 font-medium text-text">
                {title}
              </h2>
            )}
            {description && <p className="mt-space-1 text-body text-text-muted">{description}</p>}
          </div>
          <IconButton icon="times" label={closeLabel ?? t.close} onClick={onClose} className="shrink-0" />
        </div>
        <div className={`flex min-h-0 flex-1 flex-col gap-space-6 overflow-y-auto px-space-8 ${footer ? "pb-space-6" : "pb-space-8"}`}>{children}</div>
        {footer && <div className="flex shrink-0 items-center gap-space-3 px-space-8 py-space-6 shadow-rule-t">{footer}</div>}
      </div>
    </div>
  );
};

export { Modal };
export type { ModalProps, ModalSize };
