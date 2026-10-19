"use client";

// "Atlas" — modeled on a documentation-style brand portal: a fixed sidebar
// where only the active section expands with a live preview line, and each
// section opens with an oversized numbered color-band hero, followed by
// two-column "label / description" content rows.

import { Fragment, ReactNode } from "react";
import Link from "next/link";
import { Icon, LangToggle, useToast } from "@/shared/ui";
import { BrandMark } from "@/shared/ui/media/BrandMark/BrandMark";
import { navLogo } from "@/features/guideline-site/model/brandLogo";
import { DownloadPanel } from "@/features/guideline-site/components/documents/DownloadPanel";
import { BlockRenderer } from "@/features/guideline-site/components/BlockRenderer";
import { FlowShell, InsertPoint, SectionHeading, SectionNote, SectionNoteProvider } from "@/features/guideline-site/components/LiveEdit";
import { FixedSectionBody, SignOffPanel, StatementBand } from "@/features/guideline-site/components/Content";
import { flowLabel, SectionTitles } from "@/features/guideline-site/components/flowHelpers";
import { themeCssVars } from "@/features/guideline-site/model/theme";
import { gCardSm, gLabel, gPill } from "@/features/guideline-site/components/surface";
import { Asset, PageBlock } from "@/core/data/types";
import { formatBytes, formatRelative, hexToRgb, rgbToCmyk } from "@/shared/lib/utils";
import { TemplateProps } from "../../types";

/** A short, real one-line preview of what a section actually contains —
 *  stands in for Cipherly's expanded accordion sub-anchors, since this
 *  app's sections don't have their own sub-pages to reveal. */
function previewFor(id: string, props: TemplateProps, isAr: boolean): string | null {
  const { ws, attachedSlots, photoAssets, iconAssets } = props;
  switch (id) {
    case "overview":
      return ws.strategy.purpose || null;
    case "logo":
      return attachedSlots.length > 0 ? (isAr ? `${attachedSlots.length} من 3 خانات` : `${attachedSlots.length} of 3 slots filled`) : null;
    case "color":
      return ws.colors.length > 0 ? (isAr ? `${ws.colors.length} ألوان` : `${ws.colors.length} colors`) : null;
    case "typography":
      return `${ws.typography.latinFamily} / ${ws.typography.arabicFamily}`;
    case "photography":
      return photoAssets.length > 0 ? (isAr ? `${photoAssets.length} صور` : `${photoAssets.length} photos`) : null;
    case "icons":
      return iconAssets.length > 0 ? (isAr ? `${iconAssets.length} أيقونة` : `${iconAssets.length} icons`) : null;
    case "personas":
      return ws.strategy.personas.length > 0 ? (isAr ? `${ws.strategy.personas.length} شخصيات` : `${ws.strategy.personas.length} personas`) : null;
    case "voice":
      return ws.strategy.voiceTraits.length > 0 ? (isAr ? `${ws.strategy.voiceTraits.length} سمات` : `${ws.strategy.voiceTraits.length} traits`) : null;
    default:
      return null;
  }
}

/** Atlas' own wording for the derived sections, until a studio renames one. */
const TITLES: SectionTitles = {
  overview: ["Overview", "نظرة عامة"],
  statement: ["Statement", "العبارة"],
  strategy: ["Strategy", "الاستراتيجية"],
  logo: ["Logo", "الشعار"],
  misuse: ["Misuse", "استخدامات خاطئة"],
  "app-icon": ["App icon", "أيقونة التطبيق"],
  color: ["Color", "الألوان"],
  typography: ["Typography", "الخطوط"],
  mockups: ["In use", "التطبيقات"],
  photography: ["Images", "التصوير"],
  patterns: ["Pattern", "النقوش"],
  icons: ["Icons", "الأيقونات"],
  social: ["Social", "التواصل"],
  personas: ["Personas", "الشخصيات"],
  voice: ["Voice", "الصوت"],
  departments: ["Departments", "أقسام الشركة"],
};

