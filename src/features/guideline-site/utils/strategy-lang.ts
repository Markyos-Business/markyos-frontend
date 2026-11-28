import { BrandStrategy, CoreValue, Lang, Persona, StrategyTextField, VoiceTrait } from "@/types";

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
  // Both ways: an English reader of an Arabic-only value sees the Arabic, not a blank card.
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

/** The strategy's sections, as the editor names them (features/strategy StrategyTab). */
export type StrategySectionKey =
  | "purpose"
  | "vision-mission"
  | "objectives"
  | "core-values"
  | "audience"
  | "competitive"
  | "positioning-options"
  | "positioning"
  | "uvp"
  | "tone";

/** How many fields of a section are written in one language and still missing in each. */
export type SectionParity = { en: number; ar: number };
export type StrategyParity = Record<StrategySectionKey, SectionParity>;

/** Written: text left once tags and spaces are gone (the narrative fields are rich text). */
const written = (value: string | undefined | null): boolean =>
  !!value && value.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim().length > 0;

/**
 * What still needs writing in each language, section by section.
 *
 * A field counts against a language when the other language has it and this
 * one doesn't: "needs Arabic" is an English value with no Arabic beside it. A
 * field blank in both is not a translation gap, it is unwritten, and the
 * editor's empty-section dot already says so. Lists count per item field, so a
 * core value with an English title and no Arabic one is one Arabic gap, which
 * is what "the list has items" could never tell.
 */
export function strategyParity(s: BrandStrategy): StrategyParity {
  const out = {} as StrategyParity;
  const add = (key: StrategySectionKey, en: string | undefined | null, ar: string | undefined | null) => {
    const row = (out[key] ??= { en: 0, ar: 0 });
    const hasEn = written(en);
    const hasAr = written(ar);
    if (hasEn && !hasAr) row.ar++;
    if (hasAr && !hasEn) row.en++;
  };
  const keys: StrategySectionKey[] = ["purpose", "vision-mission", "objectives", "core-values", "audience", "competitive", "positioning-options", "positioning", "uvp", "tone"];
  for (const key of keys) out[key] = { en: 0, ar: 0 };

  add("purpose", s.purpose, s.purposeAr);
  add("vision-mission", s.vision, s.visionAr);
  add("vision-mission", s.mission, s.missionAr);
  for (const o of s.objectives ?? []) add("objectives", o.text, o.textAr);
  for (const v of s.coreValues ?? []) {
    add("core-values", v.title, v.titleAr);
    add("core-values", v.description, v.descriptionAr);
  }
  add("audience", s.targetAudienceSummary, s.targetAudienceSummaryAr);
  for (const p of s.personas ?? []) {
    add("audience", p.name, p.nameAr);
    add("audience", p.role, p.roleAr);
    add("audience", p.description, p.descriptionAr);
  }
  for (const c of s.competitorColumns ?? []) add("competitive", c.label, c.labelAr);
  for (const c of s.competitors ?? []) {
    add("competitive", c.name, c.nameAr);
    add("competitive", c.notes, c.notesAr);
    for (const key of new Set([...Object.keys(c.cells ?? {}), ...Object.keys(c.cellsAr ?? {})])) {
      add("competitive", c.cells?.[key], c.cellsAr?.[key]);
    }
  }
  for (const o of s.positioningOptions ?? []) {
    add("positioning-options", o.name, o.nameAr);
    add("positioning-options", o.idea, o.ideaAr);
    add("positioning-options", o.positioning, o.positioningAr);
    add("positioning-options", (o.notes ?? []).join("\n"), (o.notesAr ?? []).join("\n"));
  }
  add("positioning", s.positioningStatement, s.positioningStatementAr);
  add("uvp", s.uvp, s.uvpAr);
  for (const t of s.voiceTraits ?? []) {
    add("tone", t.trait, t.traitAr);
    add("tone", t.doExample, t.doExampleAr);
    add("tone", t.dontExample, t.dontExampleAr);
  }
  return out;
}

/** Fields still to write in `lang`, across the whole strategy. */
export function missingIn(parity: StrategyParity, lang: Lang): number {
  return Object.values(parity).reduce((sum, row) => sum + row[lang], 0);
}
