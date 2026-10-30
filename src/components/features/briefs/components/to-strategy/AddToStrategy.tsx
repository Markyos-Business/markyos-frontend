"use client";

import { ActionsDropdown, Button, Icon, Tag } from "@/components/ui";
import type { AddToStrategy } from "../../hooks/to-strategy/useAddToStrategy";
import type { Section } from "../../types";
import { fieldOf, strategyFields } from "../../utils/toStrategy";
import type { ItemAction } from "../report/sections/SectionBody";

/** The per-item action: Add, Added, or (for a note) which positioning option it goes on. */
export function itemActionFor(strategy: AddToStrategy, section: Section): ItemAction {
  const t = (en: string, ar: string) => (strategy.isAr ? ar : en);
  return function itemAction(rawField, item) {
    const field = fieldOf(section.key, rawField);
    // Constraints, creative routes and the snapshot have nowhere to go in Strategy.
    if (!strategyFields(section.key).includes(field)) return null;
    if (strategy.isAdded(field, item)) return <Tag tone="success">{t("Added", "أُضيف")}</Tag>;
    if (!strategy.isNoteField(field)) {
      return (
        <Button variant="link" icon={<Icon name="plus" size={16} />} onClick={() => strategy.add(section, field, item)}>
          {t("Add to Strategy", "إضافة إلى الاستراتيجية")}
        </Button>
      );
    }
    // A note goes on a positioning option; there must be one to put it on.
    return (
      <ActionsDropdown
        label={t("Add as a note to…", "إضافة كملاحظة إلى…")}
        items={
          strategy.options.length
            ? strategy.options.map((o) => ({
                label: o.name || t("Untitled option", "خيار بلا اسم"),
                icon: "bullseye",
                onSelect: () => strategy.addNote(section, field, item, o.id),
              }))
            : [
                {
                  label: t("No positioning options yet", "لا توجد خيارات تموضع بعد"),
                  icon: "bullseye",
                  onSelect: () => undefined,
                  disabled: true,
                  reason: t("Add a route to Strategy first.", "أضف مسارًا إلى الاستراتيجية أولًا."),
                },
              ]
        }
      />
    );
  };
}

/** "Add all" for a section: everything in it that isn't in Strategy yet. */
export function AddAllButton({ strategy, section }: { strategy: AddToStrategy; section: Section }) {
  const t = (en: string, ar: string) => (strategy.isAr ? ar : en);
  const pending = strategy.pending(section).length;
  if (pending === 0) return null;
  return (
    <Button variant="outline" size="sm" icon={<Icon name="plus" size={16} />} onClick={() => strategy.addAll(section)}>
      {t(`Add all to Strategy (${pending})`, `إضافة الكل إلى الاستراتيجية (${pending})`)}
    </Button>
  );
}
