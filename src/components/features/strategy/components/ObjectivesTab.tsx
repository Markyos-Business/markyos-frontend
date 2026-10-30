"use client";

import { type FormEvent, useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { Button, EmptyHint, IconButton, Section, Tag, useToast } from "@/components/ui";
import { SelectInput } from "@/components/form";
import type { Lang, ObjectiveKind, Priority, Workspace } from "@/types";
import { OBJECTIVE_KINDS, PRIORITIES } from "../constants";
import { InlineText, MiniInput } from "./shared";

/**
 * What the brand work is for: business and brand goals, each with a priority.
 * Written here, or added from a brief analysis's Goals.
 */
export function ObjectivesTab({ ws, lang }: { ws: Workspace; lang: Lang }) {
  const { addObjective, updateObjective, removeObjective } = useApp();
  const { showToast } = useToast();
  const isAr = lang === "ar";
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState("");
  const [kind, setKind] = useState<ObjectiveKind>("business");
  const [priority, setPriority] = useState<Priority>("medium");
  const objectives = ws.strategy.objectives;

  const priorityOptions = PRIORITIES.map((p) => ({ value: p.value, label: isAr ? p.arLabel : p.label }));
  const kindOptions = OBJECTIVE_KINDS.map((k) => ({ value: k.value, label: isAr ? k.arLabel : k.label }));

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    // Written in the copy being edited, like every other strategy list.
    addObjective(ws.id, isAr ? { text: "", textAr: text.trim(), kind, priority } : { text: text.trim(), kind, priority });
    setText("");
    setAdding(false);
    showToast(isAr ? "تمت إضافة هدف." : "Objective added.", "success");
  }

  return (
    <Section
      title={isAr ? "الأهداف" : "Objectives"}
      icon="bullseye"
      right={
        <Button variant="link" onClick={() => setAdding((v) => !v)}>
          {adding ? (isAr ? "إلغاء" : "Cancel") : isAr ? "+ إضافة" : "+ Add"}
        </Button>
      }
    >
      {adding && (
        <form onSubmit={submit} className="flex flex-col gap-space-4 rounded-widget bg-surface-2 p-space-6">
          <MiniInput
            value={text}
            onChange={setText}
            placeholder={isAr ? "الهدف — مثلًا: ضاعف المبيعات عبر الإنترنت في الرياض" : "Objective — e.g. Double online sales in Riyadh"}
          />
          <div className="flex flex-wrap gap-space-4">
            <SelectInput aria-label={isAr ? "النوع" : "Kind"} value={kind} onChange={(e) => setKind(e.target.value as ObjectiveKind)} options={kindOptions} />
            <SelectInput
              aria-label={isAr ? "الأولوية" : "Priority"}
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              options={priorityOptions}
            />
          </div>
          <Button type="submit" variant="solid" size="sm" className="self-start">
            {isAr ? "إضافة هدف" : "Add objective"}
          </Button>
        </form>
      )}

      {objectives.length === 0 ? (
        <EmptyHint>
          {isAr
            ? "لا توجد أهداف بعد — ما الذي يجب أن يحققه هذا العمل للعمل وللعلامة."
            : "No objectives yet — what this work has to achieve, for the business and for the brand."}
        </EmptyHint>
      ) : (
        OBJECTIVE_KINDS.map((group) => {
          const items = objectives.filter((o) => o.kind === group.value);
          if (items.length === 0) return null;
          return (
            <div key={group.value} className="flex flex-col gap-space-3">
              <h3 className="text-caption font-medium text-text-muted">{isAr ? group.arLabel : group.label}</h3>
              <ul className="flex flex-col gap-space-3">
                {items.map((o) => {
                  const shown = (isAr ? o.textAr : o.text) ?? "";
                  const tone = PRIORITIES.find((p) => p.value === o.priority)?.tone ?? "neutral";
                  return (
                    <li key={o.id} className="flex flex-wrap items-start gap-space-4 rounded-widget bg-surface-2 p-space-5">
                      <div className="min-w-0 flex-1">
                        <InlineText
                          value={shown}
                          isAr={isAr}
                          multiline
                          placeholder={isAr ? "اكتب الهدف" : "Write the objective"}
                          className="text-body font-medium"
                          onCommit={(next) => updateObjective(ws.id, o.id, isAr ? { textAr: next } : { text: next })}
                        />
                        {isAr && o.text && (
                          <p dir="ltr" className="mt-space-2 text-caption text-text-muted">
                            {o.text}
                          </p>
                        )}
                      </div>
                      <Tag tone={tone}>{isAr ? PRIORITIES.find((p) => p.value === o.priority)?.arLabel : PRIORITIES.find((p) => p.value === o.priority)?.label}</Tag>
                      <SelectInput
                        aria-label={isAr ? "تغيير الأولوية" : "Change priority"}
                        value={o.priority}
                        onChange={(e) => updateObjective(ws.id, o.id, { priority: e.target.value as Priority })}
                        options={priorityOptions}
                      />
                      <IconButton icon="times" iconSize={16} label={isAr ? "حذف الهدف" : "Remove objective"} onClick={() => removeObjective(ws.id, o.id)} />
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })
      )}
    </Section>
  );
}
