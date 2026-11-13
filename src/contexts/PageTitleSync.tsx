"use client";

import { usePathname } from "next/navigation";
import { useApp } from "./AppContext";
import { useInterfaceLang } from "./useInterfaceLang";
import { pageTitle } from "@/lib/i18n/pageTitles";

/** Titles follow browser-local language and authorized workspace state. */
export function PageTitleSync() {
  const pathname = usePathname();
  const { myWorkspaces, state, uiLang } = useApp();
  const { lang } = useInterfaceLang();
  const slug = pathname.match(/^\/w\/([^/]+)/)?.[1];
  const workspace = state.session ? myWorkspaces.find(ws => encodeURIComponent(ws.slug) === slug || ws.slug === slug) : undefined;
  const title = pageTitle(pathname, workspace ? uiLang(workspace) : lang, workspace?.name);
  return <title>{title}</title>;
}
