"use client";

// "Prism" — the original Studio look, modeled on a BrandKit-style design-
// system deck: a centered floating pill nav, a full-bleed gradient hero per
// section, and bracket-style eyebrow labels (`{ WORKSPACE }`, `{ 01 }`).

import { Fragment, ReactNode } from "react";
import Link from "next/link";
import { LangToggle, Icon } from "@/shared/ui";
import { BrandMark } from "@/shared/ui/media/BrandMark/BrandMark";
import { navLogo } from "@/features/guideline-site/model/brandLogo";
import { DownloadPanel } from "@/features/guideline-site/components/documents/DownloadPanel";
import { BlockRenderer } from "@/features/guideline-site/components/BlockRenderer";
import { FlowShell, InsertPoint, SectionHeading, SectionNote, SectionNoteProvider } from "@/features/guideline-site/components/LiveEdit";
import { FixedSectionBody, SignOffPanel, StatementBand } from "@/features/guideline-site/components/Content";
import { flowLabel, SectionTitles } from "@/features/guideline-site/components/flowHelpers";
import { themeCssVars } from "@/features/guideline-site/model/theme";
import { gPill } from "@/features/guideline-site/components/surface";
import { TemplateProps } from "../../types";

const TOP_NAV_IDS = ["logo", "color", "typography", "photography", "icons"];

/** Prism's own wording for the derived sections, until a studio renames one. */
const TITLES: SectionTitles = {
  overview: ["Overview", "نظرة عامة"],
  statement: ["Statement", "العبارة"],
  strategy: ["Strategy", "الاستراتيجية"],
  logo: ["Logo", "الشعار"],
  misuse: ["Misuse", "استخدامات خاطئة"],
  "app-icon": ["App icon", "أيقونة التطبيق"],
  color: ["Color", "الألوان"],
  typography: ["Type", "الخطوط"],
  mockups: ["In use", "التطبيقات"],
  photography: ["Photo", "التصوير"],
  patterns: ["Pattern", "النقوش"],
  icons: ["Icons", "الأيقونات"],
  social: ["Social", "التواصل"],
  personas: ["Personas", "الشخصيات"],
  voice: ["Voice", "الصوت"],
  departments: ["Departments", "أقسام الشركة"],
};

