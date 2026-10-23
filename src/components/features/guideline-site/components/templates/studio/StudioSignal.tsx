"use client";

// "Signal" — modeled closely on the Vaultx brand-guidelines microsite: a
// single continuous dark scroll (no permanent sidebar), a sticky header
// whose hamburger button opens a dropdown of jump links, numbered chapters
// that each open with a two-line display headline (word 1 accent, word 2
// text), a full-bleed accent banner, a persistent floating download CTA,
// and — the two sections most templates skip — a real Design System / UI
// kit showcase (buttons, badges, inputs, cards) and a Logo Application
// chapter (app-icon sizes, social mockups), both rendered in the brand's
// own theme colors rather than static reference art.

import { Fragment, ReactNode, useState } from "react";
import Link from "next/link";
import { Icon, LangToggle } from "@/components/ui";
import { DownloadPanel } from "@/components/features/guideline-site/components/documents/DownloadPanel";
import { BlockRenderer } from "@/components/features/guideline-site/components/BlockRenderer";
import { BrandMark } from "@/components/ui/media/BrandMark/BrandMark";
import { navLogo } from "@/components/features/guideline-site/model/brandLogo";
import { FlowShell, InsertPoint, SectionHeading, SectionNote, SectionNoteProvider } from "@/components/features/guideline-site/components/LiveEdit";
import { FixedSectionBody, SignOffPanel, StatementBand } from "@/components/features/guideline-site/components/Content";
import { flowLabel, SectionTitles } from "@/components/features/guideline-site/components/flowHelpers";
import { themeCssVars } from "@/components/features/guideline-site/model/theme";
import { gBody, gCard, gCardSm, gLabel, gPill, gSectionTitle } from "@/components/features/guideline-site/components/surface";
import { FlowItem, TemplateProps } from "../../types";

/** Signal's own wording for the derived sections, until a studio renames one. */
const TITLES: SectionTitles = {
  overview: ["Overview", "نظرة عامة"],
  statement: ["Statement", "العبارة"],
  strategy: ["Strategy", "الاستراتيجية"],
  logo: ["Logo & Symbol", "الشعار والرمز"],
  misuse: ["Misuse", "استخدامات خاطئة"],
  "app-icon": ["App Icon", "أيقونة التطبيق"],
  color: ["Color Palette", "لوحة الألوان"],
  typography: ["Typography", "الخطوط"],
  mockups: ["In Use", "التطبيقات"],
  photography: ["Photography", "التصوير"],
  patterns: ["Pattern", "النقوش"],
  icons: ["Iconography", "الأيقونات"],
  social: ["Social Media", "وسائل التواصل"],
  personas: ["Personas", "الشخصيات"],
  voice: ["Voice & Tone", "الصوت والنبرة"],
  departments: ["Departments", "أقسام الشركة"],
};

type ChapterKey = "foundation" | "visual" | "departments" | "more";

/**
 * Which chapter a section belongs under.
 *
 * Signal's character is that it reads as a numbered document with chapters,
 * not a flat scroll — so the grouping stays, but it is now applied to the
 * page's actual order rather than baked into the markup. A chapter opens
 * wherever its first member has been placed and closes when the next section
 * belongs somewhere else, which means a studio that interleaves its own
 * sections gets the chapters it arranged instead of having its order undone.
 */
function chapterOf(id: string): ChapterKey {
  if (id === "strategy" || id === "personas" || id === "voice") return "foundation";
  if (
    id === "logo" ||
    id === "misuse" ||
    id === "app-icon" ||
    id === "color" ||
    id === "typography" ||
    id === "photography" ||
    id === "patterns" ||
    id === "icons" ||
    id === "social" ||
    id === "mockups"
  )
    return "visual";
  if (id === "departments") return "departments";
  return "more";
}

