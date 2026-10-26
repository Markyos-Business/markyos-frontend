"use client";

import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { Button } from "@/components/ui";
import { ChipPicker, TextInput } from "@/components/form";
import type { DepartmentView, DeptItemType, SectionKey, Workspace } from "@/types";
import { ITEM_TYPES, SECTION_META } from "../constants";

type AddItemFormProps = { ws: Workspace; view: DepartmentView; onDone: () => void };

/** Links a section or a piece of strategy to the department, with why it matters there. */
export function AddItemForm({ ws, view, onDone }: AddItemFormProps) {
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
      ? { items: ws.strategy.personas.map((p) => ({ value: p.id, label: p.name })), empty: "No personas yet — add some in Strategy first." }
      : type === "voiceTrait"
        ? { items: ws.strategy.voiceTraits.map((t) => ({ value: t.id, label: t.trait })), empty: "No voice traits yet — add some in Strategy first." }
        : null;

  return (
    <div className="mk-surface flex flex-col gap-2.5 rounded-xl bg-surface-2 p-4">
      <ChipPicker
        options={ITEM_TYPES}
        value={type}
        onChange={(t) => {
          setType(t);
          setRef("");
        }}
      />

      {type === "section" && (
        <ChipPicker
          tone="accent"
          options={(Object.keys(SECTION_META) as SectionKey[]).map((key) => ({ value: key, label: SECTION_META[key].label }))}
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

      <TextInput fill="surface-1" size="sm" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Why this matters for this department (optional)" />
      <Button variant="solid" size="sm" onClick={submit} className="self-start">
        Add to {view.name}
      </Button>
    </div>
  );
}
