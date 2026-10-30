"use client";

import { type FormEvent, useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { Button, EmptyHint, Icon, IconButton, Section, Tag, useDialog, useToast } from "@/components/ui";
import type { Lang, PositioningOption, Workspace } from "@/types";
import { InlineText, MiniInput } from "./shared";

/**
 * Positioning routes still being weighed. Each has a name, the idea behind it
 * and the position it takes, plus notes gathered against it; choosing one
 * makes it the brand's positioning statement.
 */
export function PositioningOptionsTab({ ws, lang }: { ws: Workspace; lang: Lang }) {
  const { addPositioningOption, updatePositioningOption, removePositioningOption, choosePositioningOption } = useApp();
  const { confirm } = useDialog();
  const { showToast } = useToast();
  const isAr = lang === "ar";
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const options = ws.strategy.positioningOptions;
  const statement = ((isAr ? ws.strategy.positioningStatementAr : ws.strategy.positioningStatement) ?? "").trim();

  const text = (o: PositioningOption, key: "name" | "idea" | "positioning") => (isAr ? o[`${key}Ar`] : o[key]) ?? "";
  const notesOf = (o: PositioningOption) => (isAr ? o.notesAr : o.notes) ?? [];
  const setText = (o: PositioningOption, key: "name" | "idea" | "positioning", next: string) =>
    updatePositioningOption(ws.id, o.id, isAr ? { [`${key}Ar`]: next } : { [key]: next });
  const setNotes = (o: PositioningOption, notes: string[]) =>
    updatePositioningOption(ws.id, o.id, isAr ? { notesAr: notes } : { notes });

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    addPositioningOption(
      ws.id,
      isAr
        ? { name: "", idea: "", positioning: "", notes: [], nameAr: name.trim(), ideaAr: "", positioningAr: "", notesAr: [] }
        : { name: name.trim(), idea: "", positioning: "", notes: [] }
    );
    setName("");
    setAdding(false);
    showToast(isAr ? "تمت إضافة خيار." : "Option added.", "success");
  }

  async function choose(o: PositioningOption) {
    const ok = await confirm({
      title: isAr ? `استخدام «${text(o, "name")}» كتموضع للعلامة؟` : `Use “${text(o, "name")}” as the brand's positioning?`,
      body: isAr
        ? "تحل جملة تموضع هذا الخيار محل جملة التموضع الحالية."
        : "This option's positioning replaces the current positioning statement.",
      confirmLabel: isAr ? "استخدام هذا الخيار" : "Use this option",
      isAr,
    });
    if (!ok) return;
    choosePositioningOption(ws.id, o.id, lang);
    showToast(isAr ? "أصبح هذا الخيار تموضع العلامة." : "Now the brand's positioning.", "success");
  }

  return (
    <Section
      title={isAr ? "خيارات التموضع" : "Positioning options"}
      icon="bullseye"
      right={
        <Button variant="link" onClick={() => setAdding((v) => !v)}>
          {adding ? (isAr ? "إلغاء" : "Cancel") : isAr ? "+ إضافة" : "+ Add"}
        </Button>
      }
    >
      {adding && (
        <form onSubmit={submit} className="flex flex-col gap-space-4 rounded-widget bg-surface-2 p-space-6">
          <MiniInput value={name} onChange={setName} placeholder={isAr ? "اسم الخيار — مثلًا: قهوة الصحراء" : "Option name — e.g. Desert roast"} />
          <Button type="submit" variant="solid" size="sm" className="self-start">
            {isAr ? "إضافة خيار" : "Add option"}
          </Button>
        </form>
      )}

      {options.length === 0 ? (
        <EmptyHint>
          {isAr
            ? "لا توجد خيارات بعد — المسارات التي تُوزن قبل اختيار تموضع العلامة."
            : "No options yet — the routes weighed before one becomes the brand's positioning."}
        </EmptyHint>
      ) : (
        <div className="grid grid-cols-1 gap-space-5 lg:grid-cols-2">
          {options.map((o) => {
            const inUse = !!statement && statement === text(o, "positioning").trim();
            const notes = notesOf(o);
            return (
              <article key={o.id} className="flex flex-col gap-space-4 rounded-widget bg-surface-2 p-space-6">
                <div className="flex items-start justify-between gap-space-3">
                  <InlineText
                    value={text(o, "name")}
                    isAr={isAr}
                    placeholder={isAr ? "اسم الخيار" : "Option name"}
                    className="flex-1 text-h5 font-medium"
                    onCommit={(next) => setText(o, "name", next)}
                  />
                  {inUse && <Tag tone="primary">{isAr ? "مستخدم" : "In use"}</Tag>}
                  <IconButton icon="times" iconSize={16} label={isAr ? "حذف الخيار" : "Remove option"} onClick={() => removePositioningOption(ws.id, o.id)} />
                </div>
                <Field label={isAr ? "الفكرة" : "Idea"}>
                  <InlineText
                    value={text(o, "idea")}
                    isAr={isAr}
                    multiline
                    placeholder={isAr ? "الفكرة وراء هذا المسار" : "The idea behind this route"}
                    className="text-body"
                    onCommit={(next) => setText(o, "idea", next)}
                  />
                </Field>
                <Field label={isAr ? "التموضع" : "Positioning"}>
                  <InlineText
                    value={text(o, "positioning")}
                    isAr={isAr}
                    multiline
                    placeholder={isAr ? "لـ[الجمهور]، [العلامة] هي…" : "For [audience], [brand] is the…"}
                    className="text-body"
                    onCommit={(next) => setText(o, "positioning", next)}
                  />
                </Field>
                <Field label={isAr ? "ملاحظات" : "Notes"}>
                  <ul className="flex flex-col gap-space-2">
                    {notes.map((note, i) => (
                      <li key={i} className="flex items-start gap-space-3">
                        <InlineText
                          value={note}
                          isAr={isAr}
                          multiline
                          placeholder={isAr ? "ملاحظة" : "Note"}
                          className="flex-1 text-caption"
                          onCommit={(next) => setNotes(o, notes.map((n, j) => (j === i ? next : n)).filter(Boolean))}
                        />
                        <IconButton
                          icon="times"
                          iconSize={16}
                          label={isAr ? "حذف الملاحظة" : "Remove note"}
                          onClick={() => setNotes(o, notes.filter((_, j) => j !== i))}
                        />
                      </li>
                    ))}
                  </ul>
                  <AddNote isAr={isAr} onAdd={(note) => setNotes(o, [...notes, note])} />
                </Field>
                {!inUse && text(o, "positioning").trim() && (
                  <Button variant="outline" size="sm" className="self-start" icon={<Icon name="check" size={16} />} onClick={() => void choose(o)}>
                    {isAr ? "استخدام كتموضع للعلامة" : "Use as the brand's positioning"}
                  </Button>
                )}
              </article>
            );
          })}
        </div>
      )}
    </Section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-space-2">
      <span className="text-caption text-text-muted">{label}</span>
      {children}
    </div>
  );
}

function AddNote({ isAr, onAdd }: { isAr: boolean; onAdd: (note: string) => void }) {
  const [note, setNote] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!note.trim()) return;
        onAdd(note.trim());
        setNote("");
      }}
    >
      <MiniInput value={note} onChange={setNote} placeholder={isAr ? "+ أضف ملاحظة واضغط Enter" : "+ Add a note and press Enter"} />
    </form>
  );
}
