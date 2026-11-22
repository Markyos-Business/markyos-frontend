"use client";

import { FormEvent, useState } from "react";
import { useAppActions } from "@/contexts/AppContext";
import { useToast, Icon, Section, EmptyHint, Button, IconButton } from "@/components/ui";
import { MachineDraftFlag, OtherCopyHint } from "../../shared/bilingual-ui";
import { traitIn } from "@/features/guideline-site";
import { Lang, Workspace } from "@/types";
import { InlineText, MiniInput } from "../../shared/inputs";
import { KeyTermsSection } from "./key-terms";

export function ToneTab({ ws, lang }: { ws: Workspace; lang: Lang }) {
  const { addVoiceTrait, updateVoiceTrait, removeVoiceTrait, uiLang } = useAppActions();
  const { showToast } = useToast();
  const [adding, setAdding] = useState(false);
  const [traitName, setTraitName] = useState("");
  const [traitDo, setTraitDo] = useState("");
  const [traitDont, setTraitDont] = useState("");
  const isAr = lang === "ar";

  function submitTrait(e: FormEvent) {
    e.preventDefault();
    if (!traitName.trim() || !traitDo.trim()) return;
    addVoiceTrait(
      ws.id,
      isAr
        ? {
            trait: "",
            doExample: "",
            dontExample: "",
            traitAr: traitName.trim(),
            doExampleAr: traitDo.trim(),
            dontExampleAr: traitDont.trim(),
          }
        : { trait: traitName.trim(), doExample: traitDo.trim(), dontExample: traitDont.trim() }
    );
    setTraitName("");
    setTraitDo("");
    setTraitDont("");
    setAdding(false);
    showToast(isAr ? "تمت إضافة سمة." : "Trait added.", "success");
  }

  return (
    <>
    <Section
      title={isAr ? "الشخصية والنبرة" : "Personality & tone"}
      icon="quote-right"
      right={
        <Button variant="ghost" size="sm" onClick={() => setAdding((v) => !v)}>
          {adding ? (isAr ? "إلغاء" : "Cancel") : isAr ? "+ إضافة" : "+ Add"}
        </Button>
      }
    >
      {adding && (
        <form onSubmit={submitTrait} className="rounded-card p-4 flex flex-col gap-field-stack-compact" style={{ background: "var(--surface-2)" }}>
          <MiniInput
            value={traitName}
            onChange={setTraitName}
            placeholder={isAr ? "السمة — مثلًا: مباشرة" : "Trait — e.g. Direct"}
          />
          <MiniInput
            value={traitDo}
            onChange={setTraitDo}
            placeholder={isAr ? "افعل: جملة مثال حقيقية" : "Do: a real example sentence"}
          />
          <MiniInput
            value={traitDont}
            onChange={setTraitDont}
            placeholder={isAr ? "لا تفعل: ما يجب تجنبه" : "Don't: what to avoid"}
          />
          <Button type="submit" variant="primary" size="sm" className="self-start">
            {isAr ? "إضافة سمة" : "Add trait"}
          </Button>
        </form>
      )}
      {ws.strategy.voiceTraits.length === 0 ? (
        <EmptyHint>
          {isAr
            ? "لا توجد سمات بعد — مثالان على «افعل / لا تفعل» أنفع من فقرة كاملة من الصفات."
            : "No personality traits yet — a couple of do/don't examples do more than a paragraph of adjectives."}
        </EmptyHint>
      ) : (
        <div className="flex flex-col gap-2.5">
          {ws.strategy.voiceTraits.map((t) => {
            const shown = traitIn(t, lang, false);
            const flagged = ws.strategyTranslation.unreviewed.includes(`trait:${t.id}`);
            return (
              <div key={t.id} className="rounded-card p-4 flex flex-col gap-2 mk-card" style={{ background: "var(--surface-2)" }}>
                {/* Four fixed columns squeezed the Do and Don't examples to
                    12px wide on a phone. They stack below the breakpoint and
                    keep the side-by-side comparison — which is the whole point
                    of the row — wherever there is width for it. */}
                <div className="grid gap-2 items-start grid-cols-1 lg:grid-cols-[110px_1fr_1fr_auto]">
                  <InlineText
                    value={shown.trait}
                    isAr={isAr}
                    placeholder={isAr ? "السمة" : "Trait"}
                    className="font-semibold text-[13px]"
                    onCommit={(next) => updateVoiceTrait(ws.id, t.id, isAr ? { traitAr: next } : { trait: next })}
                  />
                  <div className="flex items-start gap-2 text-[12px] min-w-0">
                    <Icon name="check" size={13} style={{ color: "var(--success)", marginTop: 4, flexShrink: 0 }} />
                    <InlineText
                      value={shown.doExample}
                      isAr={isAr}
                      multiline
                      placeholder={isAr ? "افعل: جملة حقيقية" : "Do: a real sentence"}
                      className="flex-1 min-w-0"
                      style={{ color: "var(--text-secondary)" }}
                      onCommit={(next) =>
                        updateVoiceTrait(ws.id, t.id, isAr ? { doExampleAr: next } : { doExample: next })
                      }
                    />
                  </div>
                  <div className="flex items-start gap-2 text-[12px] min-w-0">
                    <Icon name="times" size={13} style={{ color: "var(--danger)", marginTop: 4, flexShrink: 0 }} />
                    <InlineText
                      value={shown.dontExample}
                      isAr={isAr}
                      multiline
                      placeholder={isAr ? "لا تفعل: ما يجب تجنبه" : "Don't: what to avoid"}
                      className="flex-1 min-w-0"
                      style={{ color: "var(--text-muted)" }}
                      onCommit={(next) =>
                        updateVoiceTrait(ws.id, t.id, isAr ? { dontExampleAr: next } : { dontExample: next })
                      }
                    />
                  </div>
                  <IconButton
                    icon="times"
                    iconSize={16}
                    size="xs"
                    onClick={() => removeVoiceTrait(ws.id, t.id)}
                    label={
                      isAr ? `حذف ${shown.trait || "السمة"}` : `Remove ${shown.trait || "trait"}`
                    }
                    className="self-start mt-1"
                  />
                </div>
                {flagged && <MachineDraftFlag isAr={uiLang(ws) === "ar"} />}
                {isAr && (
                  <OtherCopyHint
                    rich={false}
                    text={[t.trait, t.doExample, t.dontExample].filter(Boolean).join(" · ")}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </Section>
    <KeyTermsSection ws={ws} isAr={uiLang(ws) === "ar"} />
    </>
  );
}
