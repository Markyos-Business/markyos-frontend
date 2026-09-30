"use client";

// "Deck" — a presentation-format guideline, following the frame geometry of a
// 1920×1080 brand-guidelines deck: a full-bleed cover, a contents page,
// numbered chapter openers, and one numbered slide per topic on a rail +
// panel master.
//
// It is the only template here that is not a scrolling website. Everything is
// composed in absolute pixels on a 1920 grid and scaled as a whole, so what a
// client opens in the browser is the same artefact a studio would present on
// a screen — and the same thing, page for page, that a PDF export of it would
// be. Colours, type, logo and content all come from the workspace, so the
// deck documents the brand it belongs to rather than the deck it was modelled on.

import { ReactNode, useCallback, useEffect, useMemo } from "react";
import Link from "next/link";
import { LangToggle } from "@/components/LangToggle";
import { Icon } from "@/components/Icon";
import { DownloadPanel } from "@/components/workspace/logo/DownloadPanel";
import { BlockRenderer } from "@/components/workspace/BlockRenderer";
import { BrandMark } from "@/components/BrandMark";
import { markSources, navMark } from "@/lib/brandLogo";
import { SectionNoteProvider } from "@/components/workspace/guideline/LiveEdit";
import { PageBlock, SlotKind } from "@/lib/types";
import { isLightHex, themeCssVars } from "@/lib/theme";
import { TemplateProps } from "../types";
import { deckPalette, DeckPalette } from "./deck/deckTheme";
import {
  at,
  DetailSlide,
  GUTTER,
  GUTTER_WIDE,
  PANEL_H,
  PANEL_W,
  SectionOpenerSlide,
  Slide,
  SwatchCard,
  useDeckScale,
} from "./deck/DeckKit";

const SLOT_LABEL: Record<SlotKind, { en: string; ar: string }> = {
  symbol: { en: "Iconmark", ar: "الرمز" },
  latin: { en: "Latin wordmark", ar: "الشعار اللاتيني" },
  arabic: { en: "Arabic wordmark", ar: "الشعار العربي" },
};