export function StudioAtlas(props: TemplateProps) {
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

  // Solved against the accent the band is filled with, not against the page
  // ground — the two are different colours and asking the wrong one is how a
  // pale brand ends up with white type on a yellow band.
  const bandText = "var(--g-accent-ink)";
  const logo = navLogo(ws, isAr);
  const fixedCtx = { ws, isAr, onDark: !theme.isLight, attachedSlots, photoAssets, iconAssets, mockupAssets, publishedDepartments };
  // Atlas opens on the brand's name rather than its purpose — the purpose gets
  // its own labelled row below, the way a reference portal lists a field.
  const heroTitle = sectionTitle("overview-title", ws.name);

  /**
   * Atlas lists colour values in its own label/value rows rather than the
   * shared swatch cards — that documentation-table treatment is the look, so
   * it keeps its own body instead of the default one.
   */
  const bodyOverrides = {
    color: (
      <>
        <SwatchGrid colors={ws.colors} isAr={isAr} />
        <p className="text-[12px]" style={{ color: "var(--g-text-faint)" }}>
          {isAr ? "اضغط على أي قيمة لنسخها." : "Click any value to copy it."}
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
        className="w-[300px] shrink-0 hidden md:flex flex-col gap-6 h-screen sticky top-0 overflow-y-auto px-6 py-8"
        style={{ boxShadow: isAr ? "inset -1px 0 0 var(--g-hairline)" : "inset 1px 0 0 var(--g-hairline)" }}
      >
        {logo.isLockup ? (
          <BrandMark
            src={logo.src}
            lightSrc={logo.lightSrc}
            alt={ws.name}
            onDark={!theme.isLight}
            style={{ maxHeight: 34, maxWidth: "100%" }}
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
        <div className="flex flex-col gap-0.5 text-[10px] font-semibold uppercase" style={{ letterSpacing: ".08em", color: "var(--g-text-faint)" }}>
          <span>{isAr ? "دليل الهوية البصرية" : "Visual identity guidelines"}</span>
          <span>{isAr ? `آخر تحديث: ${formatRelative(ws.updatedAt)}` : `Updated: ${formatRelative(ws.updatedAt)}`}</span>
        </div>

        <nav className="flex flex-col gap-0.5">
          {sections.map((s, i) => {
            const active = activeId === s.id;
            const preview = active ? previewFor(s.id, props, isAr) : null;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => scrollTo(s.id)}
                className="flex flex-col text-start px-2.5 py-2 cursor-pointer transition-colors"
                style={{ borderRadius: "var(--g-radius-md)", background: active ? "var(--g-surface-1)" : "transparent" }}
              >
                <span className="flex items-center gap-2.5 text-[13px]" style={{ color: active ? "var(--g-text)" : "var(--g-text-faint)", fontWeight: active ? 600 : 400 }}>
                  <span className="shrink-0" style={{ fontFamily: "ui-monospace, Menlo, monospace", fontSize: 10, color: active ? "var(--g-accent)" : "var(--g-text-faint)" }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="truncate">{isAr ? s.arLabel : s.label}</span>
                </span>
                {preview && (
                  <span className="ps-[26px] text-[11px] truncate mt-0.5" style={{ color: "var(--g-text-faint)" }}>{preview}</span>
                )}
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
              <Link href={`/v/${ws.slug}`} className="px-2.5 py-2 text-[13px]" style={{ borderRadius: "var(--g-radius-md)", color: "var(--g-text-faint)" }}>
                {isAr ? "الرئيسية" : "Home"}
              </Link>
            )}
            {pages.map((p) => {
              const active = activePage?.id === p.id;
              return (
                <Link
                  key={p.id}
                  href={`/v/${ws.slug}/p/${p.slug}`}
                  className="px-2.5 py-2 text-[13px]"
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
            <button
              type="button"
              onClick={() => setDownloadOpen(true)}
              className="h-10 text-[12.5px] font-semibold cursor-pointer w-full"
              style={{ ...gPill, boxShadow: "inset 0 0 0 1px var(--g-hairline)", color: "var(--g-text)" }}
            >
              {/* An Icon rather than a "↗" character — the offline icon set is
                  guaranteed to render, a Unicode arrow is not. */}
              {isAr ? "تحميل الأصول" : "Download assets"}
              <Icon name="external-link-alt" size={11} style={{ marginInlineStart: 6 }} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 min-w-0 flex flex-col">
        {activePage && (
          <div className="px-8 md:px-16 py-16 max-w-[980px]">
            <h1 dir="auto" className="bidi-auto text-[38px] font-semibold tracking-tight leading-[1.15]" style={{ fontFamily: "var(--font-display)" }}>
              {isAr ? activePage.arName : activePage.name}
            </h1>
          </div>
        )}

        <div className="flex flex-col pb-[30vh]">
          {flow.map((item, i) => {
            const label = flowLabel(item, sectionTitle, TITLES, isAr, i);
            return (
              <Fragment key={item.id}>
                <FlowShell flowId={item.id} kind={item.kind} label={label} style={item.style} accent={theme.accent}>
                  {item.id === "overview" ? (
                    <div id="overview" className="px-8 md:px-16 py-16 flex flex-col gap-6 scroll-mt-0 max-w-[980px]">
                      <SectionHeading
                        sectionId="overview-title"
                        value={heroTitle}
                        className="bidi-auto text-[38px] font-semibold tracking-tight leading-[1.15]"
                        style={{ fontFamily: "var(--font-display)" }}
                      />
                      <SectionNote
                        sectionId="overview"
                        placeholder={isAr ? "أضف سطرًا تمهيديًا" : "Add an opening line"}
                        className="text-[16px] leading-[1.7]"
                        style={{ color: "var(--g-text-muted)" }}
                      />
                      {ws.strategy.purpose && (
                        <Row label={isAr ? "الغاية" : "Purpose"}>
                          <p dir="auto" className="bidi-auto text-[16px] leading-[1.7]" style={{ color: "var(--g-text-muted)" }}>{ws.strategy.purpose}</p>
                        </Row>
                      )}
                      {ws.overviewHtml && (
                        <Row label={isAr ? "نظرة عامة" : "Overview"}>
                          <div dir="auto" className="bidi-auto atlas-overview" dangerouslySetInnerHTML={{ __html: ws.overviewHtml }} />
                        </Row>
                      )}
                      <SignOffPanel ws={ws} section="overview" isAr={isAr} />
                    </div>
                  ) : item.id === "statement" ? (
                    <StatementBand
                      text={statementText}
                      isAr={isAr}
                      className="px-8 md:px-16 py-12"
                      style={{ background: "var(--g-accent)" }}
                      textClassName="bidi-auto max-w-[980px] text-[22px] md:text-[26px] font-semibold leading-[1.4]"
                      textStyle={{ fontFamily: "var(--font-display)", color: bandText }}
                      noteStyle={{ color: bandText, opacity: 0.75 }}
                    />
                  ) : item.kind === "block" && item.block.kind === "divider" ? (
                    <div className="px-8 md:px-16">
                      <BlockRenderer block={item.block} ws={ws} isAr={isAr} />
                    </div>
                  ) : (
                    <Band
                      id={item.id}
                      index={sectionIndex(item.id)}
                      title={label}
                      bandText={bandText}
                      isAr={isAr}
                      sections={sections}
                      scrollTo={scrollTo}
                    >
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

        {!activePage && <ResourcesSection ws={ws} attachedSlots={attachedSlots} isAr={isAr} onDownloadLogo={() => setDownloadOpen(true)} />}
        {!activePage && <Footer ws={ws} isAr={isAr} />}

        {showMarkyosBadge && (
          <div className="pb-6 pt-2 flex justify-center">
            <span className="text-[11px]" style={{ color: "var(--g-text-faint)" }}>{isAr ? "دليل الهوية مقدَّم عبر ماركيوس" : "Guideline delivered with Markyos"}</span>
          </div>
        )}
      </div>

      {downloadOpen && <DownloadPanel workspace={ws} onClose={() => setDownloadOpen(false)} />}

      <style jsx global>{`
        .atlas-overview h2 { margin: 0 0 14px; font-family: var(--font-display); font-size: 24px; font-weight: 600; line-height: 1.2; }
        .atlas-overview p { margin: 0 0 16px; font-size: 16px; line-height: 1.7; color: var(--g-text-muted); }
        .atlas-overview blockquote { margin: 0 0 16px; padding: 16px 20px; border-inline-start: 2px solid var(--g-accent); background: var(--g-surface-1); border-start-start-radius: 0; border-end-start-radius: 0; border-start-end-radius: 10px; border-end-end-radius: 10px; }
      `}</style>
    </div>
    </SectionNoteProvider>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-2 md:gap-6 items-start">
      <span className="text-[12px] font-semibold uppercase pt-1" style={{ letterSpacing: ".08em", color: "var(--g-text-faint)" }}>{label}</span>
      {children}
    </div>
  );
}

function Band({
  id,
  index,
  title,
  bandText,
  isAr,
  sections,
  scrollTo,
  children,
}: {
  id: string;
  index: number;
  title: string;
  bandText: string;
  isAr: boolean;
  sections: TemplateProps["sections"];
  scrollTo: TemplateProps["scrollTo"];
  children: ReactNode;
}) {
  const pos = sections.findIndex((s) => s.id === id);
  const prev = pos > 0 ? sections[pos - 1] : null;
  const next = pos !== -1 && pos < sections.length - 1 ? sections[pos + 1] : null;

  return (
    <div id={id} className="scroll-mt-0 flex flex-col">
      {/* The band bleeds to the edge of the screen but its contents sit on the
          same measure as the body below. Pinning the chapter numeral to the
          viewport instead stranded it half a screen away from the title it
          belongs to, which read as two unrelated things rather than one
          chapter opener. */}
      <div className="relative overflow-hidden px-8 md:px-16 py-10" style={{ background: "var(--g-accent)" }}>
        <div className="relative max-w-[980px] flex items-center min-h-[52px]">
          <span
            className="absolute -top-8 select-none pointer-events-none font-semibold"
            style={{ [isAr ? "left" : "right"]: 0, fontFamily: "var(--font-display)", fontSize: 130, color: bandText, opacity: 0.16, lineHeight: 1 }}
          >
            {String(index).padStart(2, "0")}
          </span>
          <SectionHeading
            sectionId={id}
            value={title}
            className="relative text-[30px] font-semibold tracking-tight"
            style={{ fontFamily: "var(--font-display)", color: bandText }}
          />
        </div>
      </div>
      <div className="px-8 md:px-16 py-10 flex flex-col gap-5 max-w-[980px]">
        <SectionNote sectionId={id} className="text-[16px] leading-[1.7]" style={{ color: "var(--g-text-muted)" }} />
        {children}
      </div>
      {(prev || next) && (
        <div className="px-8 md:px-16 pb-10 flex items-center justify-between max-w-[980px]" style={{ boxShadow: "inset 0 1px 0 var(--g-hairline)", paddingTop: 20 }}>
          {prev ? (
            <button type="button" onClick={() => scrollTo(prev.id)} className="text-[12px] font-medium cursor-pointer flex items-center gap-1.5" style={{ color: "var(--g-text-faint)" }}>
              <Icon name={isAr ? "arrow-right" : "arrow-left"} size={11} />
              {isAr ? prev.arLabel : prev.label}
            </button>
          ) : <span />}
          {next && (
            <button type="button" onClick={() => scrollTo(next.id)} className="text-[12px] font-medium cursor-pointer flex items-center gap-1.5" style={{ color: "var(--g-text-faint)" }}>
              {isAr ? next.arLabel : next.label}
              <Icon name={isAr ? "arrow-left" : "arrow-right"} size={11} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/** Real HEX/RGB/CMYK values per swatch (same derivation the Color page
 *  already uses) — Cipherly documents 4 systems per color; PMS has no
 *  computable equivalent here, so it's left out rather than faked. */
function SwatchGrid({ colors, isAr }: { colors: TemplateProps["ws"]["colors"]; isAr: boolean }) {
  const { showToast } = useToast();

  async function copy(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      showToast(isAr ? `تم النسخ — ${value}` : `Copied — ${value}`, "success");
    } catch {
      // clipboard unavailable — value is already visible on screen
    }
  }

  return (
    <div className="grid md:grid-cols-2 gap-3">
      {colors.map((c) => {
        const rgb = hexToRgb(c.hex);
        const cmyk = rgb ? rgbToCmyk(rgb) : null;
        return (
          <div key={c.id} className="overflow-hidden flex" style={gCardSm}>
            <div className="w-[64px] shrink-0" style={{ background: c.hex }} />
            <div className="flex-1 min-w-0 p-3.5 grid grid-cols-[1fr_auto] gap-x-3 gap-y-1">
              <span className="col-span-2 font-semibold text-[13px] truncate">{c.name}</span>
              <button type="button" onClick={() => copy("HEX", c.hex.toUpperCase())} className="text-start text-[11px] cursor-pointer" style={{ fontFamily: "ui-monospace, Menlo, monospace", color: "var(--g-text-faint)" }}>
                HEX
              </button>
              <span className="text-[11px] text-end" style={{ fontFamily: "ui-monospace, Menlo, monospace", color: "var(--g-text-muted)" }}>{c.hex.toUpperCase()}</span>
              {rgb && (
                <>
                  <button type="button" onClick={() => copy("RGB", `${rgb.r}, ${rgb.g}, ${rgb.b}`)} className="text-start text-[11px] cursor-pointer" style={{ fontFamily: "ui-monospace, Menlo, monospace", color: "var(--g-text-faint)" }}>
                    RGB
                  </button>
                  <span className="text-[11px] text-end" style={{ fontFamily: "ui-monospace, Menlo, monospace", color: "var(--g-text-muted)" }}>{rgb.r}, {rgb.g}, {rgb.b}</span>
                </>
              )}
              {cmyk && (
                <>
                  <button type="button" onClick={() => copy("CMYK", `${cmyk.c}, ${cmyk.m}, ${cmyk.y}, ${cmyk.k}`)} className="text-start text-[11px] cursor-pointer" style={{ fontFamily: "ui-monospace, Menlo, monospace", color: "var(--g-text-faint)" }}>
                    CMYK
                  </button>
                  <span className="text-[11px] text-end" style={{ fontFamily: "ui-monospace, Menlo, monospace", color: "var(--g-text-muted)" }}>{cmyk.c}, {cmyk.m}, {cmyk.y}, {cmyk.k}</span>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Real per-category downloads — only rendered for categories that actually
 *  have files, and each links to the real asset rather than a fabricated
 *  bundle. Logo suite reuses the existing DownloadPanel (SVG/PNG/WebP export
 *  pipeline); the rest link straight to the uploaded files. */
function ResourcesSection({
  ws,
  attachedSlots,
  isAr,
  onDownloadLogo,
}: {
  ws: TemplateProps["ws"];
  attachedSlots: TemplateProps["attachedSlots"];
  isAr: boolean;
  onDownloadLogo: () => void;
}) {
  const fonts = ws.assets.filter((a) => a.type === "font");
  const images = ws.assets.filter((a) => a.type === "photo" || a.type === "graphic" || a.type === "illustration" || a.type === "pattern");
  const icons = ws.assets.filter((a) => a.type === "icon");

  if (attachedSlots.length === 0 && fonts.length === 0 && images.length === 0 && icons.length === 0) return null;

  return (
    <div id="resources" className="px-8 md:px-16 py-16 flex flex-col gap-6 scroll-mt-0 max-w-[980px]" style={{ boxShadow: "inset 0 1px 0 var(--g-hairline)" }}>
      <h2 className="text-[13px] font-semibold uppercase" style={{ letterSpacing: ".1em", color: "var(--g-text-faint)" }}>
        {isAr ? "الموارد" : "Resources"}
      </h2>
      <div className="grid md:grid-cols-2 gap-3">
        {attachedSlots.length > 0 && (
          <ResourceCard title={isAr ? "حزمة الشعار" : "Logo suite"} count={attachedSlots.length} action={{ label: isAr ? "تحميل" : "Download", onClick: onDownloadLogo }} />
        )}
        {fonts.length > 0 && <FileResourceCard title={isAr ? "الخطوط" : "Typefaces"} files={fonts} />}
        {images.length > 0 && <FileResourceCard title={isAr ? "الصور" : "Images"} files={images} />}
        {icons.length > 0 && <FileResourceCard title={isAr ? "الأيقونات" : "Icons"} files={icons} />}
      </div>
    </div>
  );
}

function ResourceCard({ title, count, action }: { title: string; count: number; action: { label: string; onClick: () => void } }) {
  return (
    <div className="p-4 flex flex-col gap-2.5" style={gCardSm}>
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-[13px]">{title}</span>
        <span className="text-[11px]" style={{ color: "var(--g-text-faint)" }}>{count}</span>
      </div>
      <button type="button" onClick={action.onClick} className="h-9 text-[12px] font-semibold cursor-pointer self-start px-4" style={{ ...gPill, background: "var(--g-text)", color: "var(--g-canvas)" }}>
        {action.label}
      </button>
    </div>
  );
}

function FileResourceCard({ title, files }: { title: string; files: Asset[] }) {
  return (
    <div className="p-4 flex flex-col gap-2.5" style={gCardSm}>
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-[13px]">{title}</span>
        <span className="text-[11px]" style={{ color: "var(--g-text-faint)" }}>{files.length}</span>
      </div>
      <div className="flex flex-col gap-1.5">
        {files.slice(0, 4).map((f) => (
          <a key={f.id} href={f.url} download={f.fileName} className="flex items-center gap-2 text-[12px] cursor-pointer" style={{ color: "var(--g-text-muted)" }}>
            <Icon name="download" size={11} style={{ color: "var(--g-text-faint)" }} />
            <span className="truncate flex-1">{f.fileName}</span>
            <span style={{ color: "var(--g-text-faint)" }}>{formatBytes(f.sizeKB)}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

/** Only what the studio actually gave this workspace: an owner email pulled
 *  from Team (never fabricated), and any socialLinks the studio added to a
 *  block — nothing invented. */
function Footer({ ws, isAr }: { ws: TemplateProps["ws"]; isAr: boolean }) {
  const contactEmail = ws.team.find((m) => m.role === "owner")?.email || ws.team[0]?.email;
  const allBlocks: PageBlock[] = [...ws.customBlocks, ...ws.pages.flatMap((p) => p.blocks)];
  const socials = allBlocks
    .filter((b) => b.kind === "socialLinks")
    .flatMap((b) => b.socialLinks ?? [])
    .filter((s) => s.url.trim().length > 0);

  return (
    <div className="px-8 md:px-16 py-14 flex flex-col gap-6 max-w-[980px]" style={{ boxShadow: "inset 0 1px 0 var(--g-hairline)" }}>
      <div>
        <div className="font-semibold text-[15px]" style={{ fontFamily: "var(--font-display)" }}>{isAr ? "دليل الهوية البصرية" : "Visual Identity Guidelines"}</div>
        <div className="text-[12px]" style={{ color: "var(--g-text-faint)" }}>{isAr ? "محدَّث" : "Updated"} {formatRelative(ws.updatedAt)}</div>
      </div>

      {contactEmail && (
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase" style={{ letterSpacing: ".08em", color: "var(--g-text-faint)" }}>{isAr ? "تواصل معنا" : "Get in touch"}</span>
          <a href={`mailto:${contactEmail}`} className="text-[14px]" style={{ color: "var(--g-accent)" }}>{contactEmail}</a>
        </div>
      )}

      {socials.length > 0 && (
        <div className="flex gap-4 flex-wrap">
          {socials.map((s) => (
            <a key={s.id} href={s.url} target="_blank" rel="noreferrer" className="text-[13px]" style={{ color: "var(--g-text-muted)" }}>
              {s.platform}
            </a>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-2" style={{ boxShadow: "inset 0 1px 0 var(--g-hairline)" }}>
        <span className="text-[12px]" style={{ color: "var(--g-text-faint)" }}>© {new Date().getFullYear()} {ws.name}</span>
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="text-[12px] font-medium cursor-pointer"
          style={{ color: "var(--g-text-faint)" }}
        >
          {isAr ? "العودة للأعلى ↑" : "Back to top ↑"}
        </button>
      </div>
    </div>
  );
}

StudioAtlas.displayName = "StudioAtlas";