export function StudioPrism(props: TemplateProps) {
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

  const topNav = sections.filter((s) => TOP_NAV_IDS.includes(s.id));
  // The brand's own ink rather than flat white/near-black: it already carries
  // the brand's hue and is solved for 7:1 on this ground, so the hero reads as
  // part of the palette instead of as the tool's default.
  const heroText = "var(--g-text)";
  /** Ink and active-state fill for the floating nav, which scrims the ground. */
  const navInk = "var(--g-text)";
  const navActive = theme.isLight ? "rgba(0,0,0,.08)" : "rgba(255,255,255,.14)";
  const logo = navLogo(ws, isAr);
  const fixedCtx = { ws, isAr, onDark: !theme.isLight, attachedSlots, photoAssets, iconAssets, mockupAssets, publishedDepartments };
  const heroTitle = sectionTitle("overview-title", ws.strategy.purpose || (isAr ? "دليل الهوية" : "Brand guideline"));

  return (
    <SectionNoteProvider lookup={sectionNote}>
    <div
      dir={isAr ? "rtl" : "ltr"}
      className="min-h-screen"
      // Re-points the shared .rich-text stylesheet at the brand's own palette.
      data-guideline-surface=""
      style={{ ...themeCssVars(theme), background: "var(--g-canvas)", color: "var(--g-text)", fontFamily: isAr ? "var(--font-arabic)" : "var(--font-sans)" }}
    >
      {/*
        Sticky rather than fixed. `fixed` anchors to the browser viewport, so
        inside the editor's preview pane this pill escaped the page it belongs
        to and floated over the editor's own chrome. Sticky anchors to whatever
        is scrolling it — the preview card in the editor, the window on the
        published site — and the negative margin keeps it overlaying the hero
        instead of pushing it down.
      */}
      {/*
        The floating pill scrims whatever is behind it, so its own fill and
        label colour have to follow the ground — a dark scrim with white
        labels sat on a light site as an unexplained black blob.
      */}
      <nav
        className="sticky top-5 z-40 mx-auto w-fit mt-5 -mb-16 flex items-center gap-1 p-1.5 backdrop-blur"
        style={{
          ...gPill,
          background: theme.isLight ? "rgba(255,255,255,.72)" : "rgba(0,0,0,.35)",
          boxShadow: theme.isLight ? "inset 0 0 0 1px rgba(0,0,0,.1), 0 6px 20px rgba(0,0,0,.08)" : "inset 0 0 0 1px rgba(255,255,255,.12)",
        }}
      >
        <span
          className="h-8 ps-2 pe-3.5 text-[12.5px] font-semibold flex items-center gap-2"
          style={{ ...gPill, background: "var(--g-text)", color: "var(--g-canvas)" }}
        >
          {/* This chip inverts the site's ground — it's dark on a light site
              and light on a dark one — so the logo reverses with the chip,
              not with the page. */}
          {logo.isLockup ? (
            <BrandMark
              src={logo.src}
              lightSrc={logo.lightSrc}
              alt={ws.name}
              onDark={theme.isLight}
              style={{ maxHeight: 18, maxWidth: 150 }}
            />
          ) : (
            <>
              {logo.src && (
                <BrandMark
                  src={logo.src}
                  lightSrc={logo.lightSrc}
                  alt={ws.name}
                  onDark={theme.isLight}
                  style={{ maxWidth: 18, maxHeight: 18, flexShrink: 0 }}
                />
              )}
              {ws.name}
            </>
          )}
        </span>
        {activePage && (
          <Link
            href={`/v/${ws.slug}`}
            className="h-8 px-3.5 text-[12.5px] font-medium cursor-pointer whitespace-nowrap hidden sm:flex items-center"
            style={{ ...gPill, color: navInk }}
          >
            {isAr ? "الرئيسية" : "Home"}
          </Link>
        )}
        {topNav.map((s) => {
          const active = activeId === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => scrollTo(s.id)}
              className="h-8 px-3.5 text-[12.5px] font-medium cursor-pointer whitespace-nowrap hidden sm:flex items-center"
              style={{ ...gPill, background: active ? navActive : "transparent", color: navInk }}
            >
              {isAr ? s.arLabel : s.label}
            </button>
          );
        })}
        {pages.map((p) => {
          const active = activePage?.id === p.id;
          return (
            <Link
              key={p.id}
              href={`/v/${ws.slug}/p/${p.slug}`}
              className="h-8 px-3.5 text-[12.5px] font-medium cursor-pointer whitespace-nowrap hidden sm:flex items-center"
              style={{ ...gPill, background: active ? navActive : "transparent", color: navInk }}
            >
              {isAr ? p.arName : p.name}
            </Link>
          );
        })}
        <span className="ps-1">
          <LangToggle value={previewLang} onChange={setPreviewLang} size="sm" />
        </span>
      </nav>

      {activePage && (
        <Hero
          eyebrow={`{ ${ws.name.toUpperCase()} }`}
          title={isAr ? activePage.arName : activePage.name}
          subtitle={isAr ? "نظام التصميم" : "DESIGN SYSTEM"}
          heroText={heroText}
          accent={theme.accent}
        />
      )}

      {flow.map((item, i) => {
        const label = flowLabel(item, sectionTitle, TITLES, isAr, i);
        return (
          <Fragment key={item.id}>
            <FlowShell flowId={item.id} kind={item.kind} label={label} style={item.style} accent={theme.accent}>
              {item.id === "overview" ? (
                <>
                  <Hero
                    eyebrow={sectionTitle("overview-eyebrow", `{ ${ws.name.toUpperCase()} }`)}
                    title={heroTitle}
                    subtitle={isAr ? "نظام التصميم" : "DESIGN SYSTEM"}
                    heroText={heroText}
                    accent={theme.accent}
                    isAr={isAr}
                  />
                  {sections.length > 0 && <Index ws={ws} sections={sections} scrollTo={scrollTo} isAr={isAr} />}
                  <div id="overview" className="px-8 md:px-16 py-14 max-w-[900px] mx-auto flex flex-col gap-5 scroll-mt-0">
                    {ws.overviewHtml && <div dir="auto" className="bidi-auto studio-overview" dangerouslySetInnerHTML={{ __html: ws.overviewHtml }} />}
                    <SignOffPanel ws={ws} section="overview" isAr={isAr} />
                  </div>
                </>
              ) : item.id === "statement" ? (
                <StatementBand
                  text={statementText}
                  isAr={isAr}
                  className="px-8 md:px-16 py-14"
                  style={{ background: "var(--g-accent)" }}
                  textClassName="bidi-auto max-w-[900px] mx-auto text-[22px] md:text-[28px] font-semibold leading-[1.4] text-center"
                  // The band is filled with the accent, so its ink is solved
                  // against the accent — not against the page ground, which is
                  // a different colour and a different question.
                  textStyle={{ fontFamily: "var(--font-display)", color: "var(--g-accent-ink)" }}
                  noteStyle={{ color: "var(--g-accent-ink)", opacity: 0.75, textAlign: "center" }}
                />
              ) : item.kind === "block" && item.block.kind === "divider" ? (
                <div className="px-8 md:px-16 max-w-[900px] mx-auto">
                  <BlockRenderer block={item.block} ws={ws} isAr={isAr} />
                </div>
              ) : (
                <Section id={item.id} index={sectionIndex(item.id)} title={label}>
                  {item.kind === "block" ? (
                    <BlockRenderer block={item.block} ws={ws} isAr={isAr} />
                  ) : (
                    <FixedSectionBody id={item.id} ctx={fixedCtx} />
                  )}
                </Section>
              )}
            </FlowShell>
            <div className="px-8 md:px-16 max-w-[900px] mx-auto">
              <InsertPoint afterId={item.id} isAr={isAr} after={label} />
            </div>
          </Fragment>
        );
      })}

      {!activePage && (sections.length > 0 || pages.length > 0) && (
        <Sitemap ws={ws} sections={sections} pages={pages} scrollTo={scrollTo} isAr={isAr} />
      )}

      <div className="h-[30vh]" />

      {showMarkyosBadge && (
        <div className="pb-6 pt-2 flex justify-center">
          <span className="text-[11px]" style={{ color: "var(--g-text-faint)" }}>{isAr ? "دليل الهوية مقدَّم عبر ماركيوس" : "Guideline delivered with Markyos"}</span>
        </div>
      )}

      {downloadOpen && <DownloadPanel workspace={ws} onClose={() => setDownloadOpen(false)} />}

      <style jsx global>{`
        .studio-overview h2 { margin: 0 0 14px; font-family: var(--font-display); font-size: 26px; font-weight: 600; }
        .studio-overview p { margin: 0 0 16px; font-size: 16px; line-height: 1.7; color: var(--g-text-muted); }
        .studio-overview blockquote { margin: 0 0 16px; padding: 16px 20px; border-inline-start: 2px solid var(--g-accent); background: var(--g-surface-1); border-start-start-radius: 0; border-end-start-radius: 0; border-start-end-radius: 10px; border-end-end-radius: 10px; }
      `}</style>
    </div>
    </SectionNoteProvider>
  );
}

