"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { EditableField, Section } from "@/components/workspace/SectionUI";
import { MachineDraftFlag, OtherCopyHint } from "@/components/workspace/strategy/BilingualUI";
import { richIsEmpty } from "@/components/RichText";
import { strategyText, textKey } from "@/lib/strategyLang";
import { Lang, Workspace } from "@/lib/types";

type Field = "purpose" | "mission" | "vision" | "targetAudienceSummary" | "positioningStatement" | "uvp";

/** Purpose, Positioning, and UVP are all "one free-text field with a title
 *  and hint" — this is that shared shape so those three tabs aren't three
 *  near-identical files. */
export function SingleTextTab({
  ws,
  lang,
  field,
  icon,
  title,
  arTitle,
  hint,
  arHint,
  placeholder,
  arPlaceholder,
  multiline = true,
  rich = true,
}: {
  ws: Workspace;
  /** Which language copy is being written — and, since one switch drives
   *  both, which language this tab's own labels are written in. */
  lang: Lang;
  field: Field;
  icon: string;
  title: string;
  arTitle: string;
  hint: string;
  arHint: string;
  placeholder: string;
  arPlaceholder: string;
  multiline?: boolean;
  /** Purpose is one sentence and stays plain; everything longer is rich text. */
  rich?: boolean;
}) {
  const { setStrategyText } = useApp();
  const [draft, setDraft] = useState<string | null>(null);
  const isAr = lang === "ar";
  // No fallback to the other language here: a blank Arabic field has to look
  // blank, or it reads as finished and never gets written.
  const value = strategyText(ws.strategy, field, lang, false);
  const machine = ws.strategyTranslation.unreviewed.includes(textKey(field, lang));

  return (
    <Section title={isAr ? arTitle : title} icon={icon}>
      <p dir="auto" className="bidi-auto text-[13px] -mt-1" style={{ color: "var(--text-muted)" }}>
        {isAr ? arHint : hint}
      </p>
      {machine && <MachineDraftFlag isAr={ws.lang === "ar"} />}
      <EditableField
        label={isAr ? arTitle : title}
        placeholder={isAr ? arPlaceholder : placeholder}
        value={draft ?? value}
        editing={draft !== null}
        multiline={multiline}
        rich={rich}
        isAr={isAr}
        onStart={() => setDraft(value)}
        onChange={setDraft}
        onCommit={() => {
          // A rich value is markup — trimming it would only strip whitespace
          // between tags and can't be relied on to detect emptiness.
          if (draft !== null) {
            setStrategyText(ws.id, field, rich ? (richIsEmpty(draft) ? "" : draft) : draft.trim(), lang);
          }
          setDraft(null);
        }}
      />
      {lang === "ar" && <OtherCopyHint text={strategyText(ws.strategy, field, "en", false)} rich={rich} />}
    </Section>
  );
}
