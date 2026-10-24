"use client";

// "Manual" — the printed brand book, on screen.
//
// Modelled on the shape of a PDF brand manual rather than on a website: a
// fixed left rail carrying the chapter number, the running head and the page
// title; the content in the right column; a hairline under the running head
// and another down the rail; a page number in the bottom corner; and a
// full-bleed inverted chapter opener before each part.
//
// Nothing here is a fixed colour. The pages take the brand's own paper, the
// openers take --g-invert-*, and the accent carries the chapter numbers — so
// the same manual is gold-on-charcoal for one brand and teal-on-bone for the
// next without a line of this file changing.

import { Fragment, ReactNode } from "react";
import Link from "next/link";
import { LangToggle, Icon } from "@/components/ui";
import { BrandMark } from "@/components/ui/media";
import { navLogo, navMark } from "@/components/features/guideline-site/model/brandLogo";
import { DownloadPanel } from "@/components/features/guideline-site/components/documents/DownloadPanel";
import { BlockRenderer } from "@/components/features/guideline-site/components/BlockRenderer";
import {
  FlowShell,
  InsertPoint,
  SectionHeading,
  SectionNote,
  SectionNoteProvider,
} from "@/components/features/guideline-site/components/LiveEdit";
import { FixedSectionBody, SignOffPanel, StatementBand } from "@/components/features/guideline-site/components/Content";
import { flowLabel, SectionTitles } from "@/components/features/guideline-site/components/flowHelpers";
import { themeCssVars } from "@/components/features/guideline-site/model/theme";
import { bestInkOn } from "@/lib/contrast";
import { colorFormats } from "@/lib/utils";
import { TemplateProps } from "../types";

/** Manual's own wording for the derived sections, until a studio renames one. */
const TITLES: SectionTitles = {
  overview: ["Introduction", "مقدمة"],
  statement: ["Statement", "العبارة"],
  strategy: ["Strategy", "الاستراتيجية"],
  logo: ["Logo", "الشعار"],
  misuse: ["Prohibited Use", "الاستخدام الممنوع"],
  "app-icon": ["Favicon", "أيقونة المفضلة"],
  color: ["Color Palette", "لوحة الألوان"],
  typography: ["Typography", "الخطوط"],
  mockups: ["Applications", "التطبيقات"],
  photography: ["Photography", "التصوير"],
  patterns: ["Pattern", "النقوش"],
  icons: ["Iconography", "الأيقونات"],
  social: ["Social Media", "وسائل التواصل"],
  personas: ["Personas", "الشخصيات"],
  voice: ["Tone of Voice", "نبرة الصوت"],
  departments: ["Departments", "أقسام الشركة"],
};

/**
 * The rail is 300px, written into the two `md:grid-cols-[300px_1fr]` classes
 * rather than held here: Tailwind scans source for literal class names, so a
 * value interpolated from a constant would never generate a rule.
 */