const CHAPTER_META: Record<ChapterKey, { words: [string, string]; arWords: [string, string]; hint: string; arHint: string }> = {
  foundation: {
    words: ["Brand", "Foundation"],
    arWords: ["أساس", "الهوية"],
    hint: "The beliefs, values, and personality traits that define who this brand is at its core.",
    arHint: "المعتقدات والقيم وسمات الشخصية التي تحدد جوهر هذه العلامة.",
  },
  visual: {
    words: ["Visual", "Identity"],
    arWords: ["الهوية", "البصرية"],
    hint: "The logo, palette, type, and icon system — always the live, current version.",
    arHint: "الشعار والألوان والخطوط والأيقونات — بصيغتها الحية الحالية.",
  },
  departments: {
    words: ["Company", "Departments"],
    arWords: ["أقسام", "الشركة"],
    hint: "How each department applies this brand in the work it actually does.",
    arHint: "كيف يطبّق كل قسم هذه الهوية في عمله اليومي.",
  },
  more: { words: ["More", "Sections"], arWords: ["أقسام", "إضافية"], hint: "", arHint: "" },
};

/** Signal's own showcase panels, which are built from the theme rather than
 *  from a section of brand data and so sit outside the reorderable flow. */
const DS_TITLES: Record<string, [string, string]> = {
  "ds-buttons": ["Buttons", "الأزرار"],
  "ds-badges": ["Badges", "الشارات"],
  "ds-inputs": ["Inputs", "الحقول"],
  "ds-cards": ["Cards", "البطاقات"],
};

/**
 * Signal's headline treatment: the first word in the brand accent.
 *
 * Supplied to the editable heading as a matched pair so the canvas shows the
 * same two-tone headline the client gets. The markup's text content is exactly
 * the stored value — that is what gets read back when the studio finishes
 * typing, so any extra characters here would end up saved into the headline.
 */
const TWO_TONE = {
  html: (value: string) => {
    const [first, ...restWords] = value.split(" ");
    const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const rest = restWords.join(" ");
    return `<span style="color:var(--g-accent)">${esc(first)}</span>${rest ? `<span> ${esc(rest)}</span>` : ""}`;
  },
  node: (value: string) => {
    const [first, ...restWords] = value.split(" ");
    const rest = restWords.join(" ");
    return (
      <>
        <span style={{ color: "var(--g-accent)" }}>{first}</span>
        {rest && <span> {rest}</span>}
      </>
    );
  },
};

/** Consecutive flow items that share a chapter, in page order. */
function chapterRuns(flow: FlowItem[]): { chapter: ChapterKey; items: FlowItem[] }[] {
  const runs: { chapter: ChapterKey; items: FlowItem[] }[] = [];
  for (const item of flow) {
    const chapter = chapterOf(item.id);
    const last = runs[runs.length - 1];
    if (last && last.chapter === chapter) last.items.push(item);
    else runs.push({ chapter, items: [item] });
  }
  return runs;
}