/**
 * `isAr` switches the eyebrow and headline from plain text to fields the
 * studio can rewrite on the page. A custom page passes neither, because its
 * hero is that page's own name — renaming it belongs with the page, not here.
 */
function Hero({
  eyebrow,
  title,
  subtitle,
  heroText,
  accent,
  isAr,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  heroText: string;
  accent: string;
  isAr?: boolean;
  children?: ReactNode;
}) {
  const editable = isAr !== undefined;
  return (
    <div
      className="min-h-[62vh] flex flex-col items-center justify-center text-center px-8 gap-4"
      style={{ background: `radial-gradient(circle at 30% 100%, ${accent} 0%, transparent 55%), var(--g-canvas)` }}
    >
      {editable ? (
        <SectionHeading
          sectionId="overview-eyebrow"
          as="span"
          value={eyebrow}
          className="text-[12px] font-medium"
          style={{ fontFamily: "ui-monospace, Menlo, monospace", color: heroText, opacity: 0.65 }}
        />
      ) : (
        <span className="text-[12px] font-medium" style={{ fontFamily: "ui-monospace, Menlo, monospace", color: heroText, opacity: 0.65 }}>{eyebrow}</span>
      )}
      {editable ? (
        <SectionHeading
          sectionId="overview-title"
          as="h2"
          value={title}
          className="bidi-auto font-semibold tracking-tight leading-[0.95]"
          style={{ fontFamily: "var(--font-display)", fontSize: "clamp(44px, 9vw, 110px)", color: heroText }}
        />
      ) : (
        <h1
          dir="auto"
          className="bidi-auto font-semibold tracking-tight leading-[0.95]"
          style={{ fontFamily: "var(--font-display)", fontSize: "clamp(44px, 9vw, 110px)", color: heroText }}
        >
          {title}
        </h1>
      )}
      {/* The variable, not the raw prop. As text this has to follow whatever
          accent the section resolves to — a section given its own background
          tunes `--g-accent` to stay readable on it, and a literal passed down
          in JS never sees that. The gradient above keeps the raw value: it is
          a wash, not something anyone has to read. */}
      <span className="text-[13px] font-semibold uppercase" style={{ letterSpacing: ".2em", color: "var(--g-accent)" }}>{subtitle}</span>
      {editable && (
        <SectionNote
          sectionId="overview"
          placeholder={isAr ? "أضف سطرًا تمهيديًا" : "Add an opening line"}
          className="text-[15px] leading-[1.6] max-w-[52ch]"
          style={{ color: heroText, opacity: 0.8 }}
        />
      )}
      {children}
    </div>
  );
}