export function ManualTemplate(props: TemplateProps) {
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
  const fixedCtx = {
    ws,
    isAr,
    onDark: !theme.isLight,
    attachedSlots,
    photoAssets,
    iconAssets,
    mockupAssets,
    publishedDepartments,
  };
  const runningHead = isAr ? "دليل الهوية" : "Brand Guidelines";

  /**
   * The bodies the printed form does differently.
   *
   * A manual gives colour a full-bleed spread of vertical columns and type a
   * page of the alphabet at size — neither is a card grid, and rendering them
   * as one would make this template a reskin instead of a system.
   */
  const bodyOverrides: Record<string, ReactNode> = {
    color: <ManualPalette ws={ws} isAr={isAr} />,
    typography: <ManualType ws={ws} isAr={isAr} />,
    voice: (
      <ManualRows
        rows={ws.strategy.voiceTraits.map((t) => ({
          id: t.id,
          label: t.trait,
          body: t.doExample,
          counter: t.dontExample,
        }))}
        counterLabel={isAr ? "لا" : "Not"}
      />
    ),
  };

  return (
    <SectionNoteProvider lookup={sectionNote}>
      <div
        dir={isAr ? "rtl" : "ltr"}
        className="min-h-screen"
        data-guideline-surface=""
        style={{
          ...themeCssVars(theme),
          background: "var(--g-canvas)",
          color: "var(--g-text)",
          fontFamily: isAr ? "var(--font-arabic)" : "var(--font-sans)",
        }}
      >
        {/* A manual has no navigation, but a web page that is only readable by
            scrolling 35 screens is a worse manual. This bar stays thin and
            ruled so it reads as part of the binding rather than as chrome. */}
        <div
          className="sticky top-0 z-40 h-12 flex items-center justify-between px-6 md:px-10 gap-4 backdrop-blur"
          style={{
            background: "color-mix(in srgb, var(--g-canvas) 88%, transparent)",
            boxShadow: "inset 0 -1px 0 var(--g-hairline)",
          }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {logo.src ? (
              <BrandMark
                src={logo.src}
                lightSrc={logo.lightSrc}
                alt={ws.name}
                onDark={!theme.isLight}
                style={{ maxHeight: 20, maxWidth: 150 }}
              />
            ) : (
              <span className="font-semibold text-[14px] truncate">{ws.name}</span>
            )}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {activePage && (
              <Link href={`/v/${ws.slug}`} className="text-[12px]" style={{ color: "var(--g-text-faint)" }}>
                {isAr ? "الرئيسية" : "Home"}
              </Link>
            )}
            {pages.map((p) => (
              <Link
                key={p.id}
                href={`/v/${ws.slug}/p/${p.slug}`}
                className="text-[12px] hidden sm:inline"
                style={{ color: activePage?.id === p.id ? "var(--g-text)" : "var(--g-text-faint)" }}
              >
                {isAr ? p.arName : p.name}
              </Link>
            ))}
            <LangToggle value={previewLang} onChange={setPreviewLang} size="sm" />
          </div>
        </div>

        {!activePage && (
          <>
            <Cover ws={ws} markSrc={mark.src} lightMarkSrc={mark.lightSrc} runningHead={runningHead} />
            <ContentsPage sections={sections} pages={pages} ws={ws} isAr={isAr} scrollTo={scrollTo} />
          </>
        )}

        {activePage && (
          <Page
            index={0}
            chapter={isAr ? "صفحة" : "Page"}
            runningHead={runningHead}
            brandName={ws.name}
            isAr={isAr}
            title={isAr ? activePage.arName : activePage.name}
          >
            <span />
          </Page>
        )}

        {flow.map((item, i) => {
          const label = flowLabel(item, sectionTitle, TITLES, isAr, i);
          const index = sectionIndex(item.id);
          return (
            <Fragment key={item.id}>
              <FlowShell flowId={item.id} kind={item.kind} label={label} style={item.style} accent={theme.accent}>
                {item.id === "statement" ? (
                  <StatementBand
                    text={statementText}
                    isAr={isAr}
                    className="px-6 md:px-16 py-20"
                    style={{ background: "var(--g-invert-bg)" }}
                    textClassName="bidi-auto max-w-[900px] mx-auto text-[26px] md:text-[34px] font-semibold leading-[1.35]"
                    textStyle={{ fontFamily: "var(--font-display)", color: "var(--g-invert-ink)" }}
                    noteStyle={{ color: "var(--g-invert-ink)", opacity: 0.72 }}
                  />
                ) : item.kind === "block" && item.block.kind === "divider" ? (
                  <div className="px-6 md:px-16">
                    <BlockRenderer block={item.block} ws={ws} isAr={isAr} />
                  </div>
                ) : (
                  <>
                    {/* Chapter openers belong to the real chapters. A block a
                        studio dropped between two sections is a page, not a
                        part, and giving it a full-screen divider would make the
                        manual's structure describe the editing history rather
                        than the brand. */}
                    {item.kind === "fixed" && (
                      <ChapterOpener
                        index={index}
                        title={label}
                        markSrc={mark.src}
                        lightMarkSrc={mark.lightSrc}
                        brandName={ws.name}
                      />
                    )}
                    <Page
                      id={item.id}
                      index={index}
                      chapter={`${String(index).padStart(2, "0")}.`}
                      chapterLabel={label}
                      runningHead={runningHead}
                      brandName={ws.name}
                      isAr={isAr}
                      title={label}
                      titleId={item.id}
                      noteId={item.id}
                      active={activeId === item.id}
                    >
                      {item.kind === "block" ? (
                        <BlockRenderer block={item.block} ws={ws} isAr={isAr} />
                      ) : item.id === "overview" ? (
                        <div className="flex flex-col gap-6">
                          {ws.overviewHtml && (
                            <div
                              dir="auto"
                              className="bidi-auto manual-overview"
                              dangerouslySetInnerHTML={{ __html: ws.overviewHtml }}
                            />
                          )}
                          <SignOffPanel ws={ws} section="overview" isAr={isAr} />
                        </div>
                      ) : (
                        <FixedSectionBody id={item.id} ctx={fixedCtx} overrides={bodyOverrides} />
                      )}
                    </Page>
                  </>
                )}
              </FlowShell>
              <div className="px-6 md:px-16">
                <InsertPoint afterId={item.id} isAr={isAr} after={label} />
              </div>
            </Fragment>
          );
        })}

        {attachedSlots.length > 0 && (
          <div className="px-6 md:px-16 py-16 flex justify-center" style={{ boxShadow: "inset 0 1px 0 var(--g-hairline)" }}>
            <button
              type="button"
              onClick={() => setDownloadOpen(true)}
              className="h-11 px-6 text-[13px] font-semibold cursor-pointer flex items-center gap-2"
              style={{ background: "var(--g-accent)", color: "var(--g-accent-ink)" }}
            >
              {isAr ? "تحميل الأصول" : "Download assets"}
              <Icon name="external-link-alt" size={12} />
            </button>
          </div>
        )}

        {showMarkyosBadge && (
          <div className="pb-8 pt-2 flex justify-center">
            <span className="text-[11px]" style={{ color: "var(--g-text-faint)" }}>
              {isAr ? "دليل الهوية مقدَّم عبر ماركيوس" : "Guideline delivered with Markyos"}
            </span>
          </div>
        )}

        {downloadOpen && <DownloadPanel workspace={ws} onClose={() => setDownloadOpen(false)} />}

        <style jsx global>{`
          .manual-overview h2 { margin: 0 0 12px; font-family: var(--font-display); font-size: var(--g-section-size); font-weight: 700; line-height: 1.2; letter-spacing: var(--g-hero-tracking); }
          .manual-overview p { margin: 0 0 16px; font-size: var(--g-body-size); line-height: var(--g-lead); }
          .manual-overview blockquote { margin: 0 0 16px; padding: 0 0 0 18px; border-inline-start: 2px solid var(--g-accent); font-size: var(--g-body-size); line-height: var(--g-lead); }
        `}</style>
      </div>
    </SectionNoteProvider>
  );
}

/**
 * The cover. Inverted ground, a rule under the head, the mark in the corner,
 * and the title set large in the bottom quarter — the page every brand book
 * opens on.
 */
function Cover({
  ws,
  markSrc,
  lightMarkSrc,
  runningHead,
}: {
  ws: TemplateProps["ws"];
  markSrc?: string;
  lightMarkSrc?: string;
  runningHead: string;
}) {
  return (
    <div
      className="relative flex flex-col justify-end px-6 md:px-14 pb-16 md:pb-24"
      style={{ background: "var(--g-invert-bg)", color: "var(--g-invert-ink)", minHeight: "72vh" }}
    >
      <div className="absolute top-0 inset-x-6 md:inset-x-14 flex items-center gap-6 pt-10">
        <div className="flex-1" style={{ height: 1, background: "var(--g-invert-hairline)" }} />
        {markSrc && (
          <BrandMark src={markSrc} lightSrc={lightMarkSrc} alt="" onDark style={{ maxHeight: 54, maxWidth: 90 }} />
        )}
      </div>
      <h1
        dir="auto"
        className="bidi-auto"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(44px, 7vw, 86px)",
          lineHeight: 1.02,
          fontWeight: 700,
          letterSpacing: "-.03em",
          // The inverted ground's own accent — the page accent is solved
          // against white and a deep brand colour would disappear here.
          color: "var(--g-invert-accent)",
          maxWidth: "14ch",
        }}
      >
        {runningHead}
      </h1>
      <p dir="auto" className="bidi-auto mt-4 text-[15px]" style={{ opacity: 0.7 }}>
        {ws.name}
      </p>
    </div>
  );
}

