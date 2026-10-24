import type { ReactNode } from "react";
import { SidebarMenuButton } from "../SidebarDrawer";

/** A plain top bar: where you are on the start side, controls on the end. */
export function AppTopBar({ title, right }: { title?: ReactNode; right?: ReactNode }) {
  return (
    <header className="flex h-[64px] shrink-0 items-center justify-between gap-4 px-5 shadow-[inset_0_-1px_0_var(--hairline)] sm:px-7">
      <div className="flex min-w-0 items-center gap-2">
        <SidebarMenuButton />
        <div className="min-w-0 truncate text-[14px] font-semibold">{title}</div>
      </div>
      <div className="flex shrink-0 items-center gap-3">{right}</div>
    </header>
  );
}
