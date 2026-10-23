"use client";

import { Icon, LangToggle } from "@/components/ui";
import { AccountMenu } from "@/components/features/account";
import { ThemeToggle } from "@/contexts/ThemeProvider";
import { useApp } from "@/contexts/AppContext";
import { Workspace } from "@/types";
import { ReactNode, useEffect, useRef, useState } from "react";

export interface TopBarTab {
  key: string;
  label: string;
  arLabel: string;
  active: boolean;
  onSelect: () => void;
  /**
   * True when this section has nothing in it yet.
   *
   * Marked rather than left to be discovered. Eight identical pills say nothing
   * about where the work is, so finding the two unfinished sections of Strategy
   * means opening all eight and remembering which were bare — recall, where
   * recognition would do. It marks the *empty* ones rather than the full ones
   * so that a finished section carries no mark at all: the row is quiet when
   * there is nothing to say, and every dot is a thing to do.
   */
  empty?: boolean;
}

export function TopBar({
  workspace,
  section,
  arSection,
  right,
  tabs,
  tabsRight,
}: {
  workspace: Workspace;
  section: string;
  arSection?: string;
  right?: ReactNode;
  /** A second pill-button row for navigating within this page — the "top bar to navigate to each part inside it" used by Visual identity, Strategy, and Company departments. */
  tabs?: TopBarTab[];
  tabsRight?: ReactNode;
}) {
  const { setAdminLang, uiLang } = useApp();
  const isAr = uiLang(workspace) === "ar";

  /*
   * The tab row scrolls, so two things have to be true that were not.
   *
   * It has to **follow the selection.** Strategy's foot offers the next section
   * by name, and eight sections do not fit across a laptop — so pressing
   * "Next: Personality & tone" switched to a tab that stayed off the end of the
   * row, and the row you navigate by no longer showed where you were.
   *
   * And it has to **say that it scrolls.** A row cut off flush at the window
   * edge looks like a row that ends there. The fade is measured rather than
   * assumed, so a row that fits carries no hint of content that is not there.
   */
  const railRef = useRef<HTMLDivElement | null>(null);
  const [overflow, setOverflow] = useState<{ start: boolean; end: boolean }>({ start: false, end: false });

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const read = () => {
      // `scrollLeft` is negative in an RTL container in Chromium, so the two
      // ends are measured by distance rather than by sign.
      const pos = Math.abs(rail.scrollLeft);
      const max = rail.scrollWidth - rail.clientWidth;
      setOverflow({ start: pos > 2, end: max - pos > 2 });
    };
    read();
    rail.addEventListener("scroll", read, { passive: true });
    const observer = new ResizeObserver(read);
    observer.observe(rail);
    return () => {
      rail.removeEventListener("scroll", read);
      observer.disconnect();
    };
  }, [tabs]);

  const activeKey = tabs?.find((t) => t.active)?.key;
  useEffect(() => {
    const rail = railRef.current;
    if (!rail || !activeKey) return;
    const el = rail.querySelector<HTMLElement>(`[data-tab-key="${CSS.escape(activeKey)}"]`);
    el?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
  }, [activeKey]);

  return (
    <div className="shrink-0 flex flex-col" style={{ boxShadow: "inset 0 -1px 0 var(--hairline)" }}>
      <div className="h-16 shrink-0 flex items-center justify-between px-7">
        <div
          className="flex items-center gap-2 text-[13px]"
          style={{ color: "var(--text-muted)", fontFamily: isAr ? "var(--font-arabic)" : undefined }}
        >
          {isAr ? "دليل الهوية" : "Brand book"}
          <Icon name={isAr ? "angle-left" : "angle-right"} size={14} />
          <span className="text-text font-medium">{isAr && arSection ? arSection : section}</span>
        </div>
        <div className="flex items-center gap-3.5">
          {right}
          <ThemeToggle isAr={isAr} />
          {/* Named for what it is here. The builder screen carries three of
              these: this one, the canvas's own preview switch, and the one
              belonging to the page inside the canvas. Defaulting all three to
              "Preview language" made them indistinguishable. */}
          {/* This control already said "Interface language", and now it is
              one: it sets the reader's own preference instead of the brand's
              locale. Before the split it wrote `workspace.lang`, so changing
              the language you read the app in also changed what the client saw
              at /v/<slug> and which half of every bilingual field counted as
              authoritative. The brand's own language moved to the preview
              control on Overview. */}
          <LangToggle
            value={uiLang(workspace)}
            onChange={(lang) => setAdminLang(lang)}
            label={isAr ? "لغة الواجهة" : "Interface language"}
            scope="chrome"
          />
          <AccountMenu isAr={isAr} />
        </div>
      </div>
      {tabs && tabs.length > 0 && (
        <div
          ref={railRef}
          className="flex items-center gap-1.5 px-7 pb-3 overflow-x-auto"
          style={{
            boxShadow: "inset 0 -1px 0 var(--hairline)",
            // Fades only the ends that have something past them. Physical
            // left/right because a mask is geometry, not text — the two flags
            // are already worked out in reading order above.
            maskImage:
              overflow.start || overflow.end
                ? `linear-gradient(to right, ${
                    (isAr ? overflow.end : overflow.start) ? "transparent" : "#000"
                  } 0, #000 28px, #000 calc(100% - 28px), ${
                    (isAr ? overflow.start : overflow.end) ? "transparent" : "#000"
                  } 100%)`
                : undefined,
          }}
        >
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              data-tab-key={t.key}
              onClick={t.onSelect}
              aria-pressed={t.active}
              className="h-8 px-3.5 rounded-full text-[12.5px] font-medium cursor-pointer whitespace-nowrap shrink-0 transition-colors flex items-center gap-2"
              style={{
                background: t.active ? "var(--surface-2)" : "transparent",
                color: t.active ? "var(--text)" : "var(--text-muted)",
                fontFamily: isAr ? "var(--font-arabic)" : undefined,
              }}
            >
              {isAr ? t.arLabel : t.label}
              {t.empty && (
                <span
                  // A hollow ring, not a filled dot: this is "nothing here
                  // yet", which is a note rather than a warning.
                  title={isAr ? "لا يوجد محتوى بعد" : "Nothing here yet"}
                  aria-label={isAr ? "لا يوجد محتوى بعد" : "Nothing here yet"}
                  role="img"
                  className="w-[6px] h-[6px] rounded-full shrink-0"
                  style={{ boxShadow: "inset 0 0 0 1.5px var(--text-faint)" }}
                />
              )}
            </button>
          ))}
          {tabsRight && <span className="ms-auto shrink-0">{tabsRight}</span>}
        </div>
      )}
    </div>
  );
}
