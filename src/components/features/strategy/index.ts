// Public API of the strategy feature. Code outside features/strategy/
// imports from "@/features/strategy", never from a file inside it.
export { AudienceTab } from "./components/edit/tabs/AudienceTab";
export { CompetitiveTab } from "./components/edit/tabs/CompetitiveTab";
export { CoreValuesTab } from "./components/edit/tabs/CoreValuesTab";
export { ImportStrategyModal } from "./components/import/ImportStrategyModal";
export { SingleTextTab } from "./components/edit/tabs/SingleTextTab";
export { StrategyActions } from "./components/actions/StrategyActions";
export { StrategyEditView } from "./components/edit/StrategyEditView";
export { StrategyReadView } from "./components/read/StrategyReadView";
export { useStrategyPage } from "./hooks/useStrategyPage";
export { ToneTab } from "./components/edit/tabs/ToneTab";
export { TranslateStrategy, TranslationNotice } from "./components/translate/TranslateStrategy";
export { VisionMissionTab } from "./components/edit/tabs/VisionMissionTab";
export { translateText, TranslationError } from "./services/strategyService";
export type { TranslateDirection } from "./services/strategyService";
