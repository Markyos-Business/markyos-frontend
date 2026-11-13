// Public API of the strategy feature. Code outside features/strategy/
// imports from "@/features/strategy", never from a file inside it.
export { AudienceTab } from "./components/edit/tabs/audience-tab";
export { CompetitiveTab } from "./components/edit/tabs/competitive-tab";
export { CoreValuesTab } from "./components/edit/tabs/core-values-tab";
export { ImportStrategyModal } from "./components/import/import-strategy-modal";
export { SingleTextTab } from "./components/edit/tabs/single-text-tab";
export { StrategyActions } from "./components/actions/strategy-actions";
export { StrategyEditView } from "./components/edit/strategy-edit-view";
export { StrategyReadView } from "./components/read/strategy-read-view";
export { useStrategyPage } from "./hooks/use-strategy-page";
export { ToneTab } from "./components/edit/tabs/tone-tab";
export { TranslateStrategy, TranslationNotice } from "./components/translate/translate-strategy";
export { VisionMissionTab } from "./components/edit/tabs/vision-mission-tab";
export { translateText, TranslationError } from "./api/strategy.api";
export type { TranslateDirection } from "./api/strategy.api";