/** The table of contents — page two of every manual ever printed. */
function ContentsPage({
  sections,
  pages,
  ws,
  isAr,
  scrollTo,
}: {
  sections: TemplateProps["sections"];
  pages: TemplateProps["pages"];
  ws: TemplateProps["ws"];
  isAr: boolean;
  scrollTo: TemplateProps["scrollTo"];
}) {
  if (sections.length === 0) return null;
  return (
    <div className="px-6 md:px-14 py-16 md:py-24" style={{ boxShadow: "inset 0 -1px 0 var(--g-hairline)" }}>
      {/* The rail-and-page spread is the book's layout, but a 300px rail beside
          content does not fit a 390px screen — below md the heading simply sits
          above its list instead of beside it. */}
      <div className="grid gap-10 md:gap-14 md:grid-cols-[300px_1fr]">
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--g-section-size)",
            fontWeight: 700,
            letterSpacing: "var(--g-hero-tracking)",
            lineHeight: 1.25,
          }}
        >
          {isAr ? "المحتويات" : "Table of Contents"}
        </h2>
        <div className="grid gap-x-10 gap-y-7 sm:grid-cols-2 lg:grid-cols-3 self-start">
          {sections.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => scrollTo(s.id)}
              className="flex items-start gap-3 text-start cursor-pointer group"
            >
              <span
                className="shrink-0 font-semibold text-[13px] pt-[2px]"
                style={{ color: "var(--g-accent)", fontVariantNumeric: "tabular-nums" }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="font-semibold text-[15px] transition-opacity group-hover:opacity-70">
                {isAr ? s.arLabel : s.label}
              </span>
            </button>
          ))}
          {pages.map((p) => (
            <Link
              key={p.id}
              href={`/v/${ws.slug}/p/${p.slug}`}
              className="flex items-start gap-3 text-start group"
            >
              <span className="shrink-0 pt-[3px]" style={{ color: "var(--g-accent)" }}>
                <Icon name="external-link-alt" size={11} />
              </span>
              <span className="font-semibold text-[15px] transition-opacity group-hover:opacity-70">
                {isAr ? p.arName : p.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

/** The full-bleed part divider: number and title, inverted, rule and mark. */
function ChapterOpener({
  index,
  title,
  markSrc,
  lightMarkSrc,
  brandName,
}: {
  index: number;
  title: string;
  markSrc?: string;
  lightMarkSrc?: string;
  brandName: string;
}) {
  return (
    <div
      className="relative flex flex-col justify-end px-6 md:px-14 pb-14 md:pb-20"
      style={{ background: "var(--g-invert-bg)", color: "var(--g-invert-ink)", minHeight: "56vh" }}
    >
      <div className="absolute top-0 inset-x-6 md:inset-x-14 flex items-center gap-6 pt-10">
        <div className="flex-1" style={{ height: 1, background: "var(--g-invert-hairline)" }} />
        {markSrc && (
          <BrandMark src={markSrc} lightSrc={lightMarkSrc} alt={brandName} onDark style={{ maxHeight: 44, maxWidth: 76 }} />
        )}
      </div>
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(38px, 6vw, 72px)",
          lineHeight: 1.04,
          fontWeight: 700,
          letterSpacing: "-.03em",
          color: "var(--g-invert-accent)",
        }}
      >
        <div>{String(index).padStart(2, "0")}.</div>
        <div dir="auto" className="bidi-auto">{title}</div>
      </div>
    </div>
  );
}

/**
 * One page of the manual: the rail on the binding side carrying the running
 * head, the title and the page number, and the content beside it.
 */
function Page({
  id,
  index,
  chapter,
  chapterLabel,
  runningHead,
  brandName,
  isAr,
  title,
  titleId,
  noteId,
  children,
}: {
  id?: string;
  index: number;
  chapter: string;
  chapterLabel?: string;
  runningHead: string;
  brandName: string;
  isAr: boolean;
  title: string;
  titleId?: string;
  noteId?: string;
  active?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      id={id}
      className="scroll-mt-12 px-6 md:px-14 py-12 md:py-16"
      style={{ boxShadow: "inset 0 -1px 0 var(--g-hairline)" }}
    >
      <div className="grid gap-10 md:gap-14 items-start md:grid-cols-[minmax(0,300px)_1fr]">
        <div
          className="flex flex-col gap-7 md:sticky md:top-20"
          style={{ minWidth: 0 }}
        >
          {/* The running head: chapter on one side, publication on the other —
              the two lines a printed manual repeats on every spread so a reader
              who opens it anywhere knows where they are. */}
          <div className="flex items-start justify-between gap-4 pb-5" style={{ boxShadow: "inset 0 -1px 0 var(--g-hairline)" }}>
            <div className="text-[11px] leading-[1.45] min-w-0" style={{ color: "var(--g-text-muted)" }}>
              <div>{chapter}</div>
              {chapterLabel && <div dir="auto" className="bidi-auto truncate">{chapterLabel}</div>}
            </div>
            <div className="text-[11px] leading-[1.45] text-end min-w-0" style={{ color: "var(--g-text-muted)" }}>
              <div>{runningHead}</div>
              <div dir="auto" className="bidi-auto truncate">{brandName}</div>
            </div>
          </div>

          {titleId ? (
            <SectionHeading
              sectionId={titleId}
              value={title}
              className="bidi-auto"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "var(--g-section-size)",
                fontWeight: 700,
                letterSpacing: "var(--g-hero-tracking)",
                lineHeight: 1.2,
              }}
            />
          ) : (
            <h2
              dir="auto"
              className="bidi-auto"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "var(--g-section-size)",
                fontWeight: 700,
                letterSpacing: "var(--g-hero-tracking)",
                lineHeight: 1.2,
              }}
            >
              {title}
            </h2>
          )}

          {noteId && (
            <SectionNote
              sectionId={noteId}
              placeholder={isAr ? "أضف شرحًا لهذه الصفحة" : "Add a note for this page"}
              style={{ fontSize: "var(--g-body-size)", lineHeight: "var(--g-lead)", color: "var(--g-text-muted)" }}
            />
          )}

          <span className="text-[11px] mt-2" style={{ color: "var(--g-text-faint)", fontVariantNumeric: "tabular-nums" }}>
            {index > 0 ? String(index).padStart(2, "0") : ""}
          </span>
        </div>

        <div className="min-w-0 flex flex-col gap-6">{children}</div>
      </div>
    </div>
  );
}