export function DeckTemplate(props: TemplateProps) {
  const {
    ws,
    isAr,
    theme,
    sections,
    scrollTo,
    showSection,
    sectionTitle,
    sectionNote,
    attachedSlots,
    photoAssets,
    iconAssets,
    customBlocks,
    downloadOpen,
    setDownloadOpen,
    previewLang,
    setPreviewLang,
    showMarkyosBadge,
    pages,
    activePage,
  } = props;

  const pal = useMemo(() => deckPalette(ws, theme), [ws, theme]);
  const { ref, scale } = useDeckScale();

  const markArt = navMark(ws);
  const markUrl = markArt.src;
  // The deck prefers the Latin lockup where there is one — a wordmark reads at
  // slide scale in a way a bare symbol doesn't.
  const lockupArt = attachedSlots.includes("latin") ? markSources(ws.logo.latin) : markArt;
  const lockupUrl = lockupArt.src;

  // Which chapters actually have something to show. A deck with an empty
  // chapter opener leading to nothing is worse than no chapter at all.
  const hasIntro = !activePage && (!!ws.strategy.purpose || !!ws.strategy.mission || !!ws.strategy.vision || showSection("voice") || showSection("personas"));
  const hasLogo = showSection("logo");
  const hasColor = showSection("color");
  const hasType = showSection("typography");
  const hasVisuals = showSection("photography") || showSection("icons");

  /** Slides in order, so the counter and keyboard nav agree with what renders. */
  const slideIds = useMemo(() => {
    const ids: string[] = ["deck-cover"];
    if (!activePage && sections.length > 0) ids.push("deck-contents");
    if (hasIntro) {
      ids.push("deck-ch-intro");
      if (ws.strategy.purpose) ids.push("deck-purpose");
      if (ws.strategy.vision || ws.strategy.mission) ids.push("deck-vision");
      if (showSection("voice")) ids.push("voice");
      if (showSection("personas")) ids.push("personas");
    }
    if (hasLogo) {
      ids.push("deck-ch-logo", "logo");
      attachedSlots.slice(1).forEach((k) => ids.push(`deck-logo-${k}`));
      if (hasColor) ids.push("deck-logo-usage");
    }
    if (hasColor) ids.push("deck-ch-color", "color");
    if (hasType) ids.push("deck-ch-type", "typography", "deck-type-scale");
    if (hasVisuals) {
      ids.push("deck-ch-visuals");
      if (showSection("icons")) ids.push("icons");
      if (showSection("photography")) ids.push("photography");
    }
    customBlocks.filter((b) => b.kind !== "divider").forEach((b) => ids.push(`block-${b.id}`));
    ids.push("deck-closing");
    return ids;
  }, [activePage, sections.length, hasIntro, hasLogo, hasColor, hasType, hasVisuals, ws.strategy.purpose, ws.strategy.vision, ws.strategy.mission, showSection, attachedSlots, customBlocks]);

  /** Arrow keys move slide to slide, the way a deck is expected to behave. */
  const step = useCallback(
    (delta: 1 | -1) => {
      const mid = window.innerHeight / 2;
      let currentIndex = 0;
      slideIds.forEach((id, i) => {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= mid) currentIndex = i;
      });
      const next = slideIds[currentIndex + delta];
      if (next) scrollTo(next);
    },
    [slideIds, scrollTo]
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // Never hijack a key someone is using to type — this template is also
      // the editing canvas, where the studio writes directly on the slides.
      const el = document.activeElement as HTMLElement | null;
      if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "ArrowRight" || e.key === "PageDown") {
        e.preventDefault();
        step(1);
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        step(-1);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step]);

  const t = (en: string, ar: string) => (isAr ? ar : en);

  return (
    <SectionNoteProvider lookup={sectionNote}>
    <div
      dir={isAr ? "rtl" : "ltr"}
      // Deck composes its slides from `pal` rather than from the token set,
      // but the tokens still have to be mounted: the blocks a studio drops on
      // a slide are the same shared renderers the other templates use, and
      // without these they fall back to the admin app's own palette inside a
      // client-facing deck.
      data-guideline-surface=""
      style={{
        ...themeCssVars(theme),
        background: pal.paper,
        color: pal.ink,
        minHeight: "100vh",
        fontFamily: isAr ? "var(--font-arabic)" : "var(--font-sans)",
      }}
    >
      <DeckChrome
        pal={pal}
        isAr={isAr}
        ws={ws}
        pages={pages}
        activePage={activePage}
        previewLang={previewLang}
        setPreviewLang={setPreviewLang}
        canDownload={attachedSlots.length > 0}
        onDownload={() => setDownloadOpen(true)}
        onStep={step}
      />

      <div ref={ref} style={{ display: "flex", flexDirection: "column", gap: 16, padding: 16, maxWidth: 1800, margin: "0 auto" }}>
        {/* ---- Cover ---- */}
        <Slide id="deck-cover" scale={scale} background={pal.primary} label={t("Cover", "الغلاف")}>
          {/*
            The cover carries the guideline's name, not the brand's — the
            brand is named by its own lockup at the bottom, which is the
            whole point of putting a logo on a cover. Setting both stacked
            four lines of 180px type straight through the lockup.
            A workspace with no logo attached gets the name as an eyebrow
            instead, so the cover is never anonymous.
          */}
          {!lockupUrl && (
            <span
              dir="auto"
              style={at(GUTTER_WIDE, GUTTER_WIDE - 60, {
                fontFamily: "var(--font-sans)",
                fontWeight: 600,
                fontSize: 36,
                letterSpacing: "-0.04em",
                color: pal.onPrimary,
                opacity: 0.75,
              })}
            >
              {ws.name}
            </span>
          )}
          <h1
            dir="auto"
            style={at(GUTTER_WIDE, GUTTER_WIDE, {
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 180,
              lineHeight: 1.1,
              color: pal.onPrimary,
              whiteSpace: "pre-line",
              maxWidth: 1050,
              letterSpacing: isAr ? "normal" : undefined,
            })}
          >
            {activePage ? (isAr ? activePage.arName : activePage.name) : t("Brand\nGuidelines", "دليل\nالهوية")}
          </h1>
          {markUrl && (
            <BrandMark
              src={markUrl}
              lightSrc={markArt.lightSrc}
              alt=""
              onDark={!isLightHex(pal.primary)}
              style={at(1210, 370, { width: 800, height: 800, objectFit: "contain", opacity: 0.1 })}
            />
          )}
          {lockupUrl && (
            <BrandMark
              src={lockupUrl}
              lightSrc={lockupArt.lightSrc}
              alt={ws.name}
              onDark={!isLightHex(pal.primary)}
              style={at(89, 820, { width: 525, height: 150, objectFit: "contain", objectPosition: isAr ? "right" : "left" })}
            />
          )}
        </Slide>

        {/* ---- Contents ---- */}
        {!activePage && sections.length > 0 && (
          <Slide id="deck-contents" scale={scale} background={pal.paper} label={t("Summary", "المحتويات")}>
            <h2
              style={at(GUTTER_WIDE, GUTTER_WIDE, {
                fontFamily: "var(--font-display)",
                fontWeight: 600,
                fontSize: 98,
                lineHeight: 1,
                color: pal.ink,
                letterSpacing: isAr ? "normal" : undefined,
              })}
            >
              {t("Summary", "المحتويات")}
            </h2>
            <div style={at(GUTTER_WIDE, 248, { width: 1720, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 60, alignContent: "start" })}>
              {sections.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => scrollTo(s.id)}
                  style={{
                    display: "flex",
                    gap: 40,
                    alignItems: "baseline",
                    textAlign: isAr ? "right" : "left",
                    cursor: "pointer",
                    background: "transparent",
                    padding: "14px 0",
                    borderBottom: `1px solid ${pal.hairline}`,
                  }}
                >
                  <span style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: 36, color: pal.primary, flexShrink: 0 }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span dir="auto" style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: 36, letterSpacing: "-0.04em", color: pal.ink }}>
                    {isAr ? s.arLabel : s.label}
                  </span>
                </button>
              ))}
            </div>
          </Slide>
        )}

        {/* ---- 01 Brand Introduction ---- */}
        {hasIntro && (
          <>
            <SectionOpenerSlide
              scale={scale}
              pal={pal}
              numeral="01"
              titleLines={[t("Brand", "أساس"), t("Introduction", "الهوية")]}
              items={[
                ...(ws.strategy.purpose ? [t("1.1  Purpose", "١.١  الغاية")] : []),
                ...(ws.strategy.vision || ws.strategy.mission ? [t("1.2  Vision & Mission", "١.٢  الرؤية والرسالة")] : []),
                ...(showSection("voice") ? [t("1.3  Tone of Voice", "١.٣  نبرة الصوت")] : []),
                ...(showSection("personas") ? [t("1.4  Personas", "١.٤  الشخصيات")] : []),
              ]}
              markUrl={markUrl}
              isAr={isAr}
            />

            {ws.strategy.purpose && (
              <StatementSlide
                id="deck-purpose"
                scale={scale}
                pal={pal}
                number="1.1"
                title={t("Purpose", "الغاية")}
                note={t("Why this brand exists, in one sentence.", "لماذا توجد هذه العلامة، في جملة واحدة.")}
                statement={ws.strategy.purpose}
                fill={pal.primary}
                background={pal.panel}
                markUrl={markUrl}
              />
            )}

            {(ws.strategy.vision || ws.strategy.mission) && (
              <StatementSlide
                id="deck-vision"
                scale={scale}
                pal={pal}
                number="1.2"
                title={ws.strategy.vision ? t("Vision", "الرؤية") : t("Mission", "الرسالة")}
                note={t("Where the brand is going, and what it does to get there.", "إلى أين تتجه العلامة، وما تفعله للوصول.")}
                statement={ws.strategy.vision || ws.strategy.mission}
                fill={pal.secondary}
                background={pal.panelWarm}
                markUrl={markUrl}
              />
            )}

            {showSection("voice") && (
              <DetailSlide
                id="voice"
                scale={scale}
                pal={pal}
                number="1.3"
                sectionId="voice"
                title={sectionTitle("voice", t("Tone of Voice", "نبرة الصوت"))}
                note={t(
                  `${ws.strategy.voiceTraits.length} traits, each with the on-brand phrasing and the one to avoid.`,
                  `${ws.strategy.voiceTraits.length} سمات، لكل منها الصياغة المتوافقة وأخرى يجب تجنبها.`
                )}
                markUrl={markUrl}
              >
                <div style={{ position: "absolute", insetInlineStart: GUTTER, top: 153.753, display: "flex", flexDirection: "column", gap: 48, width: 1275 }}>
                  {ws.strategy.voiceTraits.slice(0, 4).map((trait) => (
                    <div
                      key={trait.id}
                      style={{ width: 1275, borderRadius: 20, background: pal.paper, padding: GUTTER, display: "flex", gap: GUTTER, alignItems: "center" }}
                    >
                      <span dir="auto" style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 36, letterSpacing: "-0.04em", color: pal.primary, width: 300, flexShrink: 0 }}>
                        {trait.trait}
                      </span>
                      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                        <span dir="auto" style={{ fontFamily: "var(--font-sans)", fontSize: 28, lineHeight: 1.3, letterSpacing: "-0.04em", color: pal.textBody }}>
                          {trait.doExample}
                        </span>
                        <span dir="auto" style={{ fontFamily: "var(--font-sans)", fontSize: 28, lineHeight: 1.3, letterSpacing: "-0.04em", color: pal.textMuted, textDecoration: "line-through" }}>
                          {trait.dontExample}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </DetailSlide>
            )}

            {showSection("personas") && (
              <DetailSlide
                id="personas"
                scale={scale}
                pal={pal}
                number="1.4"
                sectionId="personas"
                title={sectionTitle("personas", t("Personas", "الشخصيات"))}
                note={t("Who the brand is speaking to.", "من تخاطبه العلامة.")}
                padded
                markUrl={markUrl}
              >
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 25, height: "100%", alignContent: "start" }}>
                  {ws.strategy.personas.slice(0, 4).map((p) => (
                    <div key={p.id} style={{ borderRadius: 20, background: pal.paper, padding: 40, display: "flex", flexDirection: "column", gap: 12 }}>
                      <span dir="auto" style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: 36, letterSpacing: "-0.04em" }}>{p.name}</span>
                      <span dir="auto" style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 24, color: pal.secondary }}>{p.role}</span>
                      <p dir="auto" style={{ fontFamily: "var(--font-sans)", fontSize: 24, lineHeight: 1.4, letterSpacing: "-0.04em", color: pal.textBody }}>{p.description}</p>
                    </div>
                  ))}
                </div>
              </DetailSlide>
            )}
          </>
        )}

        {/* ---- 02 Brand Logo ---- */}
        {hasLogo && (
          <>
            <SectionOpenerSlide
              scale={scale}
              pal={pal}
              numeral="02"
              titleLines={[t("Brand", "الشعار"), t("Logo", "وتطبيقاته")]}
              items={[
                ...attachedSlots.map((k, i) => `2.${i + 1}  ${isAr ? SLOT_LABEL[k].ar : SLOT_LABEL[k].en}`),
                ...(hasColor ? [`2.${attachedSlots.length + 1}  ${t("Colour Usage", "استخدام الألوان")}`] : []),
              ]}
              markUrl={markUrl}
              isAr={isAr}
            />

            {attachedSlots.map((kind, i) => {
              const slot = ws.logo[kind];
              const label = isAr ? SLOT_LABEL[kind].ar : SLOT_LABEL[kind].en;
              return (
                <DetailSlide
                  key={kind}
                  id={i === 0 ? "logo" : `deck-logo-${kind}`}
                  scale={scale}
                  pal={pal}
                  number={`2.${i + 1}`}
                  sectionId={i === 0 ? "logo" : undefined}
                  title={i === 0 ? sectionTitle("logo", label) : label}
                  note={t(
                    `Minimum clearspace: ${slot.clearspaceMultiplier}× the mark's height on every side.`,
                    `المسافة الآمنة الدنيا: ${slot.clearspaceMultiplier}× ارتفاع الشعار من كل جانب.`
                  )}
                  markUrl={markUrl}
                >
                  <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", padding: "50px 150px" }}>
                    {/* This is the logo slide — the one place in the deck where
                        the artwork is the subject. Plated rather than filtered,
                        so a coloured lockup stays the colour it was uploaded
                        in and is still visible on a dark deck. */}
                    <BrandMark
                      src={slot.url}
                      lightSrc={slot.lightUrl}
                      alt={label}
                      onDark={pal.paperIsDark}
                      plate
                      style={{ maxWidth: 843, maxHeight: 320 }}
                    />
                  </div>
                </DetailSlide>
              );
            })}

            {hasColor && (
              <LogoUsageSlide scale={scale} pal={pal} ws={ws} markUrl={markUrl} lightMarkUrl={markArt.lightSrc} isAr={isAr} />
            )}
          </>
        )}

        {/* ---- 03 Brand Colours ---- */}
        {hasColor && (
          <>
            <SectionOpenerSlide
              scale={scale}
              pal={pal}
              numeral="03"
              titleLines={[t("Brand", "ألوان"), t("Colours", "الهوية")]}
              items={[`3.1  ${t("The palette", "اللوحة اللونية")} (${ws.colors.length})`]}
              markUrl={markUrl}
              isAr={isAr}
            />
            <ColourSlide scale={scale} pal={pal} ws={ws} sectionTitle={sectionTitle} markUrl={markUrl} isAr={isAr} />
          </>
        )}

        {/* ---- 04 Typography ---- */}
        {hasType && (
          <>
            <SectionOpenerSlide
              scale={scale}
              pal={pal}
              numeral="04"
              titleLines={[t("Brand", "خطوط"), t("Typography", "الهوية")]}
              items={[t("4.1  Typefaces", "٤.١  الخطوط"), t("4.2  Type Specimen", "٤.٢  مقاسات الخط")]}
              markUrl={markUrl}
              isAr={isAr}
            />
            <TypefaceSlide scale={scale} pal={pal} ws={ws} sectionTitle={sectionTitle} markUrl={markUrl} isAr={isAr} />
            <TypeScaleSlide scale={scale} pal={pal} markUrl={markUrl} isAr={isAr} />
          </>
        )}

        {/* ---- 05 Brand Visuals ---- */}
        {hasVisuals && (
          <>
            <SectionOpenerSlide
              scale={scale}
              pal={pal}
              numeral="05"
              titleLines={[t("Brand", "العناصر"), t("Visuals", "البصرية")]}
              items={[
                ...(showSection("icons") ? [`5.1  ${t("Iconography", "الأيقونات")} (${iconAssets.length})`] : []),
                ...(showSection("photography") ? [`5.2  ${t("Photography", "التصوير")} (${photoAssets.length})`] : []),
              ]}
              markUrl={markUrl}
              isAr={isAr}
            />

            {showSection("icons") && (
              <DetailSlide
                id="icons"
                scale={scale}
                pal={pal}
                number="5.1"
                sectionId="icons"
                title={sectionTitle("icons", t("Iconography", "الأيقونات"))}
                note={t(`${iconAssets.length} icons in the set.`, `${iconAssets.length} أيقونة في المجموعة.`)}
                padded
                markUrl={markUrl}
              >
                <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 25, alignContent: "start" }}>
                  {iconAssets.slice(0, 18).map((a) => (
                    <div key={a.id} style={{ height: 130, borderRadius: 10, background: pal.paper, display: "grid", placeItems: "center" }}>
                      <BrandMark src={a.url} alt={a.fileName} onDark={pal.paperIsDark} style={{ width: 56, height: 56 }} fallbackSize={24} />
                    </div>
                  ))}
                </div>
              </DetailSlide>
            )}

            {showSection("photography") && (
              <DetailSlide
                id="photography"
                scale={scale}
                pal={pal}
                number="5.2"
                sectionId="photography"
                title={sectionTitle("photography", t("Photography", "التصوير"))}
                note={t("How the brand is pictured.", "كيف تُصوَّر العلامة.")}
                padded
                markUrl={markUrl}
              >
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gridAutoRows: 427, gap: 25 }}>
                  {photoAssets.slice(0, 6).map((a) => (
                    <div key={a.id} style={{ borderRadius: 10, overflow: "hidden", background: pal.chip }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={a.url} alt={a.fileName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  ))}
                </div>
              </DetailSlide>
            )}
          </>
        )}

        {/* ---- Custom blocks, one slide each ---- */}
        {customBlocks
          .filter((b) => b.kind !== "divider")
          .map((b, i) => (
            <CustomBlockSlide
              key={b.id}
              block={b}
              index={i}
              scale={scale}
              pal={pal}
              ws={ws}
              isAr={isAr}
              markUrl={markUrl}
            />
          ))}

        {/* ---- Closing ---- */}
        <Slide id="deck-closing" scale={scale} background={pal.primary} label={t("Thank you", "شكرًا")}>
          <div style={at(GUTTER_WIDE, 207, { width: 910, display: "flex", flexDirection: "column", gap: 74 })}>
            <h2
              dir="auto"
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: 150,
                lineHeight: 1.1,
                color: pal.onPrimary,
                letterSpacing: isAr ? "normal" : undefined,
              }}
            >
              {t("Thank\nyou", "شكرًا\nلكم")}
            </h2>
            <p dir="auto" style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: 36, lineHeight: 1, color: pal.onPrimary, opacity: 0.85 }}>
              {t(`${ws.name} brand guidelines.`, `دليل هوية ${ws.name}.`)}
            </p>
            {attachedSlots.length > 0 && (
              <button
                type="button"
                onClick={() => setDownloadOpen(true)}
                style={{
                  alignSelf: "flex-start",
                  height: 100,
                  padding: "0 50px",
                  borderRadius: 100,
                  background: pal.onPrimary,
                  color: pal.primary,
                  fontFamily: "var(--font-display)",
                  fontWeight: 600,
                  fontSize: 36,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 20,
                }}
              >
                {t("Download the assets", "تحميل الأصول")}
                <span style={{ transform: "rotate(-45deg)" }}>→</span>
              </button>
            )}
          </div>
          {lockupUrl && (
            <BrandMark
              src={lockupUrl}
              lightSrc={lockupArt.lightSrc}
              alt={ws.name}
              onDark={!isLightHex(pal.primary)}
              style={at(1295, GUTTER_WIDE, { width: 525, height: 150, objectFit: "contain" })}
            />
          )}
          {markUrl && (
            <BrandMark
              src={markUrl}
              lightSrc={markArt.lightSrc}
              alt=""
              onDark={!isLightHex(pal.primary)}
              style={at(1220, 380, { width: 800, height: 800, objectFit: "contain", opacity: 0.1 })}
            />
          )}
        </Slide>

        {showMarkyosBadge && (
          <div style={{ padding: "8px 0 24px", textAlign: "center", fontSize: 11, color: pal.textMuted }}>
            {t("Guideline delivered with Markyos", "دليل الهوية مقدَّم عبر ماركيوس")}
          </div>
        )}
      </div>

      {downloadOpen && <DownloadPanel workspace={ws} onClose={() => setDownloadOpen(false)} />}
    </div>
    </SectionNoteProvider>
  );
}

