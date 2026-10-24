"use client";

import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { EditableField, Section, richIsEmpty } from "@/components/ui";
import { MachineDraftFlag, OtherCopyHint } from "@/components/features/strategy/components/BilingualUI";
import { strategyText, textKey } from "@/components/features/guideline-site";
import { Lang, Workspace } from "@/types";

export function VisionMissionTab({ ws, lang }: { ws: Workspace; lang: Lang }) {
  const { setStrategyText, uiLang } = useApp();
  const [visionDraft, setVisionDraft] = useState<string | null>(null);
  const [missionDraft, setMissionDraft] = useState<string | null>(null);

  const isAr = lang === "ar";
  const vision = strategyText(ws.strategy, "vision", lang, false);
  const mission = strategyText(ws.strategy, "mission", lang, false);
  const flagged = (field: "vision" | "mission") =>
    ws.strategyTranslation.unreviewed.includes(textKey(field, lang));

  return (
    <Section title={isAr ? "الرؤية والرسالة" : "Vision & mission"} icon="bullseye">
      {flagged("vision") && <MachineDraftFlag isAr={uiLang(ws) === "ar"} />}
      <EditableField
        label={isAr ? "الرؤية" : "Vision"}
        placeholder={
          isAr
            ? "المستقبل الذي تعمل هذه العلامة من أجله — العالم الذي تريده أن يوجد."
            : "The future this brand is working toward — the world it wants to exist in."
        }
        value={visionDraft ?? vision}
        editing={visionDraft !== null}
        multiline
        rich
        isAr={isAr}
        onStart={() => setVisionDraft(vision)}
        onChange={setVisionDraft}
        onCommit={() => {
          if (visionDraft !== null) {
            setStrategyText(ws.id, "vision", richIsEmpty(visionDraft) ? "" : visionDraft, lang);
          }
          setVisionDraft(null);
        }}
      />
      {lang === "ar" && <OtherCopyHint text={strategyText(ws.strategy, "vision", "en", false)} />}

      {flagged("mission") && <MachineDraftFlag isAr={uiLang(ws) === "ar"} />}
      <EditableField
        label={isAr ? "الرسالة" : "Mission"}
        placeholder={
          isAr
            ? "كيف تترجم العلامة تلك الرؤية إلى عمل يومي؟"
            : "How does the brand act on that vision, day to day?"
        }
        value={missionDraft ?? mission}
        editing={missionDraft !== null}
        multiline
        rich
        isAr={isAr}
        onStart={() => setMissionDraft(mission)}
        onChange={setMissionDraft}
        onCommit={() => {
          if (missionDraft !== null) {
            setStrategyText(ws.id, "mission", richIsEmpty(missionDraft) ? "" : missionDraft, lang);
          }
          setMissionDraft(null);
        }}
      />
      {lang === "ar" && <OtherCopyHint text={strategyText(ws.strategy, "mission", "en", false)} />}
    </Section>
  );
}