export function StudioSignal(props: TemplateProps) {
  const {
    ws,
    isAr,
    theme,
    sections,
    activeId,
    scrollTo,
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

  const [menuOpen, setMenuOpen] = useState(false);
  const heroTitle = sectionTitle("overview-title", ws.strategy.purpose || (isAr ? "دليل الهوية" : "Brand guideline"));
  const navLogoArt = navLogo(ws, isAr);
  const fixedCtx = { ws, isAr, onDark: !theme.isLight, attachedSlots, photoAssets, iconAssets, mockupAssets, publishedDepartments };
  const runs = chapterRuns(flow);
  // The Design System chapter is Signal's own — built from the theme rather
  // than from a section of brand data — so it is not part of the reorderable
  // flow and follows it. Numbering continues from whatever the studio arranged
  // above.
  const extraChapterBase = runs.length;

  return (
    <SectionNoteProvider lookup={sectionNote}>
    <div
      dir={isAr ? "rtl" : "ltr"}
      className="min-h-screen"
      data-guideline-surface=""
      style={{ ...themeCssVars(theme), background: "var(--g-canvas)", color: "var(--g-text)", fontFamily: isAr ? "var(--font-arabic)" : "var(--font-sans)" }}
    >
      <div className="sticky top-0 z-40 h-16 flex items-center justify-between px-6 md:px-10" style={{ background: "var(--g-canvas)", boxShadow: "inset 0 -1px 0 var(--g-hairline)" }}>
        <span className="flex items-center gap-2.5 min-w-0">
          {navLogoArt.isLockup ? (
            <BrandMark
              src={navLogoArt.src}
              lightSrc={navLogoArt.lightSrc}
              alt={ws.name}
              onDark={!theme.isLight}
              style={{ maxHeight: 28, maxWidth: 200 }}
            />
          ) : (
            <>
              {navLogoArt.src && (
                <BrandMark
                  src={navLogoArt.src}
                  lightSrc={navLogoArt.lightSrc}
                  alt={ws.name}
                  onDark={!theme.isLight}
                  style={{ maxWidth: 24, maxHeight: 24, flexShrink: 0 }}
                />
              )}
              <span className="font-semibold text-[15px] truncate" style={{ fontFamily: "var(--font-display)" }}>{ws.name}</span>
            </>
          )}
        </span>
        <div className="flex items-center gap-3">
          <LangToggle value={previewLang} onChange={setPreviewLang} size="sm" />
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Menu"
            aria-expanded={menuOpen}
            className="w-9 h-9 grid place-items-center cursor-pointer"
            style={{ ...gPill, background: "var(--g-surface-1)" }}
          >
            <Icon name={menuOpen ? "times" : "bars"} size={15} />
          </button>
        </div>

        {menuOpen && (
          <div
            className="absolute top-[72px] w-[260px] p-2 flex flex-col gap-0.5 z-50"
            style={{ [isAr ? "left" : "right"]: 16, borderRadius: "var(--g-radius-lg)", background: "var(--g-surface-1)", boxShadow: "0 12px 40px rgba(0,0,0,.5)" }}
          >
            {activePage && (
              <Link
                href={`/v/${ws.slug}`}
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-between px-3.5 py-2.5 text-[13px] cursor-pointer"
                style={{ borderRadius: "var(--g-radius-md)", color: "var(--g-text-faint)" }}
              >
                {isAr ? "الرئيسية" : "Home"}
                <Icon name="external-link-alt" size={11} />
              </Link>
            )}
            {sections.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  scrollTo(s.id);
                  setMenuOpen(false);
                }}
                className="flex items-center justify-between px-3.5 py-2.5 text-[13px] text-start cursor-pointer"
                style={{ borderRadius: "var(--g-radius-md)", background: activeId === s.id ? "var(--g-surface-2)" : "transparent", color: activeId === s.id ? "var(--g-text)" : "var(--g-text-faint)" }}
              >
                {isAr ? s.arLabel : s.label}
                <Icon name="external-link-alt" size={11} />
              </button>
            ))}
            {pages.map((p) => (
              <Link
                key={p.id}
                href={`/v/${ws.slug}/p/${p.slug}`}
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-between px-3.5 py-2.5 text-[13px] cursor-pointer"
                style={{ borderRadius: "var(--g-radius-md)", color: activePage?.id === p.id ? "var(--g-text)" : "var(--g-text-faint)" }}
              >
                {isAr ? p.arName : p.name}
                <Icon name="external-link-alt" size={11} />
              </Link>
            ))}
          </div>
        )}
      </div>

      {activePage && (
        <div className="min-h-[56vh] flex flex-col items-center justify-center text-center px-8 gap-5">
          <h1 dir="auto" className="bidi-auto font-semibold tracking-tight leading-[0.98]" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(38px, 8vw, 92px)" }}>
            {isAr ? activePage.arName : activePage.name}
          </h1>
        </div>
      )}

      {runs.map((run, runIndex) => {
        const meta = CHAPTER_META[run.chapter];
        const code = String(runIndex + 1).padStart(2, "0");
        const chapterLabel = (isAr ? meta.arWords : meta.words).join(" ");
        return (
          <Chapter
            key={`${run.chapter}-${run.items[0].id}`}
            id={`chapter-${run.chapter}-${runIndex}`}
            code={code}
            words={isAr ? meta.arWords : meta.words}
            description={isAr ? meta.arHint : meta.hint}
          >
            {run.items.map((item, i) => {
              const label = flowLabel(item, sectionTitle, TITLES, isAr, i);
              return (
                <Fragment key={item.id}>
                  <FlowShell flowId={item.id} kind={item.kind} label={label} style={item.style} accent={theme.accent}>
                    {item.id === "overview" ? (
                      <div id="overview" className="min-h-[56vh] flex flex-col items-center justify-center text-center px-8 gap-5 scroll-mt-0">
                        <SectionHeading
                          sectionId="overview-eyebrow"
                          as="span"
                          value={sectionTitle("overview-eyebrow", isAr ? "دليل الهوية" : "Brand guideline")}
                          className="px-3 py-1.5"
                          style={{ ...gLabel, ...gPill, background: "var(--g-surface-1)", color: "var(--g-text-faint)", fontFamily: "ui-monospace, Menlo, monospace" }}
                        />
                        <SectionHeading
                          sectionId="overview-title"
                          value={heroTitle}
                          className="bidi-auto font-semibold tracking-tight leading-[0.98]"
                          style={{ fontFamily: "var(--font-display)", fontSize: "clamp(38px, 8vw, 92px)" }}
                          render={TWO_TONE}
                        />
                        <SectionNote
                          sectionId="overview"
                          placeholder={isAr ? "أضف سطرًا تمهيديًا" : "Add an opening line"}
                          className="text-[15px] leading-[1.7] max-w-[640px]"
                          style={{ color: "var(--g-text-muted)" }}
                        />
                        {ws.overviewHtml && (
                          <div dir="auto" className="bidi-auto signal-overview max-w-[640px]" dangerouslySetInnerHTML={{ __html: ws.overviewHtml }} />
                        )}
                        <SignOffPanel ws={ws} section="overview" isAr={isAr} />
                      </div>
                    ) : item.id === "statement" ? (
                      <StatementBand
                        text={statementText}
                        isAr={isAr}
                        className="py-14 px-8"
                        style={{ background: "var(--g-accent)" }}
                        textClassName="bidi-auto max-w-[760px] mx-auto text-[20px] md:text-[26px] font-semibold leading-[1.4] text-center"
                        // Solved against the accent this band is filled with,
                        // rather than against the page ground — a different
                        // colour, and the wrong question to ask here.
                        textStyle={{ fontFamily: "var(--font-display)", color: "var(--g-accent-ink)" }}
                        noteStyle={{ color: "var(--g-accent-ink)", opacity: 0.75, textAlign: "center" }}
                      />
                    ) : item.kind === "block" && item.block.kind === "divider" ? (
                      <BlockRenderer block={item.block} ws={ws} isAr={isAr} />
                    ) : (
                      <Panel id={item.id} chapter={code} item={i + 1} chapterLabel={chapterLabel} title={label}>
                        {item.kind === "block" ? (
                          <BlockRenderer block={item.block} ws={ws} isAr={isAr} />
                        ) : (
                          <FixedSectionBody id={item.id} ctx={fixedCtx} />
                        )}
                      </Panel>
                    )}
                  </FlowShell>
                  <InsertPoint afterId={item.id} isAr={isAr} after={label} />
                </Fragment>
              );
            })}
          </Chapter>
        );
      })}

      {!activePage && (
        <Chapter
          id="chapter-ds"
          code={String(extraChapterBase + 1).padStart(2, "0")}
          words={isAr ? ["نظام", "التصميم"] : ["Design", "System"]}
          description={isAr ? "المكوّنات القابلة لإعادة الاستخدام — بألوان هذه العلامة وخطوطها فعليًا." : "The reusable components, rendered in this brand's own colors and type — not a generic kit."}
        >
          {(["ds-buttons", "ds-badges", "ds-inputs", "ds-cards"] as const).map((id, i) => (
            <Panel
              key={id}
              id={id}
              chapter={String(extraChapterBase + 1).padStart(2, "0")}
              item={i + 1}
              chapterLabel={isAr ? "نظام التصميم" : "Design System"}
              title={sectionTitle(id, DS_TITLES[id][isAr ? 1 : 0])}
            >
              {id === "ds-buttons" ? (
                <ButtonKit theme={theme} isAr={isAr} />
              ) : id === "ds-badges" ? (
                <BadgeKit isAr={isAr} />
              ) : id === "ds-inputs" ? (
                <InputKit isAr={isAr} />
              ) : (
                <CardKit ws={ws} theme={theme} isAr={isAr} />
              )}
            </Panel>
          ))}
        </Chapter>
      )}

      {/* App Icon and Social Media used to be pinned here as a chapter of
          Signal's own. They are real sections of the flow now — drawn from the
          brand's mark and the studio's own social links, available in every
          template, and movable like anything else on the page. */}

      <div className="h-[24vh]" />

      {showMarkyosBadge && (
        <div className="pb-6 pt-2 flex justify-center">
          <span className="text-[11px]" style={{ color: "var(--g-text-faint)" }}>{isAr ? "دليل الهوية مقدَّم عبر ماركيوس" : "Guideline delivered with Markyos"}</span>
        </div>
      )}

      {attachedSlots.length > 0 && (
        <button
          type="button"
          onClick={() => setDownloadOpen(true)}
          className="fixed bottom-6 h-11 px-5 text-[13px] font-semibold cursor-pointer z-40 shadow-lg"
          // Was a fixed white pill — Markyos's button, not the brand's.
          style={{ ...gPill, [isAr ? "left" : "right"]: 24, background: "var(--g-accent)", color: "var(--g-accent-ink)" }}
        >
          {isAr ? "تحميل حزمة الهوية" : "Download brand kit"}
        </button>
      )}

      {downloadOpen && <DownloadPanel workspace={ws} onClose={() => setDownloadOpen(false)} />}

      <style jsx global>{`
        .signal-overview h2 { margin: 0 0 14px; font-family: var(--font-display); font-size: var(--g-section-size); font-weight: var(--g-hero-weight); }
        .signal-overview p { margin: 0 0 16px; font-size: var(--g-body-size); line-height: var(--g-lead); color: var(--g-text-muted); }
        .signal-overview blockquote { margin: 0 0 16px; padding: 14px 18px; border-inline-start: 2px solid var(--g-accent); background: var(--g-surface-1); border-radius: 0 var(--g-radius-md) var(--g-radius-md) 0; text-align: start; }
      `}</style>
    </div>
    </SectionNoteProvider>
  );
}

