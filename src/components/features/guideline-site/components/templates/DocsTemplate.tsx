"use client";

import { Fragment, ReactNode } from "react";
import Link from "next/link";
import { LangToggle, PillButton, Icon } from "@/components/ui";
import { BrandMark } from "@/components/ui/media";
import { navLogo } from "@/components/features/guideline-site/model/brandLogo";
import { DownloadPanel } from "@/components/features/guideline-site/components/documents/DownloadPanel";
import { BlockRenderer } from "@/components/features/guideline-site/components/BlockRenderer";
import { FlowShell, InsertPoint, SectionHeading, SectionNote, SectionNoteProvider } from "@/components/features/guideline-site/components/LiveEdit";
import { ColorGrid, FixedSectionBody, SignOffPanel, StatementBand } from "@/components/features/guideline-site/components/Content";
import { flowLabel, SectionTitles } from "@/components/features/guideline-site/components/flowHelpers";
import { themeCssVars } from "@/components/features/guideline-site/model/theme";
import { gBody, gHero, gLabel, gSectionTitle } from "@/components/features/guideline-site/components/surface";
import { formatRelative } from "@/lib/utils";
import { TemplateProps } from "../types";

/** Docs' own wording for the derived sections, until a studio renames one. */
const TITLES: SectionTitles = {
  overview: ["Overview", "نظرة عامة"],
  statement: ["Statement", "العبارة"],
  strategy: ["Strategy", "الاستراتيجية"],
  logo: ["Logo", "الشعار"],
  misuse: ["Incorrect use", "الاستخدام الخاطئ"],
  "app-icon": ["App icon & favicon", "أيقونة التطبيق والمفضلة"],
  color: ["Color", "الألوان"],
  typography: ["Typography", "الخطوط"],
  mockups: ["In use", "التطبيقات"],
  photography: ["Photography", "التصوير"],
  patterns: ["Pattern", "النقوش"],
  icons: ["Icons", "الأيقونات"],
  social: ["Social media", "وسائل التواصل"],
  personas: ["Personas", "الشخصيات"],
  voice: ["Voice", "الصوت"],
  departments: ["Departments", "أقسام الشركة"],
};

