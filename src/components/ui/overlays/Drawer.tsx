"use client";

import { useEffect, type ReactNode } from "react";
import { IconButton } from "../buttons/IconButton";

type DrawerProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  closeLabel: string;
  children: ReactNode;
};

/**
 * A panel on the page's end side, over the content: a source, a detail, a
 * side task. Escape and the close button dismiss it; it mirrors in RTL.
 */
const Drawer = ({ open, title, onClose, closeLabel, children }: DrawerProps) => {
  useEffect(() => {
    if (!open) return;
    const close = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <aside role="dialog" aria-label={title} className="fixed inset-y-0 end-0 z-40 flex w-full max-w-[440px] flex-col gap-space-6 overflow-y-auto bg-surface-1 p-space-8 shadow-raised">
      <div className="flex items-center justify-between gap-space-4">
        <h2 className="text-h5 font-medium">{title}</h2>
        <IconButton icon="times" label={closeLabel} onClick={onClose} />
      </div>
      {children}
    </aside>
  );
};

export { Drawer };
export type { DrawerProps };
