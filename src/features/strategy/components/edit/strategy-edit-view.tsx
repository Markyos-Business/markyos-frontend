"use client";

import { SINGLE_TEXT_TABS } from "../../constants";
import type { StrategyPageState } from "../../hooks/use-strategy-page";
import { AudienceTab } from "./tabs/audience-tab";
import { CompetitiveTab } from "./tabs/competitive-tab";
import { CoreValuesTab } from "./tabs/core-values-tab";
import { ObjectivesTab } from "./tabs/objectives-tab";
import { PositioningOptionsTab } from "./tabs/positioning-options-tab";
import { SingleTextTab } from "./tabs/single-text-tab";
import { TabSequence } from "./tab-sequence";
import { ToneTab } from "./tabs/tone-tab";
import { TranslationNotice } from "../translate/translate-strategy";
import { VisionMissionTab } from "./tabs/vision-mission-tab";

/** Edit mode: the page's heading, the open section, and the way to the next. */
export function StrategyEditView({ ws, isAr, lang, tab, onTab, emptyTabs }: StrategyPageState["edit"]) {
  const single = tab === "purpose" || tab === "positioning" || tab === "uvp" ? SINGLE_TEXT_TABS[tab] : null;
  return (
    <div className="flex min-h-0 max-w-[820px] flex-1 flex-col gap-5 overflow-auto px-7 py-6.5">
      {/* The page's own heading: without it the screen announced itself as an
          unlabelled region containing eight unlabelled boxes. */}
      <div className="flex flex-col gap-1.5">
        <h1 className="font-display text-[26px] font-semibold tracking-tight">{isAr ? "الاستراتيجية" : "Strategy"}</h1>
        <p className="max-w-[64ch] text-[13.5px] text-text-muted">
          {isAr
            ? "الطبقة التي تعلو الملفات: لماذا توجد العلامة، ولمن، وبأي صوت. كل قسم في تبويب أعلاه."
            : "The layer above the files: why this brand exists, who it is for, and how it sounds. Each section is a tab above."}
        </p>
      </div>
      <TranslationNotice ws={ws} isAr={isAr} />
      <div key={`${tab}-${lang}`} className="flex flex-col gap-5">
        {single && <SingleTextTab ws={ws} lang={lang} {...single} />}
        {tab === "vision-mission" && <VisionMissionTab ws={ws} lang={lang} />}
        {tab === "objectives" && <ObjectivesTab ws={ws} lang={lang} />}
        {tab === "core-values" && <CoreValuesTab ws={ws} lang={lang} />}
        {tab === "positioning-options" && <PositioningOptionsTab ws={ws} lang={lang} />}
        {tab === "audience" && <AudienceTab ws={ws} lang={lang} />}
        {tab === "competitive" && <CompetitiveTab ws={ws} lang={lang} />}
        {tab === "tone" && <ToneTab ws={ws} lang={lang} />}
      </div>
      <TabSequence current={tab} onSelect={onTab} isAr={isAr} empty={emptyTabs} />
    </div>
  );
}
