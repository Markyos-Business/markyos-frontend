import { BrandStrategy, CoreValue, Competitor, Lang, Persona, StrategyTextField, VoiceTrait } from "./types";

/**
 * Reading the strategy in one of its two languages.
 *
 * Two functions, because the reader and the editor want opposite things from a
 * half-translated field. A client opening the guideline should see the English
 * rather than a blank where the Arabic hasn't been written yet — but a studio
 * editing the Arabic copy must see that blank, or it will look finished and
 * never get written. `read` falls back; `edit` doesn't.
 */

export function read(en: string | undefined, ar: string | undefined, lang: Lang): string {
  const primary = lang === "ar" ? ar : en;
  if (primary && primary.trim()) return primary;
  const other = lang === "ar" ? en : ar;
  return other ?? "";
}

export function edit(en: string | undefined, ar: string | undefined, lang: Lang): string {
  return (lang === "ar" ? ar : en) ?? "";
}

/** The storage key for a narrative field in a given language. */
export function textKey(field: StrategyTextField, lang: Lang): string {
  return lang === "ar" ? `${field}Ar` : field;
}

export function strategyText(s: BrandStrategy, field: StrategyTextField, lang: Lang, fallback = true): string {
  const en = s[field];
  const ar = s[`${field}Ar` as keyof BrandStrategy] as string | undefined;
  return fallback ? read(en, ar, lang) : edit(en, ar, lang);
}

export function personaIn(p: Persona, lang: Lang, fallback = true) {
  const f = fallback ? read : edit;
  return {
    name: f(p.name, p.nameAr, lang),
    role: f(p.role, p.roleAr, lang),
    description: f(p.description, p.descriptionAr, lang),
  };
}

export function valueIn(v: CoreValue, lang: Lang, fallback = true) {
  const f = fallback ? read : edit;
  return { title: f(v.title, v.titleAr, lang), description: f(v.description, v.descriptionAr, lang) };
}

export function traitIn(t: VoiceTrait, lang: Lang, fallback = true) {
  const f = fallback ? read : edit;
  return {
    trait: f(t.trait, t.traitAr, lang),
    doExample: f(t.doExample, t.doExampleAr, lang),
    dontExample: f(t.dontExample, t.dontExampleAr, lang),
  };
}

export function competitorIn(c: Competitor, lang: Lang, fallback = true) {
  const f = fallback ? read : edit;
  return {
    name: f(c.name, c.nameAr, lang),
    notes: f(c.notes, c.notesAr, lang),
    cell: (columnId: string) => f(c.cells?.[columnId], c.cellsAr?.[columnId], lang),
  };
}

/** The field suffix for the language being written — "" or "Ar". */
export function suffix(lang: Lang): "" | "Ar" {
  return lang === "ar" ? "Ar" : "";
}

/**
 * The whole strategy flattened into one language.
 *
 * Everything that *renders* the strategy — the hub's read view, the guideline
 * site, the department handbooks — wants one language and doesn't care which
 * field held it. Resolving once here keeps every one of those renderers free
 * of language branching, and means adding a third language later is a change
 * to this function rather than to every component that reads a field.
 *
 * Falls back per field, so a half-translated strategy reads as a complete
 * document with some English in it rather than a document full of holes.
 */
export function resolveStrategy(s: BrandStrategy, lang: Lang): BrandStrategy {
  if (lang === "en") return s;
  return {
    ...s,
    purpose: read(s.purpose, s.purposeAr, lang),
    mission: read(s.mission, s.missionAr, lang),
    vision: read(s.vision, s.visionAr, lang),
    targetAudienceSummary: read(s.targetAudienceSummary, s.targetAudienceSummaryAr, lang),
    positioningStatement: read(s.positioningStatement, s.positioningStatementAr, lang),
    uvp: read(s.uvp, s.uvpAr, lang),
    coreValues: s.coreValues.map((v) => ({ ...v, ...valueIn(v, lang) })),
    personas: s.personas.map((p) => ({ ...p, ...personaIn(p, lang) })),
    voiceTraits: s.voiceTraits.map((t) => ({ ...t, ...traitIn(t, lang) })),
    competitorColumns: s.competitorColumns.map((c) => ({ ...c, label: read(c.label, c.labelAr, lang) })),
    competitors: s.competitors.map((c) => ({
      ...c,
      name: read(c.name, c.nameAr, lang),
      notes: read(c.notes, c.notesAr, lang),
      // Cells are merged key by key so a column translated in Arabic and one
      // left in English both survive into the same row.
      cells: Object.fromEntries(
        [...new Set([...Object.keys(c.cells ?? {}), ...Object.keys(c.cellsAr ?? {})])].map((key) => [
          key,
          read(c.cells?.[key], c.cellsAr?.[key], lang),
        ])
      ),
    })),
  };
}
