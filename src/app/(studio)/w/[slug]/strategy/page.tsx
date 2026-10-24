"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useApp } from "@/contexts/AppContext";
import { TopBar, TopBarTab } from "@/components/layout";
import { ShareLinksPanel } from "@/components/features/sharing";
import { Popover, Icon } from "@/components/ui";
import {
  SingleTextTab,
  VisionMissionTab,
  CoreValuesTab,
  AudienceTab,
  CompetitiveTab,
  ToneTab,
  ImportStrategyModal,
  TranslateStrategy,
  TranslationNotice,
} from "@/components/features/strategy";
import { StrategyContents, StrategyDocument, StrategyProgress } from "@/components/features/guideline-site";

type Tab = "purpose" | "vision-mission" | "core-values" | "audience" | "competitive" | "positioning" | "uvp" | "tone";
type Mode = "edit" | "read";

const TABS: { key: Tab; label: string; arLabel: string }[] = [
  { key: "purpose", label: "Purpose", arLabel: "الغاية" },
  { key: "vision-mission", label: "Vision & mission", arLabel: "الرؤية والرسالة" },
  { key: "core-values", label: "Core values", arLabel: "القيم الجوهرية" },
  { key: "audience", label: "Target audience & personas", arLabel: "الجمهور المستهدف" },
  { key: "competitive", label: "Competitive analysis", arLabel: "تحليل المنافسين" },
  { key: "positioning", label: "Brand positioning", arLabel: "تموضع العلامة" },
  { key: "uvp", label: "Unique value proposition", arLabel: "عرض القيمة الفريد" },
  { key: "tone", label: "Personality & tone", arLabel: "الشخصية والنبرة" },
];

