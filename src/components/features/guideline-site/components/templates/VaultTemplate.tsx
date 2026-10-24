"use client";

import Link from "next/link";
import { LangToggle } from "@/components/ui";
import { DownloadPanel } from "@/components/features/guideline-site/components/documents/DownloadPanel";
import { BlockRenderer } from "@/components/features/guideline-site/components/BlockRenderer";
import { BrandMark } from "@/components/ui/media";
import { navLogo, navMark } from "@/components/features/guideline-site/model/brandLogo";
import { FlowShell, InsertPoint, SectionHeading, SectionNote, SectionNoteProvider } from "@/components/features/guideline-site/components/LiveEdit";
import { FixedSectionBody, SignOffPanel, StatementBand } from "@/components/features/guideline-site/components/Content";
import { flowLabel, SectionTitles } from "@/components/features/guideline-site/components/flowHelpers";
import { themeCssVars } from "@/components/features/guideline-site/model/theme";
import { gBody, gHero, gLabel, gPill } from "@/components/features/guideline-site/components/surface";
import { TemplateProps } from "../types";
import { Fragment, ReactNode } from "react";

const TOP_NAV_IDS = ["logo", "color", "typography", "photography", "icons"];

/** Vault's own wording for the derived sections, until a studio renames one. */
const TITLES: SectionTitles = {
  overview: ["Overview", "نظرة عامة"],
  statement: ["Statement", "العبارة"],
  strategy: ["Strategy", "الاستراتيجية"],
  logo: ["Logo system", "الشعار"],
  misuse: ["Misuse", "استخدامات خاطئة"],
  "app-icon": ["App icon", "أيقونة التطبيق"],
  color: ["Color", "الألوان"],
  typography: ["Typography", "الخطوط"],
  mockups: ["The brand in use", "الهوية في التطبيق"],
  photography: ["Photography", "التصوير"],
  patterns: ["Pattern", "النقوش"],
  icons: ["Icons", "الأيقونات"],
  social: ["Social", "التواصل الاجتماعي"],
  personas: ["Personas", "الشخصيات المستهدفة"],
  voice: ["Voice & tone", "الصوت والنبرة"],
  departments: ["Departments", "أقسام الشركة"],
};