/** A full-bleed statement page — the deck's equivalent of a pull quote. */
function StatementSlide({
  id,
  scale,
  pal,
  number,
  title,
  note,
  statement,
  fill,
  background,
  markUrl,
}: {
  id: string;
  scale: number;
  pal: DeckPalette;
  number: string;
  title: string;
  note: string;
  statement: string;
  fill: string;
  background: string;
  markUrl?: string;
}) {
  return (
    <DetailSlide id={id} scale={scale} pal={pal} number={number} title={title} note={note} panelBackground={background} markUrl={markUrl}>
      <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", padding: "50px 150px" }}>
        <p
          dir="auto"
          style={{ fontFamily: "var(--font-sans)", fontWeight: 400, fontSize: 80, lineHeight: 1.4, letterSpacing: "-0.04em", color: fill, textAlign: "center" }}
        >
          {statement}
        </p>
      </div>
    </DetailSlide>
  );
}

/** The 2 × 2 grid showing the mark on each approved ground. */
function LogoUsageSlide({
  scale,
  pal,
  ws,
  markUrl,
  lightMarkUrl,
  isAr,
}: {
  scale: number;
  pal: DeckPalette;
  ws: TemplateProps["ws"];
  markUrl?: string;
  lightMarkUrl?: string;
  isAr: boolean;
}) {
  // The grounds the source shows, resolved to this brand's own colours. The
  // mark artwork is drawn as black shapes, so whether to invert it follows
  // from each ground's own lightness — deciding per-cell by hand put a white
  // mark on a near-white "ink" cell and made it disappear.
  const cell = (bg: string, label: string) => ({ bg, label, invert: !isLightHex(bg) });
  const cells = [
    cell(pal.primary, isAr ? "أساسي" : "Primary"),
    cell(pal.ink, isAr ? "حبري" : "Ink"),
    cell(pal.paper, isAr ? "خلفية" : "Paper"),
    // Only when the brand actually has a second hue — otherwise this cell
    // would be an exact duplicate of the primary one.
    ...(pal.hasSecondary ? [cell(pal.secondary, isAr ? "ثانوي" : "Secondary")] : []),
  ];

  return (
    <DetailSlide
      id="deck-logo-usage"
      scale={scale}
      pal={pal}
      number={`2.${Object.keys(ws.logo).filter((k) => ws.logo[k as SlotKind].phase === "attached").length + 1}`}
      title={isAr ? "استخدام الألوان" : "Colour Usage"}
      note={isAr ? "الأرضيات المعتمدة للشعار." : "The approved grounds for the mark."}
      panelBackground={pal.primary40}
      markUrl={markUrl}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: cells.length === 4 ? "repeat(2, 1fr)" : "repeat(3, 1fr)",
          gridAutoRows: "1fr",
          gap: 1,
          width: "100%",
          height: "100%",
        }}
      >
        {cells.map((c) => (
          <div
            key={c.label}
            style={{
              background: c.bg,
              display: "grid",
              placeItems: "center",
              padding: 8,
              position: "relative",
              // The "paper" cell is the same colour as the slide it sits on,
              // so without a ring it reads as a hole rather than a swatch.
              boxShadow: `inset 0 0 0 1px ${pal.hairline}`,
            }}
          >
            {markUrl && <BrandMark src={markUrl} lightSrc={lightMarkUrl} alt="" onDark={c.invert} style={{ width: 200, height: 200, objectFit: "contain" }} />}
            <span
              dir="auto"
              style={{
                position: "absolute",
                bottom: 24,
                insetInlineStart: 24,
                fontFamily: "var(--font-sans)",
                fontWeight: 600,
                fontSize: 20,
                letterSpacing: "-0.04em",
                color: c.invert ? "#ffffff" : "#141414",
                opacity: 0.7,
              }}
            >
              {c.label}
            </span>
          </div>
        ))}
      </div>
    </DetailSlide>
  );
}

