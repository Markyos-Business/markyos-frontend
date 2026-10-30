"use client";

import { useApp } from "@/contexts/AppContext";
import { useToast } from "@/components/ui";
import type { StrategyAdditions, Workspace } from "@/types";
import { markAddedToStrategy } from "../services/briefsService";
import type { BriefAnalysis, Section } from "../types";
import { NOTE_FIELDS, additionFor, isAdded, itemKey, mergeAdditions, noteFor, sectionItems } from "../utils/toStrategy";
import type { StrategyField } from "../utils/toStrategy";

type Item = Parameters<typeof itemKey>[1];

/**
 * Adding report items to the brand's Strategy: one item, a whole section, or
 * a tension, gap or white space as a note on a positioning option. The
 * person's click is the approval. Each add is one step with an Undo, and the
 * analysis records which items went.
 */
export function useAddToStrategy(workspace: Workspace, analysis: BriefAnalysis, onSection: (s: Section) => void) {
  const { addToStrategy, removeFromStrategy } = useApp();
  const { showToast } = useToast();
  const lang = analysis.language;
  const isAr = lang === "ar";
  const t = (en: string, ar: string) => (isAr ? ar : en);

  function apply(section: Section, additions: StrategyAdditions, keys: string[], done: string) {
    addToStrategy(workspace.id, additions);
    // Undo takes out just this add, whatever else was added since.
    showToast(done, "success", { label: t("Undo", "تراجع"), run: () => removeFromStrategy(workspace.id, additions) });
    // The Strategy is saved with the brand; this is the analysis's own record.
    markAddedToStrategy(analysis.id, section.key, keys).then(onSection, () => undefined);
  }

  const source = (section: Section, field: StrategyField, item: Item) => ({
    analysisId: analysis.id,
    sectionKey: section.key,
    itemKey: itemKey(field, item),
  });

  return {
    isAr,
    options: workspace.strategy.positioningOptions.map((o) => ({ id: o.id, name: (isAr ? o.nameAr : o.name) || o.name || o.nameAr || "" })),
    isNoteField: (field: StrategyField) => NOTE_FIELDS.includes(field),
    isAdded: (field: StrategyField, item: Item) => isAdded(workspace.strategy, field, item, analysis.id, lang),

    add(section: Section, field: StrategyField, item: Item) {
      apply(section, additionFor(field, item, lang, source(section, field, item)), [itemKey(field, item)], t("Added to Strategy.", "أُضيف إلى الاستراتيجية."));
    },

    addNote(section: Section, field: StrategyField, item: Item, optionId: string) {
      apply(
        section,
        { notes: { optionId, notes: [noteFor(field, item, lang)], lang } },
        [itemKey(field, item)],
        t("Added as a note.", "أُضيفت كملاحظة.")
      );
    },

    /** Everything in the section not yet in Strategy; notes need an option, so they're left to one at a time. */
    pending(section: Section) {
      return sectionItems(section).filter(
        ({ field, item }) => !NOTE_FIELDS.includes(field) && !isAdded(workspace.strategy, field, item, analysis.id, lang)
      );
    },

    addAll(section: Section) {
      const items = sectionItems(section).filter(
        ({ field, item }) => !NOTE_FIELDS.includes(field) && !isAdded(workspace.strategy, field, item, analysis.id, lang)
      );
      if (!items.length) return;
      apply(
        section,
        mergeAdditions(items.map(({ field, item }) => additionFor(field, item, lang, source(section, field, item)))),
        items.map(({ field, item }) => itemKey(field, item)),
        t(`${items.length} added to Strategy.`, `أُضيف ${items.length} إلى الاستراتيجية.`)
      );
    },
  };
}

export type AddToStrategy = ReturnType<typeof useAddToStrategy>;
