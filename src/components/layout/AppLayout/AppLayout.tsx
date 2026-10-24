import type { CSSProperties, ReactNode, Ref } from "react";

/**
 * The signed-in app's frame: a sidebar beside one column that holds an
 * optional top bar and the page.
 *
 * Exactly one viewport tall, with the document itself locked: the chrome has
 * to stay put while only the pane a page designates scrolls. With
 * `min-h-screen` the shell grew to content height instead, so the whole
 * document scrolled and took the chrome with it — and any inner
 * `flex-1 min-h-0 overflow-y-auto` never bounded, so it never scrolled either.
 */
export function AppLayout({
  sidebar,
  topbar,
  children,
  dir,
  style,
  paneRef,
}: {
  /** Usually an `AppSidebar`; omit or pass `false` for a full-width page. */
  sidebar?: ReactNode;
  topbar?: ReactNode;
  children: ReactNode;
  dir?: "ltr" | "rtl";
  style?: CSSProperties;
  /** The column beside the sidebar, for a shell that listens to it. */
  paneRef?: Ref<HTMLDivElement>;
}) {
  return (
    <div dir={dir} className="flex h-screen overflow-hidden" style={style}>
      {sidebar}
      <div ref={paneRef} className="flex min-h-0 min-w-0 flex-1 flex-col">
        {topbar}
        {children}
      </div>
    </div>
  );
}