/** The palette, laid out on the source's 5-column swatch grid. */
function ColourSlide({
  scale,
  pal,
  ws,
  sectionTitle,
  markUrl,
  isAr,
}: {
  scale: number;
  pal: DeckPalette;
  ws: TemplateProps["ws"];
  sectionTitle: TemplateProps["sectionTitle"];
  markUrl?: string;
  isAr: boolean;
}) {
  // 5 across, 2 down, at the source's own gaps: (1275 − 18.75 × 4) / 5 = 240.
  const shown = ws.colors.slice(0, 10);
  return (
    <DetailSlide
      id="color"
      scale={scale}
      pal={pal}
      number="3.1"
      sectionId="color"
      title={sectionTitle("color", isAr ? "الألوان" : "Colour")}
      note={
        ws.colors.length > 10
          ? isAr
            ? `${ws.colors.length} لونًا — تعرض هذه الشريحة أول ١٠.`
            : `${ws.colors.length} colours — this slide shows the first 10.`
          : isAr
            ? `${ws.colors.length} ألوان في اللوحة.`
            : `${ws.colors.length} colours in the palette.`
      }
      padded
      markUrl={markUrl}
    >
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 240px)", columnGap: 18.75, rowGap: 20, justifyContent: "space-between" }}>
        {shown.map((c) => (
          <SwatchCard key={c.id} pal={pal} name={c.name} hex={c.hex} height={430} isPrimary={c.isPrimary} isAr={isAr} />
        ))}
      </div>
    </DetailSlide>
  );
}

