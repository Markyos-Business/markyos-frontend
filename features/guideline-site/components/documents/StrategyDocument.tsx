"use client";

import { ReactNode } from "react";
import { Icon, RichText, richIsEmpty } from "@/shared/ui";
import { resolveStrategy } from "@/features/guideline-site/model/strategyLang";
import { BrandStrategy, Lang, Workspace } from "@/core/data/types";

/**
 * The whole brand strategy as one continuous document.
 *
 * The hub edits strategy one tab at a time, which is right for writing and
 * wrong for reading — nobody absorbs a positioning statement by clicking
 * through eight tabs to find it. This renders every section in order, so the
 * strategy can be read the way it will actually be used: start to finish.
 *
 * One renderer, two surfaces. The studio's read view and the `strategy`
 * section of the published guideline site are the same component with a
 * different token set, so the client reads exactly what the studio proofread
 * — there is no second copy of this layout to drift.
 */

export type DocSurface = "app" | "guideline";

interface Tokens {
  surface1: string;
  surface2: string;
  text: string;
  muted: string;
  faint: string;
  accent: string;
  accentSoft: string;
  hairline: string;
}

export function docTokens(surface: DocSurface): Tokens {
  return surface === "guideline"
    ? {
        surface1: "var(--g-surface-1)",
        surface2: "var(--g-surface-2)",
        text: "var(--g-text)",
        muted: "var(--g-text-muted)",
        faint: "var(--g-text-faint)",
        accent: "var(--g-accent)",
        accentSoft: "var(--g-accent-soft)",
        hairline: "var(--g-hairline)",
      }
    : {
        surface1: "var(--surface-1)",
        surface2: "var(--surface-2)",
        text: "var(--text)",
        muted: "var(--text-muted)",
        faint: "var(--text-faint)",
        accent: "var(--accent)",
        accentSoft: "var(--accent-soft)",
        hairline: "var(--hairline)",
      };
}

export interface StrategyChapter {
  id: string;
  label: string;
  arLabel: string;
  /** False when the brand hasn't written this one yet. */
  filled: boolean;
}

/** The document's running order, and which parts of it actually have content. */
export function strategyChapters(ws: Workspace): StrategyChapter[] {
  const s = ws.strategy;
  // `.trim()` is not enough now these fields hold markup: an emptied rich
  // editor leaves "<p><br></p>", which is truthy and would report a blank
  // chapter as written.
  const has = (v: string) => !richIsEmpty(v);
  return [
    { id: "purpose", label: "Purpose", arLabel: "الغاية", filled: has(s.purpose) },
    { id: "vision", label: "Vision", arLabel: "الرؤية", filled: has(s.vision) },
    { id: "mission", label: "Mission", arLabel: "الرسالة", filled: has(s.mission) },
    { id: "values", label: "Core values", arLabel: "القيم الجوهرية", filled: s.coreValues.length > 0 },
    {
      id: "audience",
      label: "Audience",
      arLabel: "الجمهور",
      filled: has(s.targetAudienceSummary) || s.personas.length > 0,
    },
    { id: "competitive", label: "Competitive analysis", arLabel: "تحليل المنافسين", filled: s.competitors.length > 0 },
    { id: "positioning", label: "Positioning", arLabel: "التموضع", filled: has(s.positioningStatement) },
    { id: "uvp", label: "Value proposition", arLabel: "عرض القيمة", filled: has(s.uvp) },
    { id: "tone", label: "Personality & tone", arLabel: "الشخصية والنبرة", filled: s.voiceTraits.length > 0 },
  ];
}

export function strategyIsEmpty(ws: Workspace): boolean {
  return strategyChapters(ws).every((c) => !c.filled);
}

/**
 * Whether the *narrative* half of the strategy has anything in it.
 *
 * The guideline site gives personas and the voice matrix sections of their
 * own, so a brand that has only filled those two has nothing extra to say in
 * a Strategy section and shouldn't get an empty one.
 */
