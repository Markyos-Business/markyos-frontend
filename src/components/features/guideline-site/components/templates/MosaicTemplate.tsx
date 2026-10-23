"use client";

// "Mosaic" — a brand hub rather than a brand document.
//
// The other seven templates are things you read from the top: a scroll, a
// sidebar, a slide deck, a printed book. All of them answer "walk me through
// this brand". Mosaic answers the other question a client actually asks, which
// is "show me the brand" — so it opens on a bento of tiles that carries the
// mark, the palette, the type and the real counts in one screen, and then lays
// every section of the guideline into the same grid at full or half width
// instead of stacking them into a column.
//
// Nothing here is a fixed colour. The tiles take the page's own surface, the
// numbering chips and the opening tile take the brand's accent with the ink
// solved against it, and the ground polarity, corner radius and type scale all
// come from the Mosaic design system in lib/designSystem.ts — so the same
// layout arrives warm and gold for one brand and cool and teal for the next.

import { Fragment, ReactNode } from "react";
import Link from "next/link";
import { Icon, LangToggle } from "@/components/ui";
import { DownloadPanel } from "@/components/features/guideline-site/components/documents/DownloadPanel";
import { BlockRenderer } from "@/components/features/guideline-site/components/BlockRenderer";
import { BrandMark } from "@/components/ui/media/BrandMark/BrandMark";
import { navLogo, navMark } from "@/components/features/guideline-site/model/brandLogo";
import { FlowShell, InsertPoint, SectionHeading, SectionNote, SectionNoteProvider } from "@/components/features/guideline-site/components/LiveEdit";
import { FixedSectionBody, SignOffPanel, StatementBand } from "@/components/features/guideline-site/components/Content";
import { flowLabel, SectionTitles } from "@/components/features/guideline-site/components/flowHelpers";
import { themeCssVars } from "@/components/features/guideline-site/model/theme";
import { bestInkOn } from "@/lib/contrast";
import { gBody, gCard, gHero, gLabel, gPill, gPlate, gSectionTitle } from "@/components/features/guideline-site/components/surface";
import { TemplateProps } from "../types";

/** Mosaic's own wording for the derived sections, until a studio renames one. */
const TITLES: SectionTitles = {
  overview: ["Overview", "نظرة عامة"],
  statement: ["Statement", "العبارة"],
  strategy: ["Strategy", "الاستراتيجية"],
  logo: ["Logo", "الشعار"],
  misuse: ["Misuse", "استخدامات خاطئة"],
  "app-icon": ["App icon", "أيقونة التطبيق"],
  color: ["Palette", "لوحة الألوان"],
  typography: ["Type", "الخطوط"],
  mockups: ["In use", "التطبيقات"],
  photography: ["Photography", "التصوير"],
  patterns: ["Pattern", "النقوش"],
  icons: ["Icons", "الأيقونات"],
  social: ["Social", "التواصل"],
  personas: ["Personas", "الشخصيات"],
  voice: ["Voice", "الصوت"],
  departments: ["Departments", "أقسام الشركة"],
};

/**
 * Which sections are laid at half width.
 *
 * Only the ones whose content is itself a grid of small tiles — those read
 * better two-up and are what gives the page its mosaic. Anything holding a
 * column of running text (strategy, departments, the voice matrix) or a wide
 * comparison (the palette, the type specimen) keeps the full twelve, because a
 * measure of forty characters is not a design choice, it is a mistake.
 */
const HALF_WIDTH = new Set(["photography", "patterns", "icons", "app-icon", "social"]);

function spanOf(id: string): string {
  return HALF_WIDTH.has(id) ? "lg:col-span-6" : "lg:col-span-12";
}