/** The "Aa" specimen, weight list, and character set. */
function TypefaceSlide({
  scale,
  pal,
  ws,
  sectionTitle,
  markUrl,
  isAr,
}: {
  scale: number;
  pal: DeckPalette;
  ws: TemplateProps["ws"];
  sectionTitle: TemplateProps["sectionTitle"];
  markUrl?: string;
  isAr: boolean;
}) {
  return (
    <DetailSlide
      id="typography"
      scale={scale}
      pal={pal}
      number="4.1"
      sectionId="typography"
      title={sectionTitle("typography", isAr ? "الخطوط" : "Typefaces")}
      note={`${ws.typography.latinFamily} · ${ws.typography.arabicFamily}`}
      panelBackground="transparent"
      markUrl={markUrl}
    >
      {/* The three boxes carry their own grounds, so the panel itself is bare. */}
      <div style={at(0, 0, { width: PANEL_W, height: 573, borderRadius: 20, background: pal.panel, display: "grid", placeItems: "center" })}>
        <span dir="ltr" style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 310, lineHeight: 1, letterSpacing: "-0.04em", color: pal.ink }}>
          Aa
        </span>
      </div>

      <div
        style={at(0, 598, {
          width: 877,
          height: 382,
          borderRadius: 20,
          background: pal.panel,
          padding: "0 50px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 20,
        })}
      >
        <span dir="auto" style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 80, lineHeight: 1.2, letterSpacing: "-0.04em", color: pal.ink }}>
          {ws.typography.latinFamily}
        </span>
        <span dir="auto" style={{ fontFamily: "var(--font-arabic)", fontWeight: 500, fontSize: 56, lineHeight: 1.3, color: pal.textMuted }}>
          {ws.typography.arabicFamily}
        </span>
      </div>

      <div
        style={at(902, 598, {
          width: 473,
          height: 382,
          borderRadius: 20,
          background: pal.primary,
          padding: "0 50px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 30,
        })}
      >
        <span dir="ltr" style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 30, lineHeight: 1.2, color: pal.onPrimary }}>
          ABCDEFGHIJKLM
          <br />
          NOPQRSTUVWXYZ
        </span>
        <span dir="rtl" style={{ fontFamily: "var(--font-arabic)", fontWeight: 500, fontSize: 30, lineHeight: 1.4, color: pal.onPrimary, opacity: 0.6 }}>
          ا ب ت ث ج ح خ د ذ ر ز س ش
        </span>
        <span dir="ltr" style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 30, lineHeight: 1.2, color: pal.onPrimary, opacity: 0.6 }}>
          0123456789 &amp; @ # % ! ?
        </span>
      </div>
    </DetailSlide>
  );
}