function Chapter({
  id,
  code,
  words,
  description,
  children,
}: {
  id: string;
  code: string;
  words: string[];
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col">
      {words.length > 0 && (
        <div className="px-8 md:px-16 pt-20 pb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4" style={{ boxShadow: "inset 0 1px 0 var(--g-hairline)" }}>
          <div className="flex items-start gap-4">
            <span className="text-[13px] font-semibold mt-2" style={{ fontFamily: "ui-monospace, Menlo, monospace", color: "var(--g-text-faint)" }}>{code}</span>
            {/*
              A chapter headline is two deliberately separate lines in this
              design — the first in the accent color, the second in text — so
              each line is its own editable field. Editing them as one string
              would mean guessing where to break it back apart.
            */}
            <h2 className="font-semibold tracking-tight leading-[0.95]" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(30px, 5vw, 56px)" }}>
              <SectionHeading as="span" sectionId={`${id}.0`} value={words[0]} style={{ color: "var(--g-accent)" }} />
              <br />
              <SectionHeading as="span" sectionId={`${id}.1`} value={words[1]} />
            </h2>
          </div>
          {description && (
            <p className="max-w-[36ch] text-[13px] md:text-end" style={{ color: "var(--g-text-faint)" }}>{description}</p>
          )}
        </div>
      )}
      <div className="flex flex-col gap-10 px-8 md:px-16 py-10 max-w-[900px] mx-auto w-full">{children}</div>
    </div>
  );
}