/** BrandKit's real "[Section] Index" pattern: a bracket eyebrow, a count
 *  badge, and a row per sub-section with a "VIEW →" jump link. */
function Index({
  ws,
  sections,
  scrollTo,
  isAr,
}: {
  ws: TemplateProps["ws"];
  sections: TemplateProps["sections"];
  scrollTo: TemplateProps["scrollTo"];
  isAr: boolean;
}) {
  return (
    <div className="px-8 md:px-16 py-14" style={{ boxShadow: "inset 0 1px 0 var(--g-hairline)" }}>
      <div className="max-w-[900px] mx-auto flex flex-col gap-5">
        <div className="flex items-baseline gap-3">
          <span className="text-[12px] font-medium" style={{ fontFamily: "ui-monospace, Menlo, monospace", color: "var(--g-text-faint)" }}>
            {`{ ${ws.name.toUpperCase()} // INDEX }`}
          </span>
        </div>
        {/*
          Collapsed by default. A full-height contents list pushed the actual
          brand content below the fold on every visit; as a disclosure it stays
          one click away for the reader who wants to jump, and out of the way
          for the one who just wants to read.
        */}
        <details className="group">
          <summary className="flex items-baseline gap-3 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
            <h2 className="text-[28px] font-semibold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>{isAr ? "الفهرس" : "Index"}</h2>
            <span className="text-[14px]" style={{ color: "var(--g-text-faint)" }}>({sections.length})</span>
            <span
              className="ms-auto text-[11px] font-semibold flex items-center gap-1.5"
              style={{ letterSpacing: ".08em", color: "var(--g-accent)" }}
            >
              <span className="group-open:hidden">{isAr ? "عرض الكل" : "SHOW ALL"}</span>
              <span className="hidden group-open:inline">{isAr ? "إخفاء" : "HIDE"}</span>
              <Icon name="angle-down" size={12} className="transition-transform group-open:rotate-180" />
            </span>
          </summary>
          <div className="flex flex-col mt-4">
            {sections.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => scrollTo(s.id)}
                className="flex items-center gap-4 py-3.5 text-start cursor-pointer"
                style={{ boxShadow: i < sections.length - 1 ? "inset 0 -1px 0 var(--g-hairline)" : "none" }}
              >
                <span className="text-[12px] shrink-0" style={{ fontFamily: "ui-monospace, Menlo, monospace", color: "var(--g-text-faint)" }}>
                  {`{ ${i + 1} }`}
                </span>
                <span className="flex-1 text-[15px] font-medium">{isAr ? s.arLabel : s.label}</span>
                <span className="text-[11px] font-semibold" style={{ letterSpacing: ".08em", color: "var(--g-accent)" }}>
                  {isAr ? "عرض ←" : "VIEW →"}
                </span>
              </button>
            ))}
          </div>
        </details>
      </div>
    </div>
  );
}

