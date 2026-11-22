"use client";

import { PageHeader } from "@/components/ui";
import { SINGLE_TEXT_TABS } from "../../constants";
import type { StrategyPageState } from "../../hooks/use-strategy-page";
import { AudienceTab } from "./tabs/audience-tab";
import { CompetitiveTab } from "./tabs/competitive-tab";
import { CoreValuesTab } from "./tabs/core-values-tab";
import { ObjectivesTab } from "./tabs/objectives-tab";
import { PositioningOptionsTab } from "./tabs/positioning-options-tab";
import { SingleTextTab } from "./tabs/single-text-tab";
import { TabSequence } from "./tab-sequence";
import { StrategySectionNav } from "./section-nav";
import { strategyCopy } from "../../copy";
import { ToneTab } from "./tabs/tone-tab";
import { TranslationNotice } from "../translate/translate-strategy";
import { VisionMissionTab } from "./tabs/vision-mission-tab";

/** Edit mode: the page's heading, the open section, and the way to the next. */
export function StrategyEditView({ ws, isAr, lang, tab, slug, emptyTabs }: StrategyPageState["edit"]) {
  const single = tab === "purpose" || tab === "positioning" || tab === "uvp" ? SINGLE_TEXT_TABS[tab] : null;
  return (
    // The section list beside the section (a row above it under 1024px), in one scroll.
    <div className="flex min-h-0 flex-1 overflow-auto px-7 py-6.5">
    <div className="grid w-full max-w-[1100px] grid-cols-1 content-start gap-space-8 lg:grid-cols-[240px_minmax(0,820px)]">
    <StrategySectionNav slug={slug} current={tab} empty={emptyTabs} isAr={isAr} />
    <div className="flex min-w-0 flex-col gap-5">
      {/* The page's own heading: without it the screen announced itself as an
          unlabelled region containing eight unlabelled boxes. */}
      <PageHeader title={isAr ? "الاستراتيجية" : "Strategy"} description={strategyCopy(isAr).sections.description} />
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
      <TabSequence current={tab} slug={slug} isAr={isAr} empty={emptyTabs} />
    </div>
    </div>
    </div>
  );
}