function Panel({
  id,
  chapter,
  item,
  chapterLabel,
  title,
  children,
}: {
  id: string;
  chapter: string;
  item: number;
  chapterLabel: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div id={id} className="p-6 md:p-8 flex flex-col gap-5 scroll-mt-20" style={{ ...gCard, background: "var(--g-surface-1)" }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-2 min-w-0">
          <SectionHeading as="h3" sectionId={id} value={title} style={gSectionTitle} />
          <SectionNote sectionId={id} style={gBody} />
        </div>
        <span
          className="shrink-0 text-end"
          style={{ ...gLabel, fontFamily: "ui-monospace, Menlo, monospace", color: "var(--g-text-faint)" }}
        >
          {chapterLabel}
          <br />
          {chapter}.{item}
        </span>
      </div>
      {children}
    </div>
  );
}

// ---- Design System / UI kit — a real showcase of this brand's colors and
// type applied to common components, not a generic reference kit. ----

function ButtonKit({ theme, isAr }: { theme: TemplateProps["theme"]; isAr: boolean }) {
  const label = isAr ? "دعوة أساسية" : "Primary CTA";
  // The kit demonstrates this brand's components, so it follows the template's
  // own corner language rather than a fixed pill.
  const base = "h-11 ps-5 pe-3 text-[13px] font-semibold flex items-center gap-2.5 justify-between";
  return (
    <div className="grid grid-cols-2 gap-3">
      <span className={base} style={{ ...gPill, background: theme.accent, color: "var(--g-accent-ink)" }}>
        {label}
        <ArrowDot bg="rgba(255,255,255,.25)" />
      </span>
      <span className={base} style={{ ...gPill, boxShadow: `inset 0 0 0 1.5px ${theme.accent}`, color: theme.accent }}>
        {label}
        <ArrowDot bg={theme.accentSoft} />
      </span>
      <span className={base} style={{ ...gPill, background: "var(--g-text)", color: "var(--g-canvas)" }}>
        {label}
        <ArrowDot bg="rgba(0,0,0,.15)" />
      </span>
      <span className={base} style={{ ...gPill, boxShadow: "inset 0 0 0 1.5px var(--g-hairline)", color: "var(--g-text)" }}>
        {label}
        <ArrowDot bg="var(--g-surface-2)" />
      </span>
    </div>
  );
}

function ArrowDot({ bg }: { bg: string }) {
  return (
    <span className="w-6 h-6 rounded-full grid place-items-center shrink-0" style={{ background: bg }}>
      <Icon name="arrow-right" size={11} />
    </span>
  );
}

function BadgeKit({ isAr }: { isAr: boolean }) {
  const badges = [
    { label: isAr ? "معتمد" : "Verified", dot: "#4EDD84", tint: "rgba(78,221,132,.14)" },
    { label: isAr ? "نشط" : "Active", dot: "var(--g-accent)", tint: "var(--g-accent-soft)" },
    { label: isAr ? "فشل" : "Failed", dot: "#F66485", tint: "rgba(246,100,133,.14)" },
    { label: isAr ? "قيد الانتظار" : "Pending", dot: "var(--g-text-faint)", tint: "var(--g-surface-2)" },
  ];
  return (
    <div className="flex flex-wrap gap-2.5">
      {badges.map((b) => (
        <span key={b.label} className="h-8 ps-2.5 pe-3.5 rounded-full text-[12px] font-semibold flex items-center gap-2" style={{ background: b.tint }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: b.dot }} />
          {b.label}
        </span>
      ))}
    </div>
  );
}