export default function StrategyPage() {
  const params = useParams<{ slug: string }>();
  const { getWorkspace, uiLang } = useApp();
  const ws = getWorkspace(params.slug);
  const [tab, setTab] = useState<Tab>("purpose");
  const [mode, setMode] = useState<Mode>("edit");
  const [importOpen, setImportOpen] = useState(false);

  if (!ws) return null;
  const isAr = uiLang(ws) === "ar";
  /**
   * Which copy of the strategy is being written or read.
   *
   * This follows the one language switch in the top bar — the same control
   * that flips the interface. A second switch here meant two controls on the
   * same screen reading "EN / ع" and doing different things, which is a
   * guessing game, not a choice. Reading the Arabic copy and reading an
   * Arabic interface are the same request.
   */
  /* Which language of the brand's strategy is being *edited*.
     It follows the interface language, which is what the chrome toggle used to
     do when both were one field — switching the app to Arabic put you in the
     Arabic copy. Worth separating from the interface language later if a
     studio wants to read the app in English while writing Arabic, but that is
     a new control, not a side effect of this split. */
  const lang = uiLang(ws);

  /**
   * Which sections are still blank, in the language being written.
   *
   * A strategy is eight sections behind eight identical pills, and the only way
   * to find the unfinished ones was to open all eight and remember. Judged on
   * the copy actually being edited, so switching to Arabic on a brand whose
   * Arabic has not been written yet marks all eight rather than claiming they
   * are done.
   */
  const s = ws.strategy;
  const text = (en: string, ar: string | undefined) => (lang === "ar" ? (ar ?? "") : en).trim();
  const emptyTabs: Record<Tab, boolean> = {
    purpose: !text(s.purpose, s.purposeAr),
    "vision-mission": !text(s.vision, s.visionAr) && !text(s.mission, s.missionAr),
    "core-values": s.coreValues.length === 0,
    audience: !text(s.targetAudienceSummary, s.targetAudienceSummaryAr) && s.personas.length === 0,
    competitive: s.competitors.length === 0,
    positioning: !text(s.positioningStatement, s.positioningStatementAr),
    uvp: !text(s.uvp, s.uvpAr),
    tone: s.voiceTraits.length === 0,
  };

  const tabs: TopBarTab[] = TABS.map((t) => ({
    key: t.key,
    label: t.label,
    arLabel: t.arLabel,
    active: tab === t.key,
    empty: emptyTabs[t.key],
    onSelect: () => setTab(t.key),
  }));

  return (
    <>
      <TopBar
        workspace={ws}
        section="Strategy"
        arSection="الاستراتيجية"
        // In read mode the document carries its own contents rail, so the
        // section tabs would be a second, competing navigation for the same
        // thing. Editing is the only mode that needs them.
        tabs={mode === "edit" ? tabs : undefined}
        right={
          <div className="flex items-center gap-2">
            {/*
              Share sits in the top bar, in both modes.
              It used to live only at the bottom of the Read view, which meant
              the answer to "can I send someone the strategy?" was yes, but
              only if you first guessed that a mode toggle labelled Read was
              where sharing lived. Sharing is a thing you decide about the
              page, not a thing you do while reading it.
            */}
            <Popover
              label={isAr ? "مشاركة الاستراتيجية" : "Share the strategy"}
              width={430}
              buttonStyle={{
                height: 32,
                padding: "0 14px",
                borderRadius: 999,
                fontSize: 12.5,
                fontWeight: 500,
                gap: 6,
                whiteSpace: "nowrap",
                background: "var(--surface-2)",
                color: "var(--text)",
              }}
              button={
                <>
                  <Icon name="link" size={13} />
                  {isAr ? "مشاركة" : "Share"}
                </>
              }
            >
              {() => (
                <div className="p-1">
                  <ShareLinksPanel ws={ws} scope="strategy" isAr={isAr} />
                </div>
              )}
            </Popover>
            <TranslateStrategy ws={ws} direction={isAr ? "en-ar" : "ar-en"} isAr={isAr} />
            <div className="inline-flex rounded-full p-[3px]" style={{ background: "var(--surface-1)" }}>
              <ModeTab label={isAr ? "تحرير" : "Edit"} icon="pen" active={mode === "edit"} onClick={() => setMode("edit")} />
              <ModeTab label={isAr ? "قراءة" : "Read"} icon="book" active={mode === "read"} onClick={() => setMode("read")} />
            </div>
            <button
              type="button"
              onClick={() => setImportOpen(true)}
              className="h-8 px-3.5 rounded-full text-[12.5px] font-medium cursor-pointer whitespace-nowrap flex items-center gap-1.5 transition-colors hover:brightness-125"
              style={{ background: "var(--surface-2)", color: "var(--text)" }}
            >
              <Icon name="upload" size={13} />
              {isAr ? "استيراد من ملف" : "Import from file"}
            </button>
          </div>
        }
      />
      {importOpen && <ImportStrategyModal ws={ws} onClose={() => setImportOpen(false)} />}

      {mode === "read" ? (
        <div className="flex-1 min-h-0 flex overflow-hidden">
          <aside
            className="w-[210px] shrink-0 hidden lg:flex flex-col gap-4 overflow-y-auto px-5 py-6.5 print:hidden"
            style={{ boxShadow: isAr ? "inset 1px 0 0 var(--hairline)" : "inset -1px 0 0 var(--hairline)" }}
          >
            <StrategyContents ws={ws} isAr={isAr} />
            <div className="mt-auto flex flex-col gap-3">
              <StrategyProgress ws={ws} isAr={isAr} />
              <button
                type="button"
                onClick={() => window.print()}
                className="h-9 rounded-full text-[12px] font-semibold cursor-pointer flex items-center justify-center gap-2"
                style={{ background: "var(--surface-2)", color: "var(--text-secondary)" }}
              >
                <Icon name="file-alt" size={12} />
                {isAr ? "طباعة / PDF" : "Print / PDF"}
              </button>
            </div>
          </aside>

          <div className="flex-1 min-h-0 overflow-auto px-7 py-8">
            <article className="max-w-[760px] mx-auto flex flex-col gap-9">
              <header className="flex flex-col gap-2">
                <span
                  className="text-[11px] font-semibold uppercase"
                  style={{ letterSpacing: ".12em", color: "var(--text-faint)" }}
                >
                  {isAr ? "استراتيجية العلامة" : "Brand strategy"}
                </span>
                <h1
                  dir="auto"
                  className="bidi-auto text-[38px] font-semibold tracking-tight leading-[1.15]"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {ws.name}
                </h1>
                {ws.tagline && (
                  <p dir="auto" className="bidi-auto text-[15px]" style={{ color: "var(--text-muted)" }}>
                    {ws.tagline}
                  </p>
                )}
                <div className="lg:hidden mt-2">
                  <StrategyProgress ws={ws} isAr={isAr} />
                </div>
              </header>

              <StrategyDocument ws={ws} isAr={isAr} lang={lang} showMissing />
              {/* The share panel used to be repeated here. It now lives in the
                  top bar, where it is reachable from both modes — two of them
                  on one screen would only raise the question of which is the
                  real one. */}
            </article>
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0 px-7 py-6.5 flex flex-col gap-5 overflow-auto max-w-[820px]">
          {/*
           * The page's own heading.
           *
           * Edit mode had none at all — the only page in the app without one.
           * Every panel below it was styled as a heading without being one, so
           * this screen announced itself as an unlabelled region containing
           * eight unlabelled boxes, and there was nothing for a screen reader
           * or a "skip to content" to land on.
           */}
          <div className="flex flex-col gap-1.5">
            <h1
              className="text-[26px] font-semibold tracking-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {isAr ? "الاستراتيجية" : "Strategy"}
            </h1>
            <p className="text-[13.5px] max-w-[64ch]" style={{ color: "var(--text-muted)" }}>
              {isAr
                ? "الطبقة التي تعلو الملفات: لماذا توجد العلامة، ولمن، وبأي صوت. كل قسم في تبويب أعلاه."
                : "The layer above the files: why this brand exists, who it is for, and how it sounds. Each section is a tab above."}
            </p>
          </div>
          <TranslationNotice ws={ws} isAr={isAr} />
          <div key={`${tab}-${lang}`} className="flex flex-col gap-5">
            {tab === "purpose" && (
              <SingleTextTab
                ws={ws}
                lang={lang}
                field="purpose"
                icon="bullseye"
                title="Purpose"
                arTitle="الغاية"
                hint="Why this brand exists — the layer above the logo files."
                arHint="لماذا توجد هذه العلامة — الطبقة التي تعلو ملفات الشعار."
                placeholder="Why does this brand exist? One sentence."
                arPlaceholder="لماذا توجد هذه العلامة؟ جملة واحدة."
                multiline={false}
              />
            )}
            {tab === "vision-mission" && <VisionMissionTab ws={ws} lang={lang} />}
            {tab === "core-values" && <CoreValuesTab ws={ws} lang={lang} />}
            {tab === "audience" && <AudienceTab ws={ws} lang={lang} />}
            {tab === "competitive" && <CompetitiveTab ws={ws} lang={lang} />}
            {tab === "positioning" && (
              <SingleTextTab
                ws={ws}
                lang={lang}
                field="positioningStatement"
                icon="bullseye"
                title="Brand positioning"
                arTitle="تموضع العلامة"
                hint="For [audience], [brand] is the [category] that [benefit] because [reason to believe]."
                arHint="لـ[الجمهور]، [العلامة] هي [الفئة] التي [الفائدة] لأن [سبب التصديق]."
                placeholder="Write the positioning statement."
                arPlaceholder="اكتب جملة التموضع."
              />
            )}
            {tab === "uvp" && (
              <SingleTextTab
                ws={ws}
                lang={lang}
                field="uvp"
                icon="bullseye"
                title="Unique value proposition"
                arTitle="عرض القيمة الفريد"
                hint="The one thing this brand delivers that a competitor genuinely can't."
                arHint="الشيء الوحيد الذي تقدمه هذه العلامة ولا يستطيع أي منافس تقديمه فعلًا."
                placeholder="What makes this brand the only real option?"
                arPlaceholder="ما الذي يجعل هذه العلامة الخيار الحقيقي الوحيد؟"
              />
            )}
            {tab === "tone" && <ToneTab ws={ws} lang={lang} />}
          </div>
          <TabSequence tabs={TABS} current={tab} onSelect={setTab} isAr={isAr} empty={emptyTabs} />
        </div>
      )}
    </>
  );
}

