import type { AnalysisSource, BrandStrategy, Lang, StrategyAdditions } from "@/types";
import type { Competitor, Gap, Goal, Persona, Route, Section, SectionKey, Segment, Tension, Trait, WhiteSpace } from "../types";

/** Which report items can go to Strategy, as (section, field) pairs. */
export type StrategyField =
  | "goals.business"
  | "goals.brand"
  | "audience.segments"
  | "audience.personas"
  | "market.competitors"
  | "market.whiteSpace"
  | "personality.traits"
  | "routes.items"
  | "tensions.items"
  | "gaps.items";

/** Fields that add notes to a positioning option rather than an entry of their own. */
export const NOTE_FIELDS: StrategyField[] = ["market.whiteSpace", "tensions.items", "gaps.items"];

const FIELDS: Partial<Record<SectionKey, string[]>> = {
  goals: ["business", "brand"],
  audience: ["segments", "personas"],
  market: ["competitors", "whiteSpace"],
  personality: ["traits"],
  routes: ["items"],
  tensions: ["items"],
  gaps: ["items"],
};

export const fieldOf = (section: SectionKey, field: string) => `${section}.${field}` as StrategyField;

/** The fields of `section` that can go to Strategy; none for snapshot, creative, constraints. */
export const strategyFields = (section: SectionKey): StrategyField[] => (FIELDS[section] ?? []).map((f) => fieldOf(section, f));

type AnyItem = { id?: string; name?: string; text?: string; trait?: string; question?: string };

/** A stable key for an item within its section: its id, or its field and wording. */
export function itemKey(field: StrategyField, item: AnyItem) {
  return item.id ?? `${field}:${item.name ?? item.text ?? item.trait ?? item.question ?? ""}`;
}

const NOTE_PREFIX = {
  en: { whiteSpace: "White space: ", tension: "Tension: ", gap: "Open question: " },
  ar: { whiteSpace: "فرصة غير مشغولة: ", tension: "توتر: ", gap: "سؤال مفتوح: " },
};

/**
 * One report item as what it adds to Strategy, written into the fields of the
 * analysis's language (the Arabic copy for an Arabic analysis).
 */
export function additionFor(field: StrategyField, item: AnyItem, lang: Lang, source: AnalysisSource): StrategyAdditions {
  const ar = lang === "ar";
  const join = (...parts: (string | null | undefined)[]) => parts.map((p) => (p ?? "").trim()).filter(Boolean).join("\n");
  switch (field) {
    case "goals.business":
    case "goals.brand": {
      const g = item as Goal;
      const kind = field === "goals.business" ? "business" : "brand";
      return { objectives: [ar ? { text: "", textAr: g.text, kind, priority: g.priority, source } : { text: g.text, kind, priority: g.priority, source }] };
    }
    case "audience.segments": {
      const s = item as Segment;
      return { audienceSummary: { text: join(`${s.name}: ${s.description}`), lang } };
    }
    case "audience.personas": {
      const p = item as Persona;
      const role = [p.job, p.ageRange, p.city].filter(Boolean).join(" · ");
      const description = join(
        p.howTheyChoose,
        p.needs.length ? (ar ? "يحتاج: " : "Needs: ") + p.needs.join(ar ? "، " : ", ") : "",
        p.frustrations.length ? (ar ? "يحبطه: " : "Frustrations: ") + p.frustrations.join(ar ? "، " : ", ") : "",
        p.quote ? `“${p.quote}”` : ""
      );
      return {
        personas: [ar ? { name: "", role: "", description: "", nameAr: p.name, roleAr: role, descriptionAr: description, source } : { name: p.name, role, description, source }],
      };
    }
    case "market.competitors": {
      const c = item as Competitor;
      const notes = join(c.positioning, c.strengths ? (ar ? "نقاط القوة: " : "Strengths: ") + c.strengths : "", c.gaps ? (ar ? "الثغرات: " : "Gaps: ") + c.gaps : "");
      return { competitors: [ar ? { name: "", notes: "", cells: {}, nameAr: c.name, notesAr: notes, source } : { name: c.name, notes, cells: {}, source }] };
    }
    case "personality.traits": {
      const t = item as Trait;
      return {
        voiceTraits: [ar ? { trait: "", doExample: "", dontExample: "", traitAr: t.trait, source } : { trait: t.trait, doExample: "", dontExample: "", source }],
      };
    }
    case "routes.items": {
      const r = item as Route;
      const notes = [
        ...r.pros.map((x) => (ar ? "ميزة: " : "Pro: ") + x),
        ...r.risks.map((x) => (ar ? "مخاطرة: " : "Risk: ") + x),
      ];
      return {
        positioningOptions: [
          ar
            ? { name: "", idea: "", positioning: "", notes: [], nameAr: r.name, ideaAr: r.idea, positioningAr: r.positioning, notesAr: notes, source }
            : { name: r.name, idea: r.idea, positioning: r.positioning, notes, source },
        ],
      };
    }
    default:
      return {};
  }
}