export function strategyNarrativeFilled(ws: Workspace): boolean {
  const s = ws.strategy;
  const has = (v: string) => !richIsEmpty(v);
  // Deliberately spelled out rather than derived from strategyChapters: the
  // "audience" chapter counts personas, and on the guideline site personas are
  // their own section and are omitted here — so a brand with personas and
  // nothing else would otherwise be given an empty Strategy section.
  return (
    has(s.purpose) ||
    has(s.vision) ||
    has(s.mission) ||
    s.coreValues.length > 0 ||
    has(s.targetAudienceSummary) ||
    s.competitors.length > 0 ||
    has(s.positioningStatement) ||
    has(s.uvp)
  );
}

export function StrategyDocument({
  ws,
  isAr,
  lang,
  surface = "app",
  /** Prefix for section anchor ids, so the guideline site's scroll-spy can't collide with the hub's. */
  idPrefix = "strategy-",
  showMissing = false,
  omitChapters = [],
  showPersonaCards = true,
}: {
  ws: Workspace;
  isAr: boolean;
  /**
   * Which language copy to render. Defaults to following `isAr`, which is what
   * every caller wanted before the strategy had two copies — the hub's read
   * view passes it explicitly so a studio can proofread the Arabic while the
   * interface is still in English.
   */
  lang?: Lang;
  surface?: DocSurface;
  idPrefix?: string;
  showMissing?: boolean;
  /** Chapter ids to leave out — used where the surface already covers them elsewhere. */
  omitChapters?: string[];
  showPersonaCards?: boolean;
}) {
  const t = docTokens(surface);
  // Flattened to one language up front, so nothing below this line has to
  // know the strategy is bilingual at all.
  const s = resolveStrategy(ws.strategy, lang ?? (isAr ? "ar" : "en"));
  const omit = (id: string) => omitChapters.includes(id);
  /** These fields hold markup, so emptiness is a text question, not a trim. */
  const has = (v: string) => !richIsEmpty(v);
  const chapters = strategyChapters(ws).filter((c) => !omit(c.id));
  const filled = chapters.filter((c) => c.filled);
  const missing = chapters.filter((c) => !c.filled);

  let n = 0;
  const num = () => String(++n).padStart(2, "0");

  if (filled.length === 0) {
    return (
      <p className="text-[14px]" style={{ color: t.faint }}>
        {isAr
          ? "لم تُكتب الاستراتيجية بعد."
          : "No strategy written yet. Fill in the sections and they'll appear here as one readable document."}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      {!omit("purpose") && has(s.purpose) && (
        <Chapter id={`${idPrefix}purpose`} n={num()} title={isAr ? "الغاية" : "Purpose"} t={t}>
          {/* The purpose is the one line everything else hangs off, so it is set
              as a statement rather than as another paragraph of body copy. */}
          <div
            dir="auto"
            className="bidi-auto text-[24px] leading-[1.45] font-medium"
            style={{ fontFamily: "var(--font-display)", color: t.text }}
          >
            <RichText value={s.purpose} />
          </div>
        </Chapter>
      )}

      {!omit("vision") && has(s.vision) && (
        <Chapter id={`${idPrefix}vision`} n={num()} title={isAr ? "الرؤية" : "Vision"} t={t}>
          <Prose text={s.vision} color={t.muted} />
        </Chapter>
      )}

      {!omit("mission") && has(s.mission) && (
        <Chapter id={`${idPrefix}mission`} n={num()} title={isAr ? "الرسالة" : "Mission"} t={t}>
          <Prose text={s.mission} color={t.muted} />
        </Chapter>
      )}

      {!omit("values") && s.coreValues.length > 0 && (
        <Chapter id={`${idPrefix}values`} n={num()} title={isAr ? "القيم الجوهرية" : "Core values"} t={t}>
          <div className="grid gap-3 sm:grid-cols-2">
            {s.coreValues.map((v, i) => (
              <div key={v.id} className="rounded-2xl p-5 flex flex-col gap-2" style={{ background: t.surface1 }}>
                <span
                  className="text-[10px] font-semibold"
                  style={{ fontFamily: "ui-monospace, Menlo, monospace", color: t.accent }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span dir="auto" className="bidi-auto font-semibold text-[15px]" style={{ color: t.text }}>
                  {v.title}
                </span>
                {v.description && (
                  <p dir="auto" className="bidi-auto text-[13.5px] leading-[1.6]" style={{ color: t.muted }}>
                    {v.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Chapter>
      )}

      {!omit("audience") && (has(s.targetAudienceSummary) || (showPersonaCards && s.personas.length > 0)) && (
        <Chapter id={`${idPrefix}audience`} n={num()} title={isAr ? "الجمهور" : "Audience"} t={t}>
          {has(s.targetAudienceSummary) && <Prose text={s.targetAudienceSummary} color={t.muted} />}
          {showPersonaCards && s.personas.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2 mt-1">
              {s.personas.map((p) => (
                <div key={p.id} className="rounded-2xl p-5 flex flex-col gap-1.5" style={{ background: t.surface1 }}>
                  <span dir="auto" className="bidi-auto font-semibold text-[14px]" style={{ color: t.text }}>
                    {p.name}
                  </span>
                  {p.role && (
                    <span dir="auto" className="bidi-auto text-[12px]" style={{ color: t.accent }}>
                      {p.role}
                    </span>
                  )}
                  {p.description && (
                    <p dir="auto" className="bidi-auto text-[13px] leading-[1.6] mt-1" style={{ color: t.muted }}>
                      {p.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Chapter>
      )}

      {!omit("competitive") && s.competitors.length > 0 && (
        <Chapter id={`${idPrefix}competitive`} n={num()} title={isAr ? "تحليل المنافسين" : "Competitive analysis"} t={t}>
          <CompetitorTable strategy={s} isAr={isAr} t={t} />
        </Chapter>
      )}

      {!omit("positioning") && has(s.positioningStatement) && (
        <Chapter id={`${idPrefix}positioning`} n={num()} title={isAr ? "التموضع" : "Positioning"} t={t}>
          <div
            className="ps-5"
            style={{ boxShadow: `inset 2px 0 0 ${t.accent}` }}
          >
            <RichText value={s.positioningStatement} className="text-[17px]" style={{ color: t.text }} />
          </div>
        </Chapter>
      )}

      {!omit("uvp") && has(s.uvp) && (
        <Chapter id={`${idPrefix}uvp`} n={num()} title={isAr ? "عرض القيمة الفريد" : "Unique value proposition"} t={t}>
          <Prose text={s.uvp} color={t.muted} />
        </Chapter>
      )}

      {!omit("tone") && s.voiceTraits.length > 0 && (
        <Chapter id={`${idPrefix}tone`} n={num()} title={isAr ? "الشخصية والنبرة" : "Personality & tone"} t={t}>
          {/*
            A personality is a set of traits first, and a rulebook second. The
            traits are stated together up front so a reader takes away "this
            brand is plain, direct, specific" — then each one is spelled out
            with the sentence that proves it and the sentence that breaks it.
          */}
          <div className="flex flex-wrap gap-1.5">
            {s.voiceTraits.map((v) => (
              <span
                key={v.id}
                dir="auto"
                className="bidi-auto text-[13px] font-semibold px-3 py-1.5 rounded-full"
                style={{ background: t.accentSoft, color: t.accent }}
              >
                {v.trait}
              </span>
            ))}
          </div>

          <div className="flex flex-col gap-3 mt-1">
            {s.voiceTraits.map((v) => (
              <div key={v.id} className="rounded-2xl overflow-hidden" style={{ background: t.surface1 }}>
                <div className="px-5 pt-4 pb-3">
                  <span dir="auto" className="bidi-auto font-semibold text-[15px]" style={{ color: t.text }}>
                    {v.trait}
                  </span>
                </div>
                <div className="grid sm:grid-cols-2">
                  <ToneCell label={isAr ? "افعل" : "Do"} value={v.doExample} tone="var(--success)" t={t} />
                  <ToneCell label={isAr ? "لا تفعل" : "Don't"} value={v.dontExample} tone="var(--danger)" t={t} strike />
                </div>
              </div>
            ))}
          </div>
        </Chapter>
      )}

      {showMissing && missing.length > 0 && (
        <div className="rounded-2xl p-5 flex flex-col gap-2.5" style={{ background: t.surface1 }}>
          <span className="text-[12px] font-semibold" style={{ color: t.text }}>
            {isAr ? "لم يُكتب بعد" : "Not written yet"}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {missing.map((c) => (
              <span
                key={c.id}
                className="text-[11.5px] px-2.5 py-1.5 rounded-full"
                style={{ background: t.surface2, color: t.faint }}
              >
                {isAr ? c.arLabel : c.label}
              </span>
            ))}
          </div>
          <span className="text-[11.5px]" style={{ color: t.faint }}>
            {isAr
              ? "الأقسام الفارغة لا تظهر في المستند — لا شيء هنا مُختلق."
              : "Empty sections are left out of the document rather than filled with placeholder text."}
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * The competitive analysis as a comparison grid.
 *
 * Read down a column to compare every competitor on one axis — which is the
 * whole point of the exercise and impossible when each competitor is a
 * paragraph. Narrow screens get a card per competitor instead of a table
 * squeezed to unreadable width.
 */
function CompetitorTable({ strategy, isAr, t }: { strategy: BrandStrategy; isAr: boolean; t: Tokens }) {
  // Takes the already-language-resolved strategy rather than the workspace, so
  // the Arabic read view shows the Arabic table instead of reaching past the
  // resolution back into the raw English fields.
  const columns = strategy.competitorColumns.filter((col) =>
    strategy.competitors.some((c) => (col.id === "notes" ? c.notes.trim() : (c.cells?.[col.id] ?? "").trim()))
  );
  const cell = (c: BrandStrategy["competitors"][number], colId: string) =>
    (colId === "notes" ? c.notes : (c.cells?.[colId] ?? "")).trim();

  if (columns.length === 0) {
    return (
      <div className="flex flex-col">
        {strategy.competitors.map((c, i) => (
          <div key={c.id} className="py-3" style={i > 0 ? { boxShadow: `inset 0 1px 0 ${t.hairline}` } : undefined}>
            <span dir="auto" className="bidi-auto font-semibold text-[14px]" style={{ color: t.text }}>
              {c.name}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="hidden md:block overflow-x-auto rounded-xl" style={{ background: t.surface1 }}>
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr>
              <th
                className="text-start px-4 py-3 text-[10.5px] font-semibold uppercase whitespace-nowrap"
                style={{ letterSpacing: ".08em", color: t.faint, boxShadow: `inset 0 -1px 0 ${t.hairline}` }}
              >
                {isAr ? "المنافس" : "Competitor"}
              </th>
              {columns.map((col) => (
                <th
                  key={col.id}
                  className="text-start px-4 py-3 text-[10.5px] font-semibold uppercase whitespace-nowrap"
                  style={{ letterSpacing: ".08em", color: t.faint, boxShadow: `inset 0 -1px 0 ${t.hairline}` }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {strategy.competitors.map((c, i) => (
              <tr key={c.id}>
                <td
                  dir="auto"
                  className="bidi-auto align-top px-4 py-3.5 font-semibold whitespace-nowrap"
                  style={{ color: t.text, boxShadow: i > 0 ? `inset 0 1px 0 ${t.hairline}` : undefined }}
                >
                  {c.name}
                </td>
                {columns.map((col) => (
                  <td
                    key={col.id}
                    dir="auto"
                    className="bidi-auto align-top px-4 py-3.5 leading-[1.6]"
                    style={{ color: t.muted, boxShadow: i > 0 ? `inset 0 1px 0 ${t.hairline}` : undefined }}
                  >
                    {cell(c, col.id) || "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden flex flex-col gap-2.5">
        {strategy.competitors.map((c) => (
          <div key={c.id} className="rounded-2xl p-4 flex flex-col gap-2.5" style={{ background: t.surface1 }}>
            <span dir="auto" className="bidi-auto font-semibold text-[14px]" style={{ color: t.text }}>
              {c.name}
            </span>
            {columns.map((col) => (
              <div key={col.id} className="flex flex-col gap-0.5">
                <span className="text-[10px] font-semibold uppercase" style={{ letterSpacing: ".08em", color: t.faint }}>
                  {col.label}
                </span>
                <span dir="auto" className="bidi-auto text-[13px] leading-[1.6]" style={{ color: t.muted }}>
                  {cell(c, col.id) || "—"}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}

function Chapter({
  id,
  n,
  title,
  t,
  children,
}: {
  id: string;
  n: string;
  title: string;
  t: Tokens;
  children: ReactNode;
}) {
  return (
    <section id={id} className="flex flex-col gap-3.5 scroll-mt-24">
      <div className="flex items-baseline gap-3">
        <span
          className="text-[11px] font-semibold shrink-0"
          style={{ fontFamily: "ui-monospace, Menlo, monospace", color: t.accent }}
        >
          {n}
        </span>
        <h2
          className="text-[13px] font-semibold uppercase"
          style={{ letterSpacing: ".1em", color: t.faint }}
        >
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

/**
 * Rich strategy copy — headings, lists, quotes, links and tables.
 *
 * Values written before these fields became rich text are plain strings, and
 * RichText wraps those into paragraphs, so both shapes render correctly from
 * the same call.
 */
function Prose({ text, color }: { text: string; color: string }) {
  return <RichText value={text} className="text-[15px] max-w-[68ch]" style={{ color }} />;
}

/**
 * One half of a do/don't pair.
 *
 * The example is set as the sentence it is — quoted, in the brand's own words
 * — rather than as a caption, because a writer copies these verbatim. The
 * don't side is struck through so the two are distinguishable at a glance and
 * not only by a colour, which fails for a colour-blind reader and in print.
 */
function ToneCell({
  label,
  value,
  tone,
  t,
  strike,
}: {
  label: string;
  value: string;
  tone: string;
  t: Tokens;
  strike?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2 px-5 py-4" style={{ boxShadow: `inset 0 1px 0 ${t.hairline}` }}>
      <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase" style={{ letterSpacing: ".08em", color: tone }}>
        <Icon name={strike ? "times" : "check"} size={10} />
        {label}
      </span>
      {value ? (
        <span
          dir="auto"
          className="bidi-auto text-[14px] leading-[1.6]"
          style={{
            color: strike ? t.faint : t.text,
            textDecoration: strike ? "line-through" : undefined,
            textDecorationColor: strike ? tone : undefined,
          }}
        >
          “{value}”
        </span>
      ) : (
        <span className="text-[12.5px]" style={{ color: t.faint }}>
          —
        </span>
      )}
    </div>
  );
}

/** A jump-to rail for the read view. Only lists chapters that have content. */
export function StrategyContents({
  ws,
  isAr,
  surface = "app",
  idPrefix = "strategy-",
}: {
  ws: Workspace;
  isAr: boolean;
  surface?: DocSurface;
  idPrefix?: string;
}) {
  const t = docTokens(surface);
  const filled = strategyChapters(ws).filter((c) => c.filled);
  if (filled.length === 0) return null;

  return (
    <nav className="flex flex-col gap-0.5">
      <span
        className="text-[10px] font-semibold uppercase pb-2"
        style={{ letterSpacing: ".1em", color: t.faint }}
      >
        {isAr ? "المحتويات" : "Contents"}
      </span>
      {filled.map((c, i) => (
        <button
          key={c.id}
          type="button"
          onClick={() => document.getElementById(`${idPrefix}${c.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" })}
          className="flex items-center gap-2.5 text-start py-1.5 text-[12.5px] cursor-pointer"
          style={{ color: t.muted }}
        >
          <span
            className="text-[10px] shrink-0"
            style={{ fontFamily: "ui-monospace, Menlo, monospace", color: t.faint }}
          >
            {String(i + 1).padStart(2, "0")}
          </span>
          <span className="truncate">{isAr ? c.arLabel : c.label}</span>
        </button>
      ))}
    </nav>
  );
}

/** Completeness, stated as a fraction rather than a vague "almost done". */
export function StrategyProgress({ ws, isAr, surface = "app" }: { ws: Workspace; isAr: boolean; surface?: DocSurface }) {
  const t = docTokens(surface);
  const chapters = strategyChapters(ws);
  const done = chapters.filter((c) => c.filled).length;
  return (
    <div className="flex items-center gap-2.5">
      <div className="h-1 w-[72px] rounded-full overflow-hidden" style={{ background: t.surface2 }}>
        <div className="h-full" style={{ width: `${(done / chapters.length) * 100}%`, background: t.accent }} />
      </div>
      <span className="text-[11.5px]" style={{ color: t.faint }}>
        {isAr ? `${done} من ${chapters.length}` : `${done} of ${chapters.length} written`}
      </span>
      {done === chapters.length && <Icon name="check-circle" size={13} style={{ color: "var(--success)" }} />}
    </div>
  );
}
