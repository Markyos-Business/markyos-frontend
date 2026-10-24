import type { ReactNode } from "react";
import { SidebarMenuButton } from "../SidebarDrawer";

/**
 * The spec's TopBar (MARKYOS_UI.md §5): 84px and transparent over the canvas,
 * where you are on the start side (an optional breadcrumb over the title),
 * 22px actions and the avatar on the end.
 */
export function AppTopBar({ title, breadcrumb, right }: { title?: ReactNode; breadcrumb?: ReactNode; right?: ReactNode }) {
  return (
    <header className="flex h-topbar shrink-0 items-center justify-between gap-space-5 px-space-6 sm:px-space-10">
      <div className="flex min-w-0 items-center gap-space-3">
        <SidebarMenuButton />
        <div className="min-w-0">
          {breadcrumb && <div className="truncate text-caption text-text-muted">{breadcrumb}</div>}
          <div className="truncate text-h4 font-medium text-text">{title}</div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-space-5">{right}</div>
    </header>
  );
}