export function VaultTemplate(props: TemplateProps) {
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
  const heroMarkUrl = mark.src;
  const topNav = sections.filter((s) => TOP_NAV_IDS.includes(s.id));
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
      <div className="h-16 shrink-0 flex items-center justify-between px-8 gap-6" style={{ boxShadow: "inset 0 -1px 0 var(--g-hairline)" }}>
        <div className="flex items-center gap-2.5 shrink-0 min-w-0">
          {logo.isLockup ? (
            /* The lockup already says the brand's name, so it stands alone. */
            <BrandMark src={logo.src} lightSrc={logo.lightSrc} alt={ws.name} onDark={!theme.isLight} style={{ maxHeight: 26, maxWidth: 190 }} />
          ) : (
            <>
              <span className="w-8 h-8 grid place-items-center font-semibold text-[13px] overflow-hidden shrink-0" style={{ ...gPill, background: "var(--g-surface-2)" }}>
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
        {(topNav.length > 0 || pages.length > 0 || activePage) && (
          <nav className="hidden lg:flex items-center gap-1 min-w-0">
            {activePage && (
              <Link
                href={`/v/${ws.slug}`}
                className="h-8 px-3.5 text-[12.5px] font-medium cursor-pointer transition-colors whitespace-nowrap flex items-center"
                style={{ ...gPill, color: "var(--g-text-faint)" }}
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
                  className="h-8 px-3.5 text-[12.5px] font-medium cursor-pointer transition-colors whitespace-nowrap"
                  style={{ ...gPill, background: active ? "var(--g-surface-1)" : "transparent", color: active ? "var(--g-text)" : "var(--g-text-faint)" }}
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
                  className="h-8 px-3.5 text-[12.5px] font-medium cursor-pointer transition-colors whitespace-nowrap flex items-center"
                  style={{ ...gPill, background: active ? "var(--g-surface-1)" : "transparent", color: active ? "var(--g-text)" : "var(--g-text-faint)" }}
                >
                  {isAr ? p.arName : p.name}
                </Link>
              );
            })}
          </nav>
        )}
        <div className="flex items-center gap-3 shrink-0">
          <LangToggle value={previewLang} onChange={setPreviewLang} size="sm" />
        </div>
      </div>

      <div className="flex-1 flex max-w-[1120px] w-full mx-auto px-8 py-10 gap-12">
        <nav className="w-[180px] shrink-0 hidden md:block">
          <div className="sticky top-10 flex flex-col gap-0.5">
            <div className="px-3 pb-2.5" style={{ ...gLabel, color: "var(--g-text-faint)" }}>
              {isAr ? "المحتويات" : "Contents"}
            </div>
            {sections.map((s, i) => {
              const active = activeId === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => scrollTo(s.id)}
                  className="flex items-center gap-2.5 text-start px-3 py-2 text-[13px] cursor-pointer transition-colors"
                  style={{
                    borderRadius: "var(--g-radius-md)",
                    background: active ? "var(--g-surface-1)" : "transparent",
                    color: active ? "var(--g-text)" : "var(--g-text-faint)",
                    fontWeight: active ? 600 : 400,
                    boxShadow: active ? "inset 2px 0 0 var(--g-accent)" : "none",
                  }}
                >
                  <span className="shrink-0" style={{ fontFamily: "ui-monospace, Menlo, monospace", fontSize: 10, color: active ? "var(--g-accent)" : "var(--g-text-faint)" }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="truncate">{isAr ? s.arLabel : s.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        <div className="flex-1 min-w-0 flex flex-col pb-[70vh]" style={{ gap: "var(--g-rhythm)" }}>
          {activePage && (
            <h1 dir="auto" className="bidi-auto" style={gHero}>
              {isAr ? activePage.arName : activePage.name}
            </h1>
          )}

          {flow.map((item, i) => {
            const label = flowLabel(item, sectionTitle, TITLES, isAr, i);
            return (
              <Fragment key={item.id}>
                <FlowShell flowId={item.id} kind={item.kind} label={label} style={item.style} accent={theme.accent}>
                  {item.id === "overview" ? (
                    <div id="overview" className="flex flex-col gap-5 scroll-mt-10">
                      <div className="flex items-center gap-3">
                        <span className="w-11 h-11 grid place-items-center font-semibold text-[15px] shrink-0 overflow-hidden" style={{ ...gPill, background: "var(--g-surface-1)" }}>
                          {heroMarkUrl ? (
                            <BrandMark src={heroMarkUrl} lightSrc={mark.lightSrc} alt={ws.name} onDark={!theme.isLight} style={{ maxWidth: 24, maxHeight: 24 }} />
                          ) : (
                            ws.initials
                          )}
                        </span>
                        <SectionHeading
                          sectionId="overview-eyebrow"
                          as="span"
                          value={sectionTitle("overview-eyebrow", ws.name)}
                          style={{ ...gLabel, color: "var(--g-text-faint)" }}
                        />
                      </div>
                      {/* The headline is stored against its own id, not the
                          section's: the section id is what the contents list
                          and the page order are keyed on, so writing a whole
                          sentence of headline into it would retitle the
                          contents entry to that sentence. */}
                      <SectionHeading
                        sectionId="overview-title"
                        value={heroTitle}
                        className="bidi-auto"
                        style={gHero}
                      />
                      <SectionNote
                        sectionId="overview"
                        placeholder={isAr ? "أضف سطرًا تمهيديًا" : "Add an opening line"}
                        className="max-w-[62ch]"
                        style={gBody}
                      />
                      {ws.overviewHtml && (
                        <div dir="auto" className="bidi-auto vault-overview" dangerouslySetInnerHTML={{ __html: ws.overviewHtml }} />
                      )}
                      <SignOffPanel ws={ws} section="overview" isAr={isAr} />
                    </div>
                  ) : item.id === "statement" ? (
                    <StatementBand
                      text={statementText}
                      isAr={isAr}
                      className="-mx-8 md:mx-0 px-8 py-10"
                      style={{ background: "var(--g-accent)", borderRadius: "var(--g-radius-lg)" }}
                      textClassName="bidi-auto text-[22px] md:text-[26px] font-semibold leading-[1.4] max-w-[52ch]"
                      // Solved against the accent rather than assumed: a pale
                      // brand colour needs dark type here, a deep one needs light.
                      textStyle={{ fontFamily: "var(--font-display)", color: "var(--g-accent-ink)" }}
                      noteStyle={{ color: "var(--g-accent-ink)", opacity: 0.75 }}
                    />
                  ) : item.kind === "block" && item.block.kind === "divider" ? (
                    <BlockRenderer block={item.block} ws={ws} isAr={isAr} />
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
                <InsertPoint afterId={item.id} isAr={isAr} after={label} />
              </Fragment>
            );
          })}
        </div>
      </div>

      {attachedSlots.length > 0 && (
        <button
          type="button"
          onClick={() => setDownloadOpen(true)}
          className="fixed bottom-6 h-11 px-5 text-[13px] font-semibold cursor-pointer z-sticky shadow-lg"
          // Was a fixed white pill with near-black type — Markyos's own button,
          // not the brand's, on every client site regardless of palette.
          style={{ ...gPill, [isAr ? "left" : "right"]: 24, background: "var(--g-accent)", color: "var(--g-accent-ink)" }}
        >
          {isAr ? "تحميل الأصول" : "Download assets"}
        </button>
      )}

      {showMarkyosBadge && (
        <div className="pb-6 pt-2 flex justify-center">
          <span className="text-[11px]" style={{ color: "var(--g-text-faint)" }}>{isAr ? "دليل الهوية مقدَّم عبر ماركيوس" : "Guideline delivered with Markyos"}</span>
        </div>
      )}

      {downloadOpen && <DownloadPanel workspace={ws} onClose={() => setDownloadOpen(false)} />}

      <style jsx global>{`
        .vault-overview h2 { margin: 0 0 14px; font-family: var(--font-display); font-size: var(--g-section-size); font-weight: var(--g-hero-weight); line-height: 1.2; letter-spacing: var(--g-hero-tracking); }
        .vault-overview p { margin: 0 0 16px; font-size: var(--g-body-size); line-height: var(--g-lead); color: var(--g-text-muted); }
        .vault-overview blockquote { margin: 0 0 16px; padding: 16px 20px; border-inline-start: 2px solid var(--g-accent); background: var(--g-surface-1); border-radius: 0 var(--g-radius-md) var(--g-radius-md) 0; font-size: var(--g-body-size); line-height: var(--g-lead); color: var(--g-text-muted); }
      `}</style>
    </div>
    </SectionNoteProvider>
  );
}

function Section({ id, index, title, children }: { id: string; index: number; title: string; children: ReactNode }) {
  return (
    <div id={id} className="flex flex-col gap-5 scroll-mt-10">
      <div className="flex items-baseline gap-3 pb-3.5" style={{ borderBottom: "1px solid var(--g-hairline)" }}>
        <span className="text-[12px] font-semibold shrink-0" style={{ fontFamily: "ui-monospace, Menlo, monospace", color: "var(--g-accent)" }}>
          {String(index).padStart(2, "0")}
        </span>
        <SectionHeading
          sectionId={id}
          value={title}
          style={{ ...gLabel, color: "var(--g-text-faint)" }}
        />
      </div>
      <SectionNote sectionId={id} className="max-w-[62ch] -mt-1" style={gBody} />
      {children}
    </div>
  );
}

VaultTemplate.displayName = "VaultTemplate";
