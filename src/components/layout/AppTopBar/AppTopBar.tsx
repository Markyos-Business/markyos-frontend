import type { ReactNode } from "react";
import { SidebarMenuButton } from "../SidebarDrawer";

/**
 * The spec's TopBar (MARKYOS_UI.md §5): 84px and transparent over the canvas,
 * where you are on the start side (an optional breadcrumb over the title),
 * 22px actions and the avatar on the end.
 */
export function AppTopBar({
  title,
  subtitle,
  breadcrumb,
  search,
  right,
}: {
  title?: ReactNode;
  /** Under the title, e.g. "Welcome back, Nour". */
  subtitle?: ReactNode;
  breadcrumb?: ReactNode;
  /** Between the title and the actions, e.g. a SearchField with ⌘K; hidden on a phone. */
  search?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <header className="flex h-topbar shrink-0 items-center justify-between gap-space-5 px-space-6 sm:px-space-10">
      <div className="flex min-w-0 items-center gap-space-3">
        <SidebarMenuButton />
        <div className="min-w-0">
          {breadcrumb && <div className="truncate text-caption text-text-muted">{breadcrumb}</div>}
          <div className="truncate text-h4 font-medium text-text">{title}</div>
          {subtitle && <div className="truncate text-caption text-text-muted">{subtitle}</div>}
        </div>
      </div>
      {search && <div className="hidden min-w-0 flex-1 justify-center md:flex">{search}</div>}
      <div className="flex shrink-0 items-center gap-space-5">{right}</div>
    </header>
  );
}