const TYPE_SCALE: { label: string; size: number; lh: number; weight: number }[] = [
  { label: "H1", size: 36, lh: 1.2, weight: 800 },
  { label: "H2", size: 30, lh: 1.2, weight: 800 },
  { label: "H3", size: 24, lh: 1.3, weight: 700 },
  { label: "H4", size: 20, lh: 1.4, weight: 700 },
  { label: "H5", size: 18, lh: 1.4, weight: 600 },
  { label: "H6", size: 16, lh: 1.4, weight: 600 },
  { label: "Body medium", size: 16, lh: 1.4, weight: 500 },
  { label: "Body default", size: 14, lh: 1.4, weight: 400 },
];

/** The eight-row type scale, rendered live in the brand's own text face. */
function TypeScaleSlide({ scale, pal, markUrl, isAr }: { scale: number; pal: DeckPalette; markUrl?: string; isAr: boolean }) {
  return (
    <DetailSlide
      id="deck-type-scale"
      scale={scale}
      pal={pal}
      number="4.2"
      title={isAr ? "مقاسات الخط" : "Type Specimen"}
      note={isAr ? "المقاسات الثابتة للواجهات والمطبوعات." : "The fixed steps for interface and print."}
      padded
      markUrl={markUrl}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 40, paddingInlineStart: 100 }}>
        {TYPE_SCALE.map((row) => (
          <div key={row.label} style={{ display: "flex", gap: 69, alignItems: "center", width: 1100 }}>
            <span style={{ width: 240, flexShrink: 0, fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 24, letterSpacing: "-0.04em", color: pal.textMuted }}>
              {row.label}
            </span>
            <span style={{ width: 120, flexShrink: 0, fontFamily: "ui-monospace, Menlo, monospace", fontSize: 18, color: pal.primary }}>
              {row.size}/{Math.round(row.lh * 100)}%
            </span>
            <span
              dir="auto"
              // The scale's real sizes are interface sizes; on a 1920 frame
              // they need a common multiplier to stay legible, and the ratios
              // between the steps — which is what a specimen shows — survive it.
              style={{ fontFamily: "var(--font-sans)", fontWeight: row.weight, fontSize: row.size * 1.35, lineHeight: row.lh, letterSpacing: "-0.04em", color: pal.ink, whiteSpace: "nowrap" }}
            >
              {isAr ? "نصٌّ نموذجي" : "The quick brown fox"}
            </span>
          </div>
        ))}
      </div>
    </DetailSlide>
  );
}

