"use client";

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { usePresence } from "@/hooks/usePresence";
import { EXIT, motionClass } from "@/lib/motion";
import { Button } from "../buttons/Button";
import { useUiStrings } from "../i18n/uiStrings";
import { Icon } from "../primitives/Icon";
import type { ActionItem } from "../buttons/ActionsDropdown";

type ActionSheetProps = {
  open: boolean;
  /** What the actions are for: "Nour Haddad actions". */
  title: string;
  items: ActionItem[];
  onClose: () => void;
};

/**
 * A phone's menu: up from the bottom, in reach of the thumb. A title, one
 * full-width row per action (the destructive ones in red) and Cancel.
 *
 * The scrim, Escape and Cancel all close it without acting. It is modal while
 * open, so focus starts on the first action and goes back to the trigger when
 * it closes (the caller's trigger had focus when it opened).
 */
const ActionSheet = ({ open, title, items, onClose }: ActionSheetProps) => {
  const { t } = useUiStrings();
  const { mounted, closing } = usePresence(open, EXIT.slow);
  const panelRef = useRef<HTMLDivElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    returnTo.current = document.activeElement as HTMLElement | null;
    const frame = requestAnimationFrame(() => panelRef.current?.querySelector<HTMLElement>("[role=menuitem]:not(:disabled), button")?.focus({ preventScroll: true }));
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKey);
      returnTo.current?.focus({ preventScroll: true });
    };
  }, [open, onClose]);

  if (!mounted) return null;
  return createPortal(
    <div
      className={`fixed inset-0 z-dialog flex items-end bg-scrim ${closing ? "pointer-events-none animate-fade-out" : "animate-fade-in-base"}`}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`flex max-h-[85dvh] w-full flex-col overflow-y-auto rounded-t-card bg-surface-1 pb-[max(var(--space-8),env(safe-area-inset-bottom))] shadow-raised ${motionClass("slideFromBottom", closing)}`}
      >
        {/* The grab handle: says "this came up from below and goes back down". */}
        <span aria-hidden className="mx-auto mt-space-3 h-1 w-10 shrink-0 rounded-sm bg-hairline-strong" />
        <h2 id={titleId} className="px-space-8 pb-space-6 pt-space-6 text-h5 font-medium text-text shadow-rule-b">
          {title}
        </h2>
        <div role="menu" aria-labelledby={titleId} className="flex flex-col">
          {items.map((item) => {
            const danger = item.tone === "danger";
            return (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                aria-disabled={item.disabled}
                onClick={() => {
                  onClose();
                  item.onSelect();
                }}
                className={`flex min-h-14 w-full items-center gap-space-6 px-space-8 py-space-5 text-start text-body font-medium shadow-rule-b disabled:cursor-not-allowed disabled:opacity-50 ${danger ? "text-danger" : "text-text"}`}
              >
                <Icon name={item.icon} size={22} className={`shrink-0 ${danger ? "text-danger" : "text-text-muted"}`} />
                <span className="flex min-w-0 flex-col">
                  {item.label}
                  {/* A tooltip never shows on a touch screen, so the reason is written out. */}
                  {item.disabled && item.reason && <span className="text-caption font-normal text-text-muted">{item.reason}</span>}
                </span>
              </button>
            );
          })}
        </div>
        <div className="px-space-8 pt-space-8">
          <Button variant="outline" block onClick={onClose}>
            {t.cancel}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export { ActionSheet };
export type { ActionSheetProps };
