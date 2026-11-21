import type { ReactNode } from "react";
import type { BadgePageType } from "../made-with-badge/badge-events";
import { BadgeFrame } from "./badge-frame";
import { MARKETING_URL } from "@/lib/marketing";

type PublicPageShellProps = {
  /** From the server's decision for this page's owner. A paid page passes false and its HTML has no badge. */
  showBadge: boolean;
  /** What kind of public page; a new kind is "other" until it names itself. */
  pageType?: BadgePageType;
  /** The page's default language; a page with a language switch reports changes with usePublicPageLocale. */
  locale: "ar" | "en";
  pageId?: string;
  workspaceId?: string;
  /** The badge's version: auto follows the page. */
  theme?: "light" | "dark" | "auto";
  children: ReactNode;
};


/**
 * The frame of every logged-out public page: forms, shared analyses, share
 * links, brand guide sites, and any public page added later. It renders the
 * "Made with Markyos" badge only when the server says so (`showBadge`, from
 * the backend's check on the page owner's plan) and keeps room for it at the
 * bottom so it never covers the page; with a fixed bottom bar marked
 * `data-fixed-bottom`, the badge sits 8px above it.
 *
 * Nothing on the client can switch the badge off: a paid page simply never
 * receives it.
 */
const PublicPageShell = ({ showBadge, pageType = "other", locale, pageId = "", workspaceId = "", theme = "auto", children }: PublicPageShellProps) => (
  <BadgeFrame showBadge={showBadge} pageType={pageType} locale={locale} pageId={pageId} workspaceId={workspaceId} theme={theme} signupBase="/signup" websiteBase={MARKETING_URL}>
    {children}
  </BadgeFrame>
);

export { PublicPageShell };
export type { PublicPageShellProps };