/** A note for a positioning option from white space, a tension or a gap. */
export function noteFor(field: StrategyField, item: AnyItem, lang: Lang): string {
  const p = NOTE_PREFIX[lang];
  if (field === "market.whiteSpace") return p.whiteSpace + (item as WhiteSpace).text;
  if (field === "tensions.items") {
    const t = item as Tension;
    return `${p.tension}${t.statementA.text} ↔ ${t.statementB.text}. ${t.question}`.trim();
  }
  if (field === "gaps.items") return p.gap + (item as Gap).question;
  return "";
}

/** Whether this item is already in the strategy, judged by where entries came from. */
export function isAdded(strategy: BrandStrategy, field: StrategyField, item: AnyItem, analysisId: string, lang: Lang): boolean {
  const key = itemKey(field, item);
  const from = (list: { source?: AnalysisSource }[]) => list.some((e) => e.source?.analysisId === analysisId && e.source.itemKey === key);
  switch (field) {
    case "goals.business":
    case "goals.brand":
      return from(strategy.objectives);
    case "audience.personas":
      return from(strategy.personas);
    case "market.competitors":
      return from(strategy.competitors);
    case "personality.traits":
      return from(strategy.voiceTraits);
    case "routes.items":
      return from(strategy.positioningOptions);
    case "audience.segments": {
      const summary = (lang === "ar" ? strategy.targetAudienceSummaryAr : strategy.targetAudienceSummary) ?? "";
      const s = item as Segment;
      return summary.includes(`${s.name}: ${s.description}`);
    }
    default: {
      const note = noteFor(field, item, lang);
      return strategy.positioningOptions.some((o) => ((lang === "ar" ? o.notesAr : o.notes) ?? []).includes(note));
    }
  }
}

/** Every item in a section that could go to Strategy, with its field. */
export function sectionItems(section: Section): { field: StrategyField; item: AnyItem }[] {
  const content = (section.current ?? {}) as Record<string, unknown>;
  return strategyFields(section.key).flatMap((field) => {
    const list = content[field.split(".")[1]];
    return Array.isArray(list) ? list.map((item) => ({ field, item: item as AnyItem })) : [];
  });
}

/** Merge several additions into one, for "Add all". */
export function mergeAdditions(list: StrategyAdditions[]): StrategyAdditions {
  const out: StrategyAdditions = {};
  for (const a of list) {
    for (const key of ["objectives", "personas", "competitors", "voiceTraits", "positioningOptions"] as const) {
      if (a[key]) (out[key] as unknown[]) = [...((out[key] as unknown[]) ?? []), ...(a[key] as unknown[])];
    }
    if (a.audienceSummary) {
      out.audienceSummary = out.audienceSummary
        ? { lang: a.audienceSummary.lang, text: `${out.audienceSummary.text}\n\n${a.audienceSummary.text}` }
        : a.audienceSummary;
    }
  }
  return out;
}