/**
 * A studio-authored block, given a slide of its own.
 *
 * The block renderers are written for a web page at ordinary reading sizes,
 * so on a 1920-wide slide their 15px body copy would render at roughly 8px
 * once the frame is scaled down. `zoom` scales the content and its layout
 * together — unlike `transform`, which would leave the box the wrong size.
 */
function CustomBlockSlide({
  block,
  index,
  scale,
  pal,
  ws,
  isAr,
  markUrl,
}: {
  block: PageBlock;
  index: number;
  scale: number;
  pal: DeckPalette;
  ws: TemplateProps["ws"];
  isAr: boolean;
  markUrl?: string;
}) {
  const title = (isAr ? block.arTitle : block.title) || (isAr ? `قسم ${index + 1}` : `Section ${index + 1}`);
  return (
    <DetailSlide
      id={`block-${block.id}`}
      scale={scale}
      pal={pal}
      number={`0${index + 1}`}
      sectionId={`block-${block.id}`}
      title={title}
      panelBackground={pal.panel}
      markUrl={markUrl}
    >
      <div style={{ width: PANEL_W, height: PANEL_H, overflow: "hidden", padding: GUTTER }}>
        <div style={{ zoom: 2, width: (PANEL_W - GUTTER * 2) / 2, color: pal.ink }}>
          <BlockRenderer block={block} ws={ws} isAr={isAr} />
        </div>
      </div>
    </DetailSlide>
  );
}