/** BrandKit's homepage sitemap: a full-bleed accent block listing every
 *  section and page, grouped and right-aligned in an all-caps monospace
 *  style — the visual "table of contents" for the whole guideline. */
function Sitemap({
  ws,
  sections,
  pages,
  scrollTo,
  isAr,
}: {
  ws: TemplateProps["ws"];
  sections: TemplateProps["sections"];
  pages: TemplateProps["pages"];
  scrollTo: TemplateProps["scrollTo"];
  isAr: boolean;
}) {
  const bandText = "var(--g-accent-ink)";
  return (
    <div className="px-8 md:px-16 py-16" style={{ background: "var(--g-accent)" }}>
      <div className="max-w-[900px] mx-auto grid md:grid-cols-[1fr_2fr] gap-8">
        <div>
          <h2 className="text-[30px] font-semibold tracking-tight" style={{ fontFamily: "var(--font-display)", color: bandText }}>
            {isAr ? "الفهرس الكامل" : "Sitemap"}
          </h2>
          <span className="text-[13px]" style={{ color: bandText, opacity: 0.7 }}>
            {isAr ? `(${sections.length + pages.length})` : `Index (${sections.length + pages.length})`}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2">
          {sections.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => scrollTo(s.id)}
              className="mk-tap text-end text-[12px] font-semibold uppercase cursor-pointer py-0.5"
              style={{ letterSpacing: ".04em", color: bandText, fontFamily: "ui-monospace, Menlo, monospace", opacity: 0.85 }}
            >
              ({i + 1}) {isAr ? s.arLabel : s.label}
            </button>
          ))}
          {pages.map((p) => (
            <Link
              key={p.id}
              href={`/v/${ws.slug}/p/${p.slug}`}
              className="mk-tap text-end text-[12px] font-semibold uppercase py-0.5"
              style={{ letterSpacing: ".04em", color: bandText, fontFamily: "ui-monospace, Menlo, monospace", opacity: 0.85 }}
            >
              → {isAr ? p.arName : p.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function Section({ id, index, title, children }: { id: string; index: number; title: string; children: ReactNode }) {
  return (
    <div id={id} className="px-8 md:px-16 py-16 scroll-mt-0" style={{ boxShadow: "inset 0 1px 0 var(--g-hairline)" }}>
      <div className="max-w-[900px] mx-auto flex flex-col gap-6">
        <div className="flex items-baseline gap-3">
          <span className="text-[12px] font-medium" style={{ fontFamily: "ui-monospace, Menlo, monospace", color: "var(--g-text-faint)" }}>
            {`{ ${String(index).padStart(2, "0")} }`}
          </span>
          <SectionHeading sectionId={id} value={title} className="text-[34px] font-semibold tracking-tight" style={{ fontFamily: "var(--font-display)" }} />
        </div>
        <SectionNote sectionId={id} className="text-[16px] leading-[1.7] max-w-[62ch] -mt-2" style={{ color: "var(--g-text-muted)" }} />
        {children}
      </div>
    </div>
  );
}

StudioPrism.displayName = "StudioPrism";