export function MosaicTemplate(props: TemplateProps) {
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

  const mark = navMark(ws);
  const logo = navLogo(ws, isAr);
  const fixedCtx = { ws, isAr, onDark: !theme.isLight, attachedSlots, photoAssets, iconAssets, mockupAssets, publishedDepartments };
  const heroTitle = sectionTitle(
    "overview-title",
    ws.strategy.purpose || (isAr ? "دليل الهوية البصرية" : "Brand guideline")
  );

  return (
    <SectionNoteProvider lookup={sectionNote}>
    <div
      dir={isAr ? "rtl" : "ltr"}
      className="min-h-screen flex flex-col"
      data-guideline-surface=""
      style={{ ...themeCssVars(theme), background: "var(--g-canvas)", color: "var(--g-text)", fontFamily: isAr ? "var(--font-arabic)" : "var(--font-sans)" }}
    >
      {/* One bar, and the download lives in it. A floating pill over a grid of
          tiles covers a tile; here there is a natural place to put it. */}
      <div
        className="sticky top-0 z-40 flex items-center gap-4 px-5 md:px-8 h-16 shrink-0"
        style={{ background: "var(--g-canvas)", boxShadow: "inset 0 -1px 0 var(--g-hairline)" }}
      >
        <div className="flex items-center gap-2.5 shrink-0 min-w-0">
          {logo.isLockup ? (
            <BrandMark src={logo.src} lightSrc={logo.lightSrc} alt={ws.name} onDark={!theme.isLight} style={{ maxHeight: 26, maxWidth: 180 }} />
          ) : (
            <>
              <span className="w-8 h-8 grid place-items-center font-semibold text-[13px] overflow-hidden shrink-0" style={{ ...gPill, background: "var(--g-accent)", color: "var(--g-accent-ink)" }}>
                {logo.src ? (
                  <BrandMark src={logo.src} lightSrc={logo.lightSrc} alt={ws.name} onDark={!theme.isLight} style={{ maxWidth: 18, maxHeight: 18 }} />
                ) : (
                  ws.initials
                )}
              </span>
              <span className="font-semibold text-[15px] truncate" style={{ fontFamily: "var(--font-display)" }}>{ws.name}</span>
            </>
          )}
        </div>

        {/* The contents as a scrollable row of chips — a hub's nav, not a
            document's table of contents down the side. */}
        <nav className="hidden md:flex items-center gap-1.5 flex-1 min-w-0 overflow-x-auto mk-chiprow">
          {activePage && (
            <Link
              href={`/v/${ws.slug}`}
              className="h-8 px-3.5 text-[12.5px] font-medium cursor-pointer whitespace-nowrap flex items-center shrink-0"
              style={{ ...gPill, background: "var(--g-surface-1)", color: "var(--g-text-faint)" }}
            >
              {isAr ? "الرئيسية" : "Home"}
            </Link>
          )}
          {sections.map((s) => {
            const active = activeId === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => scrollTo(s.id)}
                className="h-8 px-3.5 text-[12.5px] font-medium cursor-pointer whitespace-nowrap shrink-0 transition-colors"
                style={{
                  ...gPill,
                  background: active ? "var(--g-accent)" : "var(--g-surface-1)",
                  color: active ? "var(--g-accent-ink)" : "var(--g-text-faint)",
                }}
              >
                {isAr ? s.arLabel : s.label}
              </button>
            );
          })}
          {pages.map((p) => (
            <Link
              key={p.id}
              href={`/v/${ws.slug}/p/${p.slug}`}
              className="h-8 px-3.5 text-[12.5px] font-medium cursor-pointer whitespace-nowrap flex items-center shrink-0"
              style={{
                ...gPill,
                background: activePage?.id === p.id ? "var(--g-accent)" : "var(--g-surface-1)",
                color: activePage?.id === p.id ? "var(--g-accent-ink)" : "var(--g-text-faint)",
              }}
            >
              {isAr ? p.arName : p.name}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2.5 shrink-0 ms-auto md:ms-0">
          <LangToggle value={previewLang} onChange={setPreviewLang} size="sm" />
          {attachedSlots.length > 0 && (
            <button
              type="button"
              onClick={() => setDownloadOpen(true)}
              className="h-9 px-4 text-[12.5px] font-semibold cursor-pointer flex items-center gap-2"
              style={{ ...gPill, background: "var(--g-accent)", color: "var(--g-accent-ink)" }}
            >
              <Icon name="download" size={13} />
              <span className="hidden sm:inline">{isAr ? "تحميل الأصول" : "Download"}</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 w-full max-w-[1240px] mx-auto px-5 md:px-8 py-6 md:py-8">
        {activePage && (
          <h1 dir="auto" className="bidi-auto mb-6" style={gHero}>
            {isAr ? activePage.arName : activePage.name}
          </h1>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start pb-24">
          {flow.map((item, i) => {
            const label = flowLabel(item, sectionTitle, TITLES, isAr, i);
            const isDivider = item.kind === "block" && item.block.kind === "divider";
            return (
              // The grid cell is this wrapper, not FlowShell: FlowShell renders
              // a wrapper of its own only while editing, so putting the span on
              // it would give the canvas a different layout from the published
              // page — the one thing this editor is built not to do.
              <div key={item.id} className={`min-w-0 ${isDivider ? "lg:col-span-12" : spanOf(item.id)}`}>
                <FlowShell flowId={item.id} kind={item.kind} label={label} style={item.style} accent={theme.accent}>
                  {item.id === "overview" ? (
                    <BentoHero
                      ws={ws}
                      isAr={isAr}
                      theme={theme}
                      sections={sections}
                      scrollTo={scrollTo}
                      markSrc={mark.src}
                      markLightSrc={mark.lightSrc}
                      heroTitle={heroTitle}
                      sectionTitle={sectionTitle}
                      attachedSlots={attachedSlots}
                    />
                  ) : item.id === "statement" ? (
                    <StatementBand
                      text={statementText}
                      isAr={isAr}
                      className="p-8 md:p-10"
                      style={{ background: "var(--g-accent)", borderRadius: "var(--g-radius-lg)" }}
                      textClassName="bidi-auto text-[24px] md:text-[32px] font-semibold leading-[1.3] max-w-[24ch]"
                      textStyle={{ fontFamily: "var(--font-display)", color: "var(--g-accent-ink)" }}
                      noteStyle={{ color: "var(--g-accent-ink)", opacity: 0.78 }}
                    />
                  ) : isDivider && item.kind === "block" ? (
                    <BlockRenderer block={item.block} ws={ws} isAr={isAr} />
                  ) : (
                    <Tile id={item.id} index={sectionIndex(item.id)} title={label}>
                      {item.kind === "block" ? (
                        <BlockRenderer block={item.block} ws={ws} isAr={isAr} />
                      ) : (
                        <FixedSectionBody id={item.id} ctx={fixedCtx} />
                      )}
                    </Tile>
                  )}
                </FlowShell>
                <InsertPoint afterId={item.id} isAr={isAr} after={label} />
              </div>
            );
          })}
        </div>
      </div>

      {showMarkyosBadge && (
        <div className="pb-6 pt-2 flex justify-center">
          <span className="text-[11px]" style={{ color: "var(--g-text-faint)" }}>{isAr ? "دليل الهوية مقدَّم عبر ماركيوس" : "Guideline delivered with Markyos"}</span>
        </div>
      )}

      {downloadOpen && <DownloadPanel workspace={ws} onClose={() => setDownloadOpen(false)} />}

      <style jsx global>{`
        .mk-chiprow { scrollbar-width: none; }
        .mk-chiprow::-webkit-scrollbar { display: none; }
        .mosaic-overview h2 { margin: 0 0 12px; font-family: var(--font-display); font-size: var(--g-section-size); font-weight: var(--g-hero-weight); letter-spacing: var(--g-hero-tracking); }
        .mosaic-overview p { margin: 0 0 14px; font-size: var(--g-body-size); line-height: var(--g-lead); color: var(--g-text-muted); }
        .mosaic-overview blockquote { margin: 0 0 14px; padding: 14px 18px; border-inline-start: 2px solid var(--g-accent); background: var(--g-surface-2); border-radius: 0 var(--g-radius-md) var(--g-radius-md) 0; font-size: var(--g-body-size); line-height: var(--g-lead); color: var(--g-text-muted); }
      `}</style>
    </div>
    </SectionNoteProvider>
  );
}

/**
 * One section, as a tile.
 *
 * The number is a filled accent chip rather than a rule or a small-caps
 * eyebrow — in a grid there is no continuous left margin to hang numbering off,
 * so it has to belong to the tile.
 */
function Tile({ id, index, title, children }: { id: string; index: number; title: string; children: ReactNode }) {
  return (
    <section id={id} className="p-5 md:p-7 flex flex-col gap-5 scroll-mt-20" style={gCard}>
      <div className="flex items-baseline gap-2.5 flex-wrap">
        <span
          className="px-2 py-1 shrink-0"
          style={{ ...gLabel, ...gPill, background: "var(--g-accent)", color: "var(--g-accent-ink)", fontFamily: "ui-monospace, Menlo, monospace" }}
        >
          {String(index).padStart(2, "0")}
        </span>
        <SectionHeading sectionId={id} value={title} className="bidi-auto" style={gSectionTitle} />
      </div>
      <SectionNote sectionId={id} className="max-w-[62ch] -mt-2" style={gBody} />
      {children}
    </section>
  );
}

/**
 * The opening bento: the whole identity in one screen.
 *
 * Every tile is a live view of workspace data, never a copy of it — the palette
 * strip is `ws.colors`, the specimen is whatever font is applied, the counts
 * are counts. The sections below still carry the full versions; this is the
 * glance, and a glance that goes stale is worse than no glance at all.
 */
function BentoHero({
  ws,
  isAr,
  theme,
  sections,
  scrollTo,
  markSrc,
  markLightSrc,
  heroTitle,
  sectionTitle,
  attachedSlots,
}: {
  ws: TemplateProps["ws"];
  isAr: boolean;
  theme: TemplateProps["theme"];
  sections: TemplateProps["sections"];
  scrollTo: TemplateProps["scrollTo"];
  markSrc?: string;
  markLightSrc?: string;
  heroTitle: string;
  sectionTitle: TemplateProps["sectionTitle"];
  attachedSlots: TemplateProps["attachedSlots"];
}) {
  const facts: { value: string; label: string; arLabel: string }[] = [
    { value: String(ws.colors.length), label: "colours", arLabel: "لونًا" },
    { value: String(attachedSlots.length), label: "lockups", arLabel: "نسخة شعار" },
    { value: String(ws.assets.length), label: "files", arLabel: "ملفًا" },
    { value: String(sections.length), label: "sections", arLabel: "قسمًا" },
  ];

  return (
    <div id="overview" className="grid grid-cols-2 lg:grid-cols-6 gap-4 scroll-mt-20">
      {/* The brand, filled with its own colour. */}
      <div className="col-span-2 lg:col-span-4 p-7 md:p-9 flex flex-col gap-4 min-h-[280px]" style={{ background: "var(--g-accent)", borderRadius: "var(--g-radius-lg)" }}>
        <div className="flex items-center gap-3">
          {markSrc && (
            <span className="w-11 h-11 grid place-items-center overflow-hidden shrink-0">
              {/* The ground is the accent fill, so the accent's own lightness
                  decides whether a mono mark reverses — not the page's. */}
              <BrandMark src={markSrc} lightSrc={markLightSrc} alt={ws.name} onDark={theme.accentInk === "#ffffff"} style={{ maxWidth: 40, maxHeight: 40 }} />
            </span>
          )}
          <SectionHeading
            sectionId="overview-eyebrow"
            as="span"
            value={sectionTitle("overview-eyebrow", ws.name)}
            style={{ ...gLabel, color: "var(--g-accent-ink)", opacity: 0.8 }}
          />
        </div>
        <SectionHeading
          sectionId="overview-title"
          value={heroTitle}
          className="bidi-auto mt-auto"
          style={{ ...gHero, color: "var(--g-accent-ink)" }}
        />
        <SectionNote
          sectionId="overview"
          placeholder={isAr ? "أضف سطرًا تمهيديًا" : "Add an opening line"}
          className="max-w-[52ch] text-[14.5px] leading-[1.6]"
          style={{ color: "var(--g-accent-ink)", opacity: 0.82 }}
        />
      </div>

      {/* The palette, as a stack you can read the names off. */}
      <div className="col-span-2 flex flex-col overflow-hidden min-h-[280px]" style={gPlate}>
        {ws.colors.length === 0 ? (
          <span className="m-auto text-[12px]" style={{ color: "var(--g-text-faint)" }}>
            {isAr ? "لا ألوان بعد" : "No colours yet"}
          </span>
        ) : (
          ws.colors.slice(0, 6).map((c) => (
            <div key={c.id} className="flex-1 flex items-center px-4 gap-2 min-h-[40px]" style={{ background: c.hex }}>
              <span
                className="text-[11px] font-semibold truncate"
                // Solved per swatch: a palette holds both #FFFFFF and #000000,
                // and one fixed label colour is unreadable on one of them.
                style={{ color: bestInk(c.hex) }}
              >
                {c.name}
              </span>
              <span dir="ltr" className="text-[10px] ms-auto shrink-0" style={{ fontFamily: "ui-monospace, Menlo, monospace", color: bestInk(c.hex), opacity: 0.75 }}>
                {c.hex.toUpperCase()}
              </span>
            </div>
          ))
        )}
      </div>

      {/* The type, at a size you can judge it at. */}
      <div className="col-span-1 lg:col-span-2 p-5 flex flex-col gap-2 justify-between min-h-[150px]" style={gPlate}>
        <span style={{ ...gLabel, color: "var(--g-text-faint)" }}>{isAr ? "الخطوط" : "Type"}</span>
        <span style={{ fontFamily: isAr ? "var(--font-arabic)" : "var(--font-sans)", fontSize: 52, lineHeight: 1, fontWeight: 600 }}>
          {isAr ? "أ ب" : "Aa"}
        </span>
        <span dir="auto" className="bidi-auto text-[11.5px] truncate" style={{ color: "var(--g-text-muted)" }}>
          {isAr ? ws.typography.arabicFamily : ws.typography.latinFamily}
        </span>
      </div>

      {/* Real counts off real data — nothing here is a marketing number. */}
      <div className="col-span-1 lg:col-span-2 p-5 grid grid-cols-2 gap-3 content-center min-h-[150px]" style={gPlate}>
        {facts.map((f) => (
          <div key={f.label} className="flex flex-col">
            <span className="text-[24px] font-semibold leading-none" style={{ fontFamily: "var(--font-display)", color: "var(--g-accent)" }}>
              {f.value}
            </span>
            <span className="text-[10.5px] mt-1" style={{ color: "var(--g-text-faint)" }}>{isAr ? f.arLabel : f.label}</span>
          </div>
        ))}
      </div>

      {/* The contents, as a jump list. */}
      <div className="col-span-2 p-5 flex flex-col gap-2 min-h-[150px]" style={gPlate}>
        <span style={{ ...gLabel, color: "var(--g-text-faint)" }}>{isAr ? "المحتويات" : "Contents"}</span>
        <div className="flex flex-wrap gap-1.5">
          {sections.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => scrollTo(s.id)}
              className="px-2.5 py-1 text-[11.5px] cursor-pointer"
              style={{ ...gPill, background: "var(--g-surface-2)", color: "var(--g-text-muted)" }}
            >
              <span style={{ fontFamily: "ui-monospace, Menlo, monospace", color: "var(--g-accent)" }}>{String(i + 1).padStart(2, "0")}</span>{" "}
              {isAr ? s.arLabel : s.label}
            </button>
          ))}
        </div>
      </div>

      {ws.overviewHtml && (
        <div className="col-span-2 lg:col-span-6 p-6 md:p-7" style={gCard}>
          <div dir="auto" className="bidi-auto mosaic-overview" dangerouslySetInnerHTML={{ __html: ws.overviewHtml }} />
        </div>
      )}

      <div className="col-span-2 lg:col-span-6">
        <SignOffPanel ws={ws} section="overview" isAr={isAr} />
      </div>
    </div>
  );
}

/** Black or white, whichever is legible on this swatch. */
function bestInk(hex: string): string {
  return bestInkOn(hex)?.ink ?? "#000000";
}

MosaicTemplate.displayName = "MosaicTemplate";