/** Deck chrome: where you are, how to move, language, and the asset download. */
function DeckChrome({
  pal,
  isAr,
  ws,
  pages,
  activePage,
  previewLang,
  setPreviewLang,
  canDownload,
  onDownload,
  onStep,
}: {
  pal: DeckPalette;
  isAr: boolean;
  ws: TemplateProps["ws"];
  pages: TemplateProps["pages"];
  activePage: TemplateProps["activePage"];
  previewLang: TemplateProps["previewLang"];
  setPreviewLang: TemplateProps["setPreviewLang"];
  canDownload: boolean;
  onDownload: () => void;
  onStep: (d: 1 | -1) => void;
}) {
  const pill = (children: ReactNode, onClick?: () => void, key?: string) => (
    <button
      key={key}
      type="button"
      onClick={onClick}
      style={{
        height: 34,
        padding: "0 14px",
        borderRadius: 999,
        background: pal.chip,
        color: pal.ink,
        fontSize: 12.5,
        fontWeight: 600,
        cursor: onClick ? "pointer" : "default",
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      {children}
    </button>
  );

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        display: "flex",
        alignItems: "center",
        // The brand name, the page links and four control pills cannot sit on
        // one 390px line. Wrapping drops the controls to a second row on a
        // phone and changes nothing on a desktop, where it all still fits.
        flexWrap: "wrap",
        gap: 10,
        rowGap: 8,
        padding: "10px 16px",
        background: pal.paper,
        boxShadow: `inset 0 -1px 0 ${pal.hairline}`,
      }}
    >
      <span dir="auto" style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 15, color: pal.ink, flexShrink: 0 }}>
        {ws.name}
      </span>

      {activePage && (
        <Link href={`/v/${ws.slug}`} style={{ fontSize: 12.5, fontWeight: 600, color: pal.textMuted }}>
          {isAr ? "الرئيسية" : "Home"}
        </Link>
      )}
      {pages.map((p) => (
        <Link
          key={p.id}
          href={`/v/${ws.slug}/p/${p.slug}`}
          style={{ fontSize: 12.5, fontWeight: 600, color: activePage?.id === p.id ? pal.primary : pal.textMuted }}
        >
          {isAr ? p.arName : p.name}
        </Link>
      ))}

      <span style={{ marginInlineStart: "auto", display: "flex", alignItems: "center", gap: 8 }}>
        {pill(
          <>
            <Icon name={isAr ? "angle-right" : "angle-left"} size={12} />
            {isAr ? "السابق" : "Prev"}
          </>,
          () => onStep(-1),
          "prev"
        )}
        {pill(
          <>
            {isAr ? "التالي" : "Next"}
            <Icon name={isAr ? "angle-left" : "angle-right"} size={12} />
          </>,
          () => onStep(1),
          "next"
        )}
        <LangToggle value={previewLang} onChange={setPreviewLang} size="sm" />
        {canDownload &&
          pill(
            <>
              <Icon name="download" size={12} />
              {isAr ? "تحميل" : "Assets"}
            </>,
            onDownload,
            "dl"
          )}
      </span>
    </div>
  );
}

DeckTemplate.displayName = "DeckTemplate";
