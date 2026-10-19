"use client";

import { FormEvent, useState } from "react";
import { useApp } from "@/core/store/store";
import { useToast, Icon } from "@/shared/ui";
import { Section, EmptyHint } from "@/shared/ui/composites/SectionUI/SectionUI";
import { MachineDraftFlag, OtherCopyHint } from "@/features/strategy/components/BilingualUI";
import { valueIn } from "@/features/guideline-site";
import { Lang, Workspace } from "@/core/data/types";
import { InlineText, MiniInput } from "./shared";

export function CoreValuesTab({ ws, lang }: { ws: Workspace; lang: Lang }) {
  const { addCoreValue, updateCoreValue, removeCoreValue, uiLang } = useApp();
  const { showToast } = useToast();
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const isAr = lang === "ar";

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    // Adding while the Arabic copy is open writes the Arabic side of a new
    // value, leaving the English blank for whoever writes that — rather than
    // silently filing Arabic text in the English field.
    addCoreValue(
      ws.id,
      isAr
        ? { title: "", description: "", titleAr: title.trim(), descriptionAr: description.trim() }
        : { title: title.trim(), description: description.trim() }
    );
    setTitle("");
    setDescription("");
    setAdding(false);
    showToast(isAr ? "تمت إضافة قيمة." : "Core value added.", "success");
  }

  return (
    <Section
      title={isAr ? "القيم الجوهرية" : "Core values"}
      icon="bullseye"
      right={
        <button
          type="button"
          onClick={() => setAdding((v) => !v)}
          className="mk-tap text-[12px] font-semibold cursor-pointer"
          style={{ color: "var(--accent-text)" }}
        >
          {adding ? (isAr ? "إلغاء" : "Cancel") : isAr ? "+ إضافة" : "+ Add"}
        </button>
      }
    >
      {adding && (
        <form onSubmit={submit} className="rounded-xl p-4 flex flex-col gap-2.5" style={{ background: "var(--surface-2)" }}>
          <MiniInput
            value={title}
            onChange={setTitle}
            placeholder={isAr ? "القيمة — مثلًا: العربية أولًا" : "Value — e.g. Set the Arabic first"}
          />
          <MiniInput
            value={description}
            onChange={setDescription}
            placeholder={isAr ? "ماذا تعني هذه القيمة عمليًا؟" : "What does this actually mean in practice?"}
          />
          <button type="submit" className="h-9 rounded-lg text-[12px] font-semibold cursor-pointer self-start px-4" style={{ background: "var(--solid)", color: "var(--solid-ink)" }}>
            {isAr ? "إضافة قيمة" : "Add value"}
          </button>
        </form>
      )}
      {ws.strategy.coreValues.length === 0 ? (
        <EmptyHint>
          {isAr
            ? "لا توجد قيم بعد — القواعد القليلة التي لا تتنازل عنها هذه العلامة."
            : "No core values yet — the few rules this brand won't bend on."}
        </EmptyHint>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {ws.strategy.coreValues.map((v) => {
            const shown = valueIn(v, lang, false);
            const flagged = ws.strategyTranslation.unreviewed.includes(`value:${v.id}`);
            return (
              <div
                key={v.id}
                className="rounded-xl p-4 flex flex-col gap-1 mk-card"
                style={{ background: "var(--surface-2)" }}
              >
                <div className="flex items-start justify-between gap-2">
                  <InlineText
                    value={shown.title}
                    isAr={isAr}
                    placeholder={isAr ? "اسم القيمة" : "Value name"}
                    className="font-semibold text-[13px] flex-1 min-w-0"
                    onCommit={(next) => updateCoreValue(ws.id, v.id, isAr ? { titleAr: next } : { title: next })}
                  />
                  <button
                    type="button"
                    onClick={() => removeCoreValue(ws.id, v.id)}
                    aria-label={
                      isAr ? `حذف ${shown.title || "القيمة"}` : `Remove ${shown.title || "value"}`
                    }
                    className="mk-icon-btn cursor-pointer shrink-0 transition-opacity opacity-50 hover:opacity-100"
                  >
                    <Icon name="times" size={14} style={{ color: "var(--text-faint)" }} />
                  </button>
                </div>
                <InlineText
                  value={shown.description}
                  isAr={isAr}
                  multiline
                  placeholder={isAr ? "ماذا تعني عمليًا؟" : "What does it mean in practice?"}
                  className="text-[12px] mt-1"
                  style={{ color: "var(--text-secondary)" }}
                  onCommit={(next) =>
                    updateCoreValue(ws.id, v.id, isAr ? { descriptionAr: next } : { description: next })
                  }
                />
                {flagged && <MachineDraftFlag isAr={uiLang(ws) === "ar"} />}
                {isAr && <OtherCopyHint rich={false} text={[v.title, v.description].filter(Boolean).join(" — ")} />}
              </div>
            );
          })}
        </div>
      )}
    </Section>
  );
}
