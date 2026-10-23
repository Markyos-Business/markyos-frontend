"use client";

import { FormEvent, useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { useToast, Icon } from "@/components/ui";
import { EditableField, Section, EmptyHint } from "@/components/ui/composites/SectionUI/SectionUI";
import { MachineDraftFlag, OtherCopyHint } from "@/components/features/strategy/components/BilingualUI";
import { personaIn, strategyText, textKey } from "@/components/features/guideline-site";
import { Lang, Workspace } from "@/types";
import { InlineText, MiniInput } from "./shared";

export function AudienceTab({ ws, lang }: { ws: Workspace; lang: Lang }) {
  const { setStrategyText, addPersona, updatePersona, removePersona, uiLang } = useApp();
  const { showToast } = useToast();
  const [summaryDraft, setSummaryDraft] = useState<string | null>(null);
  const [addingPersona, setAddingPersona] = useState(false);
  const [personaName, setPersonaName] = useState("");
  const [personaRole, setPersonaRole] = useState("");
  const [personaDesc, setPersonaDesc] = useState("");
  const isAr = lang === "ar";
  const summary = strategyText(ws.strategy, "targetAudienceSummary", lang, false);

  function submitPersona(e: FormEvent) {
    e.preventDefault();
    if (!personaName.trim() || !personaRole.trim()) return;
    addPersona(
      ws.id,
      isAr
        ? {
            name: "",
            role: "",
            description: "",
            nameAr: personaName.trim(),
            roleAr: personaRole.trim(),
            descriptionAr: personaDesc.trim(),
          }
        : { name: personaName.trim(), role: personaRole.trim(), description: personaDesc.trim() }
    );
    setPersonaName("");
    setPersonaRole("");
    setPersonaDesc("");
    setAddingPersona(false);
    showToast(isAr ? "تمت إضافة شخصية." : "Persona added.", "success");
  }

  return (
    <div className="flex flex-col gap-5">
      <Section title={isAr ? "الجمهور المستهدف" : "Target audience"} icon="users">
        {ws.strategyTranslation.unreviewed.includes(textKey("targetAudienceSummary", lang)) && (
          <MachineDraftFlag isAr={uiLang(ws) === "ar"} />
        )}
        <EditableField
          label={isAr ? "لمن هذه العلامة" : "Who this is for"}
          placeholder={isAr ? "لمن بُنيت هذه العلامة فعلًا؟" : "Who is this brand actually built for?"}
          value={summaryDraft ?? summary}
          editing={summaryDraft !== null}
          multiline
          isAr={isAr}
          onStart={() => setSummaryDraft(summary)}
          onChange={setSummaryDraft}
          onCommit={() => {
            if (summaryDraft !== null) setStrategyText(ws.id, "targetAudienceSummary", summaryDraft.trim(), lang);
            setSummaryDraft(null);
          }}
        />
        {isAr && (
          <OtherCopyHint rich={false} text={strategyText(ws.strategy, "targetAudienceSummary", "en", false)} />
        )}
      </Section>

      <Section
        title={isAr ? "الشخصيات" : "Personas"}
        icon="users"
        right={
          <button
            type="button"
            onClick={() => setAddingPersona((v) => !v)}
            className="mk-tap text-[12px] font-semibold cursor-pointer"
            style={{ color: "var(--accent-text)" }}
          >
            {addingPersona ? (isAr ? "إلغاء" : "Cancel") : isAr ? "+ إضافة" : "+ Add"}
          </button>
        }
      >
        {addingPersona && (
          <form onSubmit={submitPersona} className="rounded-xl p-4 flex flex-col gap-2.5" style={{ background: "var(--surface-2)" }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <MiniInput
                value={personaName}
                onChange={setPersonaName}
                placeholder={isAr ? "الاسم — مثلًا: ليلى" : "Name — e.g. Layla"}
              />
              <MiniInput
                value={personaRole}
                onChange={setPersonaRole}
                placeholder={isAr ? "الدور — مثلًا: مديرة التسويق" : "Role — e.g. Marketing lead"}
              />
            </div>
            <MiniInput
              value={personaDesc}
              onChange={setPersonaDesc}
              placeholder={isAr ? "ماذا يحتاجون من هذا الدليل؟" : "What do they need from this guideline?"}
            />
            <button type="submit" className="h-9 rounded-lg text-[12px] font-semibold cursor-pointer self-start px-4" style={{ background: "var(--solid)", color: "var(--solid-ink)" }}>
              {isAr ? "إضافة شخصية" : "Add persona"}
            </button>
          </form>
        )}
        {ws.strategy.personas.length === 0 ? (
          <EmptyHint>
            {isAr
              ? "لا توجد شخصيات بعد — أضف من يفتح هذا الدليل فعلًا ولماذا."
              : "No personas yet — add who actually opens this guideline and why."}
          </EmptyHint>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {ws.strategy.personas.map((p) => {
              const shown = personaIn(p, lang, false);
              const flagged = ws.strategyTranslation.unreviewed.includes(`persona:${p.id}`);
              return (
                <div key={p.id} className="rounded-xl p-4 flex flex-col gap-1 mk-card" style={{ background: "var(--surface-2)" }}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <InlineText
                        value={shown.name}
                        isAr={isAr}
                        placeholder={isAr ? "الاسم" : "Name"}
                        className="font-semibold text-[13px] block"
                        onCommit={(next) => updatePersona(ws.id, p.id, isAr ? { nameAr: next } : { name: next })}
                      />
                      <InlineText
                        value={shown.role}
                        isAr={isAr}
                        placeholder={isAr ? "الدور" : "Role"}
                        className="text-[11px] block"
                        style={{ color: "var(--text-faint)" }}
                        onCommit={(next) => updatePersona(ws.id, p.id, isAr ? { roleAr: next } : { role: next })}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removePersona(ws.id, p.id)}
                      aria-label={
                        isAr ? `حذف ${shown.name || "الشخصية"}` : `Remove ${shown.name || "persona"}`
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
                    placeholder={isAr ? "ماذا يحتاجون من هذا الدليل؟" : "What do they need from this guideline?"}
                    className="text-[12px] mt-1"
                    style={{ color: "var(--text-secondary)" }}
                    onCommit={(next) =>
                      updatePersona(ws.id, p.id, isAr ? { descriptionAr: next } : { description: next })
                    }
                  />
                  {flagged && <MachineDraftFlag isAr={uiLang(ws) === "ar"} />}
                  {isAr && (
                    <OtherCopyHint rich={false} text={[p.name, p.role, p.description].filter(Boolean).join(" — ")} />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Section>
    </div>
  );
}