/**
 * Where you are in the strategy, and what comes next.
 *
 * A brand strategy is a document that is *written* in an order — purpose, then
 * who it is for, then how it sounds — and it was presented as eight
 * interchangeable pills. Finishing a section left you at the bottom of a screen
 * with nothing on it, having to go back up to the tab row, remember which one
 * you had just done and count along to the next: the tab row was the only route
 * between two consecutive parts of one piece of writing.
 *
 * So the foot of each section says where it sits and offers the next one.
 * Whether the next section is still empty is on the button, because that is the
 * moment the answer matters.
 */
function TabSequence({
  tabs,
  current,
  onSelect,
  isAr,
  empty,
}: {
  tabs: { key: Tab; label: string; arLabel: string }[];
  current: Tab;
  onSelect: (t: Tab) => void;
  isAr: boolean;
  empty: Record<Tab, boolean>;
}) {
  const i = tabs.findIndex((t) => t.key === current);
  if (i < 0) return null;
  const prev = i > 0 ? tabs[i - 1] : null;
  const next = i < tabs.length - 1 ? tabs[i + 1] : null;
  const name = (t: { label: string; arLabel: string }) => (isAr ? t.arLabel : t.label);

  // The chevrons point the way the reader is going, which in Arabic is the
  // other way — a fixed "→" for "next" would point backwards on an RTL page.
  const backIcon = isAr ? "angle-right" : "angle-left";
  const onIcon = isAr ? "angle-left" : "angle-right";

  return (
    <nav
      aria-label={isAr ? "أقسام الاستراتيجية" : "Strategy sections"}
      className="flex items-center gap-3 pt-1 pb-2"
    >
      {prev ? (
        <button
          type="button"
          onClick={() => onSelect(prev.key)}
          className="mk-tap gap-2 text-[12.5px] cursor-pointer rounded-full px-3 h-9"
          style={{ background: "var(--surface-1)", color: "var(--text-muted)" }}
        >
          <Icon name={backIcon} size={12} />
          <span dir="auto" className="bidi-auto">{name(prev)}</span>
        </button>
      ) : (
        <span />
      )}

      <span className="text-[11.5px] tabular-nums mx-auto" style={{ color: "var(--text-faint)" }}>
        {isAr ? `${i + 1} من ${tabs.length}` : `${i + 1} of ${tabs.length}`}
      </span>

      {next ? (
        <button
          type="button"
          onClick={() => onSelect(next.key)}
          className="mk-tap gap-2 text-[12.5px] font-semibold cursor-pointer rounded-full px-3.5 h-9"
          style={{ background: "var(--surface-2)", color: "var(--text)" }}
        >
          <span className="text-[11px] font-normal" style={{ color: "var(--text-faint)" }}>
            {isAr ? "التالي" : "Next"}
          </span>
          <span dir="auto" className="bidi-auto">{name(next)}</span>
          {empty[next.key] && (
            <span
              title={isAr ? "لا يوجد محتوى بعد" : "Nothing here yet"}
              aria-label={isAr ? "لا يوجد محتوى بعد" : "Nothing here yet"}
              role="img"
              className="w-[6px] h-[6px] rounded-full shrink-0"
              style={{ boxShadow: "inset 0 0 0 1.5px var(--text-faint)" }}
            />
          )}
          <Icon name={onIcon} size={12} />
        </button>
      ) : (
        <span />
      )}
    </nav>
  );
}

function ModeTab({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-7 px-3 rounded-full text-[12px] font-semibold cursor-pointer flex items-center gap-1.5"
      style={{
        background: active ? "var(--solid)" : "transparent",
        color: active ? "var(--solid-ink)" : "var(--text-muted)",
      }}
    >
      <Icon name={icon} size={11} />
      {label}
    </button>
  );
}