/**
 * The palette as full-height columns rather than cards.
 *
 * This is how a printed manual shows colour: each one a band you can hold a
 * sample against, with its build underneath. The ink on each band is solved
 * against that band, so a pale swatch gets dark values printed on it and a
 * deep one gets light — no column is ever unreadable.
 */
/** Strips the CSS function wrapper and separators so a value reads the way a
 *  spec sheet prints it rather than the way a stylesheet declares it. */
function printValue(value: string): string {
  return value
    .replace(/^#/, "")
    .replace(/^[a-z]+\(/i, "")
    .replace(/\)$/, "")
    .replace(/,\s*/g, " ");
}

function ManualPalette({ ws, isAr }: { ws: TemplateProps["ws"]; isAr: boolean }) {
  if (ws.colors.length === 0) return null;
  return (
    <div className="grid gap-px" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(150px, 1fr))`, background: "var(--g-hairline)" }}>
      {ws.colors.map((c) => {
        const formats = colorFormats(c.hex);
        const ink = bestInkOn(c.hex)?.ink ?? "#000000";
        return (
          <div
            key={c.id}
            className="flex flex-col justify-between p-4"
            style={{ background: c.hex, color: ink, minHeight: 300 }}
          >
            <span className="text-[13px] font-semibold">{c.name}</span>
            <div className="flex flex-col gap-0.5 text-[11px]" style={{ fontFamily: "ui-monospace, Menlo, monospace", opacity: 0.85 }}>
              {/* A printed manual lists the build, not a CSS function call:
                  "RGB 213 180 110", not "RGB rgb(213, 180, 110)". CMYK earns
                  its place over HSL here — this is the page a print supplier
                  is sent. */}
              {formats
                .filter((f) => f.label !== "HSL")
                .map((f) => (
                  <span key={f.label} dir="ltr">
                    {f.label} {printValue(f.value)}
                  </span>
                ))}
              {c.isPrimary && (
                <span className="mt-1.5 text-[10px] font-semibold" style={{ letterSpacing: ".08em" }}>
                  {isAr ? "أساسي" : "PRIMARY"}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** The typeface pages: the family named, then the alphabet at size, in the
 *  accent — the spread a designer photographs to show the type choice. */
function ManualType({ ws, isAr }: { ws: TemplateProps["ws"]; isAr: boolean }) {
  const faces = [
    {
      key: "latin",
      role: isAr ? "الخط الأساسي" : "Primary Typeface",
      use: isAr ? "للعناوين والعناوين الفرعية." : "For titles and subtitles.",
      family: ws.typography.latinFamily,
      font: "var(--font-sans)",
      dir: "ltr" as const,
      lines: ["Aa Bb Cc Dd Ee Ff Gg Hh Ii", "Jj Kk Ll Mm Nn Oo Pp Qq Rr", "Ss Tt Uu Vv Ww Xx Yy Zz", "0 1 2 3 4 5 6 7 8 9"],
    },
    {
      key: "arabic",
      role: isAr ? "الخط الثانوي" : "Secondary Typeface",
      use: isAr ? "للنصوص والفقرات." : "For body text and paragraphs.",
      family: ws.typography.arabicFamily,
      font: "var(--font-arabic)",
      dir: "rtl" as const,
      lines: ["ا ب ت ث ج ح خ د ذ ر", "ز س ش ص ض ط ظ ع غ ف", "ق ك ل م ن ه و ي", "٠ ١ ٢ ٣ ٤ ٥ ٦ ٧ ٨ ٩"],
    },
  ];

  return (
    <div className="flex flex-col">
      {faces.map((f, i) => (
        <div key={f.key} className="py-8" style={i > 0 ? { boxShadow: "inset 0 1px 0 var(--g-hairline)" } : undefined}>
          <div className="flex items-baseline justify-between gap-4 mb-5">
            <span className="text-[12px] font-semibold">{f.role}</span>
            <span className="text-[12px]" style={{ color: "var(--g-text-faint)" }}>{f.use}</span>
          </div>
          {/* `w-fit` so the RTL specimen still shapes right-to-left but hugs
              its own lines instead of being flung to the far edge of a wide
              column, half a page from the Latin one it sits under. */}
          <div dir={f.dir} className="w-fit" style={{ fontFamily: f.font, color: "var(--g-accent)" }}>
            <div className="font-semibold" style={{ fontSize: 26, marginBottom: 6 }}>{f.family}</div>
            {f.lines.map((line) => (
              <div key={line} style={{ fontSize: 26, lineHeight: 1.45, fontWeight: 600 }}>
                {line}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * The label/description table the printed manual uses for values and tone: an
 * accent-coloured band naming the trait, the sentence beneath it, ruled.
 */
function ManualRows({
  rows,
  counterLabel,
}: {
  rows: { id: string; label: string; body: string; counter?: string }[];
  /** Prefix for the contrasting example, when a row has one. */
  counterLabel?: string;
}) {
  if (rows.length === 0) return null;
  return (
    <div className="flex flex-col" style={{ boxShadow: "inset 0 1px 0 var(--g-hairline)" }}>
      {rows.map((r) => (
        <Fragment key={r.id}>
          <div
            className="py-2.5 px-4 text-[13px] font-semibold text-center"
            style={{ background: "var(--g-surface-1)", color: "var(--g-accent)", boxShadow: "inset 0 -1px 0 var(--g-hairline)" }}
          >
            {r.label}
          </div>
          <div
            className="py-5 px-4 text-center flex flex-col gap-1.5"
            style={{ fontSize: "var(--g-body-size)", lineHeight: "var(--g-lead)", boxShadow: "inset 0 -1px 0 var(--g-hairline)" }}
          >
            <span dir="auto" className="bidi-auto">{r.body}</span>
            {/* The counter-example is set apart rather than run on. "Direct.
                Not: we generally try to avoid…" is two instructions; joining
                them with a slash made one unreadable sentence. */}
            {r.counter && (
              <span dir="auto" className="bidi-auto text-[13px]" style={{ color: "var(--g-text-faint)" }}>
                {counterLabel ? `${counterLabel}: ` : ""}
                {r.counter}
              </span>
            )}
          </div>
        </Fragment>
      ))}
    </div>
  );
}

ManualTemplate.displayName = "ManualTemplate";