export function DocsTemplate(props: TemplateProps) {
  const {
    ws,
    isAr,
    theme,
    sections,
    activeId,
    scrollTo,
    sectionIndex,
    sectionTitle,
    sectionNote,
    flow,
    statementText,
    attachedSlots,
    photoAssets,
    iconAssets,
    mockupAssets,
    publishedDepartments,
    downloadOpen,
    setDownloadOpen,
    previewLang,
    setPreviewLang,
    showMarkyosBadge,
    pages,
    activePage,
  } = props;

  // The band sits on the accent, so its ink is solved against the accent —
  // not against the page mode, which is what it used to ask and which put
  // white type on any brand whose primary is a pale one.
  const bandText = "var(--g-accent-ink)";
  const logo = navLogo(ws, isAr);
  const fixedCtx = { ws, isAr, onDark: !theme.isLight, attachedSlots, photoAssets, iconAssets, mockupAssets, publishedDepartments };
  const heroTitle = sectionTitle(
    "overview-title",
    ws.strategy.purpose || (isAr ? "دليل الهوية البصرية" : "Brand guideline")
  );

  /**
   * Docs is a reference site rather than a scroller, so its colour section
   * spells out that the swatches are copyable — a line the poster-style
   * templates deliberately leave off. It's the one body that differs.
   */
  const bodyOverrides = {
    color: (
      <>
        <ColorGrid ws={ws} isAr={isAr} />
        <p className="text-[12px]" style={{ color: "var(--g-text-faint)" }}>
          {isAr ? "اضغط على أي لون لنسخ قيمته." : "Click any swatch to copy its hex value."}
        </p>
        <SignOffPanel ws={ws} section="color" isAr={isAr} />
      </>
    ),
  };

  return (
    <SectionNoteProvider lookup={sectionNote}>
    <div
      dir={isAr ? "rtl" : "ltr"}
      className="min-h-screen flex"
      data-guideline-surface=""
      style={{ ...themeCssVars(theme), background: "var(--g-canvas)", color: "var(--g-text)", fontFamily: isAr ? "var(--font-arabic)" : "var(--font-sans)" }}
    >
      <div
        className="w-[280px] shrink-0 hidden md:flex flex-col gap-6 h-screen sticky top-0 overflow-y-auto px-6 py-8"
        style={{ boxShadow: isAr ? "inset -1px 0 0 var(--g-hairline)" : "inset 1px 0 0 var(--g-hairline)" }}
      >
        {logo.isLockup ? (
          <BrandMark
            src={logo.src}
            lightSrc={logo.lightSrc}
            alt={ws.name}
            onDark={!theme.isLight}
            /*
             * `height` + `width: auto`, not `maxHeight` alone.
             *
             * This sidebar is a flex column, so its items stretch across the
             * cross axis — the width. An <img> whose width is `auto` stretches
             * with them, and `maxHeight` only clipped how tall it got, so the
             * lockup rendered squashed to 34px tall and 232px wide. Pinning the
             * height and letting the width follow the aspect ratio is what
             * "34px tall" was always meant to say.
             */
            style={{ height: 34, width: "auto", maxWidth: "100%", alignSelf: "flex-start" }}
          />
        ) : (
          <div className="flex items-center gap-2.5 font-semibold text-[16px]" style={{ fontFamily: "var(--font-display)" }}>
            {logo.src && (
              <BrandMark
                src={logo.src}
                lightSrc={logo.lightSrc}
                alt={ws.name}
                onDark={!theme.isLight}
                style={{ maxWidth: 26, maxHeight: 26, flexShrink: 0 }}
              />
            )}
            <span className="truncate">{ws.name}</span>
            <span className="text-[11px] font-normal shrink-0" style={{ color: "var(--g-text-faint)" }}>©</span>
          </div>
        )}
        <div className="flex flex-col gap-0.5" style={{ ...gLabel, color: "var(--g-text-faint)" }}>
          <span>{isAr ? "دليل الهوية البصرية" : "Visual identity guidelines"}</span>
          <span>{isAr ? `آخر تحديث: ${formatRelative(ws.updatedAt)}` : `Updated: ${formatRelative(ws.updatedAt)}`}</span>
        </div>

        <nav className="flex flex-col gap-0.5">
          {sections.map((s, i) => {
            const active = activeId === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => scrollTo(s.id)}
                className="flex items-center gap-2.5 text-start px-2.5 py-2 text-[13px] cursor-pointer transition-colors"
                style={{ borderRadius: "var(--g-radius-md)", color: active ? "var(--g-text)" : "var(--g-text-faint)", fontWeight: active ? 600 : 400, background: active ? "var(--g-surface-1)" : "transparent" }}
              >
                <span className="shrink-0" style={{ fontFamily: "ui-monospace, Menlo, monospace", fontSize: 10, color: active ? "var(--g-accent)" : "var(--g-text-faint)" }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="truncate">{isAr ? s.arLabel : s.label}</span>
              </button>
            );
          })}
        </nav>

        {(pages.length > 0 || activePage) && (
          <nav className="flex flex-col gap-0.5 pt-3" style={{ boxShadow: "inset 0 1px 0 var(--g-hairline)" }}>
            <div className="px-2.5 pt-3 pb-1.5" style={{ ...gLabel, color: "var(--g-text-faint)" }}>
              {isAr ? "الصفحات" : "Pages"}
            </div>
            {activePage && (
              <Link
                href={`/v/${ws.slug}`}
                className="flex items-center gap-2.5 text-start px-2.5 py-2 text-[13px] cursor-pointer transition-colors"
                style={{ borderRadius: "var(--g-radius-md)", color: "var(--g-text-faint)" }}
              >
                {isAr ? "الرئيسية" : "Home"}
              </Link>
            )}
            {pages.map((p) => {
              const active = activePage?.id === p.id;
              return (
                <Link
                  key={p.id}
                  href={`/v/${ws.slug}/p/${p.slug}`}
                  className="flex items-center gap-2.5 text-start px-2.5 py-2 text-[13px] cursor-pointer transition-colors"
                  style={{ borderRadius: "var(--g-radius-md)", color: active ? "var(--g-text)" : "var(--g-text-faint)", fontWeight: active ? 600 : 400, background: active ? "var(--g-surface-1)" : "transparent" }}
                >
                  {isAr ? p.arName : p.name}
                </Link>
              );
            })}
          </nav>
        )}

        <div className="mt-auto flex flex-col gap-3">
          <LangToggle value={previewLang} onChange={setPreviewLang} size="sm" />
          {attachedSlots.length > 0 && (
            <PillButton variant="outline" size="sm" onClick={() => setDownloadOpen(true)} className="w-full">
              {/* An Icon, not a "↗" character: the guideline site ships with an
                  offline icon set and no webfont, so a Unicode arrow that the
                  system font happens not to carry renders as a tofu box on a
                  page the client is being handed. */}
              {isAr ? "تحميل الأصول" : "Download assets"}
              <Icon name="external-link-alt" size={11} style={{ marginInlineStart: 6 }} />
            </PillButton>
          )}
        </div>
      </div>

      <div className="flex-1 min-w-0 flex flex-col">
        {activePage && (
          <div className="px-8 md:px-16 py-14 max-w-[900px]">
            <h1 dir="auto" className="bidi-auto" style={gHero}>
              {isAr ? activePage.arName : activePage.name}
            </h1>
          </div>
        )}

        <div className="flex flex-col pb-[40vh]">
          {flow.map((item, i) => {
            const label = flowLabel(item, sectionTitle, TITLES, isAr, i);
            return (
              <Fragment key={item.id}>
                <FlowShell flowId={item.id} kind={item.kind} label={label} style={item.style} accent={theme.accent}>
                  {item.id === "overview" ? (
                    <div id="overview" className="px-8 md:px-16 py-14 flex flex-col gap-6 scroll-mt-0 max-w-[900px]">
                      <SectionHeading
                        sectionId="overview-eyebrow"
                        as="span"
                        value={sectionTitle("overview-eyebrow", ws.name)}
                        style={{ ...gLabel, color: "var(--g-text-faint)" }}
                      />
                      <SectionHeading
                        sectionId="overview-title"
                        value={heroTitle}
                        className="bidi-auto -mt-3"
                        style={gHero}
                      />
                      <SectionNote
                        sectionId="overview"
                        placeholder={isAr ? "أضف سطرًا تمهيديًا" : "Add an opening line"}
                        style={gBody}
                      />
                      {ws.overviewHtml && <div dir="auto" className="bidi-auto docs-overview" dangerouslySetInnerHTML={{ __html: ws.overviewHtml }} />}
                      <SignOffPanel ws={ws} section="overview" isAr={isAr} />
                    </div>
                  ) : item.id === "statement" ? (
                    <StatementBand
                      text={statementText}
                      isAr={isAr}
                      className="px-8 md:px-16 py-12"
                      style={{ background: "var(--g-accent)" }}
                      textClassName="bidi-auto max-w-[900px] text-[22px] md:text-[26px] font-semibold leading-[1.4]"
                      textStyle={{ fontFamily: "var(--font-display)", color: bandText }}
                      noteStyle={{ color: bandText, opacity: 0.75 }}
                    />
                  ) : item.kind === "block" && item.block.kind === "divider" ? (
                    <div className="px-8 md:px-16">
                      <BlockRenderer block={item.block} ws={ws} isAr={isAr} />
                    </div>
                  ) : (
                    <Band id={item.id} index={sectionIndex(item.id)} title={label} bandText={bandText}>
                      {item.kind === "block" ? (
                        <BlockRenderer block={item.block} ws={ws} isAr={isAr} />
                      ) : (
                        <FixedSectionBody id={item.id} ctx={fixedCtx} overrides={bodyOverrides} />
                      )}
                    </Band>
                  )}
                </FlowShell>
                <div className="px-8 md:px-16">
                  <InsertPoint afterId={item.id} isAr={isAr} after={label} />
                </div>
              </Fragment>
            );
          })}
        </div>

        {showMarkyosBadge && (
          <div className="pb-6 pt-2 flex justify-center">
            <span className="text-[11px]" style={{ color: "var(--g-text-faint)" }}>{isAr ? "دليل الهوية مقدَّم عبر ماركيوس" : "Guideline delivered with Markyos"}</span>
          </div>
        )}
      </div>

      {downloadOpen && <DownloadPanel workspace={ws} onClose={() => setDownloadOpen(false)} />}

      <style jsx global>{`
        .docs-overview h2 { margin: 0 0 14px; font-family: var(--font-display); font-size: var(--g-section-size); font-weight: var(--g-hero-weight); line-height: 1.2; }
        .docs-overview p { margin: 0 0 16px; font-size: var(--g-body-size); line-height: var(--g-lead); color: var(--g-text-muted); }
        .docs-overview blockquote { margin: 0 0 16px; padding: 16px 20px; border-inline-start: 2px solid var(--g-accent); background: var(--g-surface-1); border-radius: 0 var(--g-radius-md) var(--g-radius-md) 0; }
      `}</style>
    </div>
    </SectionNoteProvider>
  );
}

function Band({
  id,
  index,
  title,
  bandText,
  children,
}: {
  id: string;
  index: number;
  title: string;
  bandText: string;
  children: ReactNode;
}) {
  return (
    <div id={id} className="scroll-mt-0 flex flex-col">
      {/* Full-bleed band, content on the body's own measure — a chapter number
          pinned to the far edge of a wide screen stops reading as part of the
          heading it numbers. */}
      <div className="px-8 md:px-16 py-8" style={{ background: "var(--g-accent)" }}>
        <div className="max-w-[900px] flex items-baseline justify-between gap-6">
          <SectionHeading
            sectionId={id}
            value={title}
            style={{ ...gSectionTitle, color: bandText }}
          />
          <span className="font-semibold opacity-50 shrink-0" style={{ fontFamily: "var(--font-display)", fontSize: "var(--g-hero-size)", color: bandText }}>
            {String(index).padStart(2, "0")}
          </span>
        </div>
      </div>
      <div className="px-8 md:px-16 py-10 flex flex-col gap-5 max-w-[900px]">
        <SectionNote sectionId={id} style={gBody} />
        {children}
      </div>
    </div>
  );
}

DocsTemplate.displayName = "DocsTemplate";
