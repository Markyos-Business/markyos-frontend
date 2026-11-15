"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { MadeWithBadge } from "../made-with-badge/made-with-badge";
import { sendBadgeEvent, type BadgePageType } from "../made-with-badge/badge-events";

type Locale = "ar" | "en";

/** A page with a language switch tells the badge which language the visitor chose. */
const PageLocaleContext = createContext<((locale: Locale) => void) | null>(null);

/**
 * For a public page with its own language switch: the badge follows the
 * language the visitor is reading. A no-op outside PublicPageShell.
 */
function usePublicPageLocale(locale: Locale) {
  const set = useContext(PageLocaleContext);
  useEffect(() => {
    set?.(locale);
  }, [set, locale]);
}

/** The tallest visible fixed bottom bar on the page (a submit bar, a chat widget). */
function fixedBottomHeight() {
  let height = 0;
  for (const el of document.querySelectorAll<HTMLElement>("[data-fixed-bottom]")) {
    const box = el.getBoundingClientRect();
    if (box.height && box.bottom >= window.innerHeight - 1) height = Math.max(height, box.height);
  }
  return height;
}

type BadgeFrameProps = {
  showBadge: boolean;
  pageType: BadgePageType;
  locale: Locale;
  pageId: string;
  workspaceId: string;
  theme: "light" | "dark" | "auto";
  signupBase: string;
  websiteBase: string;
  children: ReactNode;
};

/** The client half of PublicPageShell: reserved space, fixed-bar offset, language and events. */
const BadgeFrame = ({ showBadge, pageType, locale: pageLocale, pageId, workspaceId, theme, signupBase, websiteBase, children }: BadgeFrameProps) => {
  const [chosen, setChosen] = useState<Locale | null>(null);
  const [offset, setOffset] = useState(0);
  const locale = chosen ?? pageLocale;

  // Sit 8px above the page's own fixed bottom bar, following its height.
  useEffect(() => {
    if (!showBadge) return;
    const measure = () => {
      const h = fixedBottomHeight();
      setOffset(h ? h + 8 : 0);
    };
    measure();
    const resize = new ResizeObserver(measure);
    resize.observe(document.body);
    const mutate = new MutationObserver(measure);
    mutate.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-fixed-bottom", "hidden", "style", "class"] });
    window.addEventListener("resize", measure);
    return () => {
      resize.disconnect();
      mutate.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [showBadge]);

  const query = `ref=badge&type=${pageType}`;
  return (
    <PageLocaleContext.Provider value={setChosen}>
      <div
        // Space for the badge (its height plus spacing, plus any fixed bar), so the last content scrolls clear of it.
        className={showBadge ? "pb-[calc(var(--mk-badge-reserve-offset)+56px)] max-sm:pb-[calc(var(--mk-badge-reserve-offset)+48px)]" : undefined}
        style={showBadge ? { ["--mk-badge-reserve-offset" as string]: `${offset}px` } : undefined}
      >
        {children}
      </div>
      {showBadge && (
        <MadeWithBadge
          locale={locale}
          pageType={pageType}
          theme={theme}
          bottomOffset={offset}
          signupUrl={`${signupBase}?lang=${locale}&${query}`}
          websiteUrl={`${websiteBase}/${locale}?${query}`}
          onEvent={(name, ctx) => sendBadgeEvent({ name, pageType, pageId, workspaceId, locale, theme: ctx.theme, device: ctx.device })}
        />
      )}
    </PageLocaleContext.Provider>
  );
};

export { BadgeFrame, usePublicPageLocale };