function InputKit({ isAr }: { isAr: boolean }) {
  const fields = [
    { label: isAr ? "اسم الحساب" : "Account Name", placeholder: isAr ? "اسمك" : "Your name", hint: isAr ? "يظهر هذا في الفواتير والمستندات." : "This appears on invoices and documents.", tone: "default" as const },
    { label: isAr ? "مفتاح API" : "API Key", placeholder: "sk_live_••••••••••••", hint: isAr ? "لا تشارك مفتاحك السري علنًا." : "Never share your secret key publicly.", tone: "focus" as const },
    { label: isAr ? "رقم التوجيه" : "Routing Number", placeholder: "02140", hint: isAr ? "يجب أن يتكون الرقم من 9 خانات بالضبط." : "Must be exactly 9 digits.", tone: "error" as const },
  ];
  return (
    <div className="grid md:grid-cols-3 gap-3">
      {fields.map((f) => (
        <div key={f.label} className="flex flex-col gap-1.5">
          <span className="text-[11px] font-medium uppercase" style={{ letterSpacing: ".06em", color: "var(--g-text-faint)" }}>{f.label}</span>
          <div
            className="h-10 px-3 flex items-center text-[13px]"
            style={{
              borderRadius: "var(--g-radius-md)",
              background: "var(--g-surface-2)",
              color: "var(--g-text-faint)",
              boxShadow:
                f.tone === "focus" ? "inset 0 0 0 1.5px var(--g-accent)" : f.tone === "error" ? "inset 0 0 0 1.5px #F66485" : "none",
            }}
          >
            {f.placeholder}
          </div>
          <span className="text-[11px]" style={{ color: f.tone === "error" ? "#F66485" : "var(--g-text-faint)" }}>{f.hint}</span>
        </div>
      ))}
    </div>
  );
}

