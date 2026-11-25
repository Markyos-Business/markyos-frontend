"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BrandMark, Icon, LangToggle } from "@/components/ui";
import type { TemplateProps } from "../../types";
import { navLogo } from "../../utils/brand-logo";

/**
 * The contents, as a menu button — for when a template's own navigation (a
 * sidebar, a rail, a row of chips) no longer fits.
 *
 * Every template folded its navigation away below a breakpoint and most put
 * nothing in its place: Docs and Atlas lost the contents, the language switch
 * and the download button together on a phone (review, 25 Nov 2026). This is
 * the one replacement they share. It is a disclosure, not a modal: a 44px
 * button and a panel under it, closed by choosing a section, by Escape or by a
 * click elsewhere.
 *
 * The template decides *when* it shows (a container-query class on the
 * wrapper it passes), because each one collapses at its own width.
 */
export function SiteMenu({
  ws,
  isAr,
  sections,
  activeId,
  scrollTo,
  pages,
  activePage,
  className = "",
  onDownload,
}: Pick<TemplateProps, "ws" | "isAr" | "sections" | "activeId" | "scrollTo" | "pages" | "activePage"> & {
  className?: string;
  /** Offered at the end of the menu when the template's own button is hidden. */
  onDownload?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onPointer(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  if (sections.length === 0 && pages.length === 0 && !activePage && !onDownload) return null;

  const row = "flex items-center gap-3 min-h-11 px-3.5 text-[14px] text-start cursor-pointer";
  const label = isAr ? "المحتويات" : "Contents";

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-label={label}
        aria-expanded={open}
        className="w-11 h-11 grid place-items-center cursor-pointer shrink-0"
        style={{ borderRadius: "var(--g-radius-pill)", background: "var(--g-surface-1)", color: "var(--g-text)" }}
      >
        <Icon name={open ? "times" : "bars"} size={18} />
      </button>

      {open && (
        <nav
          aria-label={label}
          className="absolute top-[52px] p-2 flex flex-col gap-0.5 z-dropdown overflow-y-auto"
          style={{
            insetInlineEnd: 0,
            width: "min(300px, calc(100cqi - 32px))",
            maxHeight: "min(70vh, 560px)",
            borderRadius: "var(--g-radius-lg)",
            background: "var(--g-surface-1)",
            color: "var(--g-text)",
            boxShadow: "inset 0 0 0 1px var(--g-hairline), 0 12px 40px rgba(0,0,0,.35)",
          }}
        >
          {activePage && (
            <Link href={`/v/${ws.slug}`} onClick={() => setOpen(false)} className={row} style={{ borderRadius: "var(--g-radius-md)", color: "var(--g-text-muted)" }}>
              {isAr ? "الرئيسية" : "Home"}
            </Link>
          )}
          {sections.map((s, i) => {
            const active = activeId === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  scrollTo(s.id);
                  setOpen(false);
                }}
                aria-current={active ? "location" : undefined}
                className={row}
                style={{
                  borderRadius: "var(--g-radius-md)",
                  background: active ? "var(--g-surface-2)" : "transparent",
                  color: active ? "var(--g-text)" : "var(--g-text-muted)",
                  fontWeight: active ? 600 : 400,
                }}
              >
                <span className="shrink-0 text-[11px]" style={{ fontFamily: "ui-monospace, Menlo, monospace", color: active ? "var(--g-accent)" : "var(--g-text-faint)" }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0 truncate">{isAr ? s.arLabel : s.label}</span>
              </button>
            );
          })}
          {pages.map((p) => (
            <Link
              key={p.id}
              href={`/v/${ws.slug}/p/${p.slug}`}
              onClick={() => setOpen(false)}
              className={row}
              style={{
                borderRadius: "var(--g-radius-md)",
                color: activePage?.id === p.id ? "var(--g-text)" : "var(--g-text-muted)",
                background: activePage?.id === p.id ? "var(--g-surface-2)" : "transparent",
              }}
            >
              <span className="min-w-0 truncate">{isAr ? p.arName : p.name}</span>
            </Link>
          ))}
          {onDownload && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                onDownload();
              }}
              className={`${row} mt-1 justify-center font-semibold`}
              style={{ borderRadius: "var(--g-radius-pill)", background: "var(--g-accent)", color: "var(--g-accent-ink)" }}
            >
              <Icon name="download" size={16} />
              {isAr ? "تحميل الأصول" : "Download assets"}
            </button>
          )}
        </nav>
      )}
    </div>
  );
}

/**
 * The bar a sidebar template becomes on a narrow page: the brand's logo (and
 * name, unless the logo is a lockup that already says it), the language
 * switch, and the contents menu — everything the sidebar carried, in one row.
 *
 * Docs and Atlas hid their 280–300px sidebar below 768px and put nothing in its
 * place, so a phone got no logo, no language switch and no way to jump to a
 * section. The template mounts this inside its content column with a class
 * that hides it where the sidebar shows; the template root is the container
 * those classes measure.
 */
export function CompactBar({
  className = "",
  onDark,
  onDownload,
  ...menu
}: Pick<TemplateProps, "ws" | "isAr" | "sections" | "activeId" | "scrollTo" | "pages" | "activePage" | "previewLang" | "setPreviewLang"> & {
  className?: string;
  onDark: boolean;
  onDownload?: () => void;
}) {
  const { ws, isAr, previewLang, setPreviewLang } = menu;
  const logo = navLogo(ws, isAr);
  return (
    <div
      className={`sticky top-0 z-sticky h-16 shrink-0 flex items-center gap-3 px-5 ${className}`}
      style={{ background: "var(--g-canvas)", boxShadow: "inset 0 -1px 0 var(--g-hairline)" }}
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        {logo.isLockup ? (
          <BrandMark src={logo.src} lightSrc={logo.lightSrc} alt={ws.name} onDark={onDark} style={{ height: 26, width: "auto", maxWidth: "100%" }} />
        ) : (
          <>
            {logo.src && <BrandMark src={logo.src} lightSrc={logo.lightSrc} alt={ws.name} onDark={onDark} style={{ width: 26, height: 26, flexShrink: 0 }} />}
            <span className="font-semibold text-[15px] truncate" style={{ fontFamily: "var(--font-display)" }}>
              {ws.name}
            </span>
          </>
        )}
      </div>
      <LangToggle value={previewLang} onChange={setPreviewLang} />
      <SiteMenu {...menu} onDownload={onDownload} />
    </div>
  );
}
