import type { ReactNode } from "react";

/** A keyboard key, so a shortcut reads as a key rather than as prose. */
export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="rounded bg-surface-2 px-1.5 py-[2px] font-mono text-[10.5px] font-semibold text-text-muted">{children}</kbd>;
}
