"use client";

import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { Button } from "@/components/ui";
import { ChipPicker, InputField } from "@/components/form";
import type { DepartmentView, DeptItemType, SectionKey, Workspace } from "@/types";
import { ITEM_TYPES, SECTION_META } from "../constants";

type AddItemFormProps = { ws: Workspace; view: DepartmentView; isAr: boolean; onDone: () => void };

/** Links a section or a piece of strategy to the department, with why it matters there. */
export function AddItemForm({ ws, view, isAr, onDone }: AddItemFormProps) {
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const { addDeptItem } = useApp();
  const [type, setType] = useState<DeptItemType>("section");
  const [section, setSection] = useState<SectionKey>("overview");
  const [ref, setRef] = useState("");
  const [note, setNote] = useState("");
  const needsRef = type === "persona" || type === "voiceTrait";

  function submit() {
    if (needsRef && !ref) return;
    addDeptItem(ws.id, view.id, {
      itemType: type,
      sectionKey: type === "section" ? section : undefined,
      refId: needsRef ? ref : undefined,
      relevanceNote: note.trim() || undefined,
    });
    setNote("");
    onDone();
  }

  const refOptions =
    type === "persona"
      ? { items: ws.strategy.personas.map((p) => ({ value: p.id, label: p.name })), empty: t("No personas yet — add some in Strategy first.", "لا شخصيات بعد، أضفها في الاستراتيجية أولًا.") }
      : type === "voiceTrait"
        ? { items: ws.strategy.voiceTraits.map((trait) => ({ value: trait.id, label: trait.trait })), empty: t("No voice traits yet — add some in Strategy first.", "لا سمات نبرة بعد، أضفها في الاستراتيجية أولًا.") }
        : null;

  return (
    <div className="mk-surface flex flex-col gap-2.5 rounded-card bg-surface-2 p-4">
      <ChipPicker
        options={ITEM_TYPES.map((item) => ({ value: item.value, label: isAr ? item.arLabel : item.label }))}
        value={type}
        onChange={(next) => {
          setType(next);
          setRef("");
        }}
      />

      {type === "section" && (
        <ChipPicker
          tone="accent"
          options={(Object.keys(SECTION_META) as SectionKey[]).map((key) => ({ value: key, label: isAr ? SECTION_META[key].arLabel : SECTION_META[key].label }))}
          value={section}
          onChange={setSection}
        />
      )}

      {refOptions &&
        (refOptions.items.length === 0 ? (
          <div className="flex flex-wrap gap-1.5">
            <span className="text-[12px] text-text-faint">{refOptions.empty}</span>
          </div>
        ) : (
          <ChipPicker tone="accent" options={refOptions.items} value={ref} onChange={setRef} />
        ))}

      <InputField
        size="sm"
        dir="auto"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        aria-label={t("Why this matters for this department", "لماذا يهم هذا القسم")}
        placeholder={t("Why this matters for this department (optional)", "لماذا يهم هذا القسم (اختياري)")}
      />
      <Button variant="solid" size="sm" onClick={submit} className="self-start">
        {isAr ? `إضافة إلى ${view.name}` : `Add to ${view.name}`}
      </Button>
    </div>
  );
}