function CardKit({ ws, theme, isAr }: { ws: TemplateProps["ws"]; theme: TemplateProps["theme"]; isAr: boolean }) {
  const assetCount = ws.assets.length;
  return (
    <div className="grid md:grid-cols-2 gap-3">
      <div className="p-4 flex flex-col gap-2.5" style={{ ...gCardSm, background: "var(--g-surface-2)" }}>
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-full grid place-items-center text-[12px] font-bold" style={{ background: theme.accent, color: "var(--g-accent-ink)" }}>#</span>
          <span className="text-[11px]" style={{ color: "var(--g-text-faint)" }}>{isAr ? "ملفات الهوية" : "Brand Files"}</span>
        </div>
        <span className="text-[30px] font-semibold" style={{ fontFamily: "var(--font-display)" }}>{assetCount}</span>
        <span className="text-[12px]" style={{ color: "var(--g-text-faint)" }}>{isAr ? "أصل مرفوع" : "assets uploaded"}</span>
      </div>
      <div className="p-4 flex flex-col gap-2.5" style={{ ...gCardSm, background: "var(--g-surface-2)" }}>
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-full grid place-items-center text-[12px] font-bold" style={{ background: theme.accent, color: "var(--g-accent-ink)" }}>%</span>
          <span className="text-[11px]" style={{ color: "var(--g-text-faint)" }}>{isAr ? "الألوان" : "Palette"}</span>
        </div>
        <span className="text-[30px] font-semibold" style={{ fontFamily: "var(--font-display)" }}>{ws.colors.length}</span>
        <span className="text-[12px]" style={{ color: "var(--g-text-faint)" }}>{isAr ? "لون معتمد" : "approved colors"}</span>
      </div>
    </div>
  );
}

StudioSignal.displayName = "StudioSignal";
