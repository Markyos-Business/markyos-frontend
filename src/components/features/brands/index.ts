// Public API of the brands feature. Code outside features/brands/
// imports from "@/features/brands", never from a file inside it.
export { BrandsHeader } from "./components/BrandsHeader";
export { BrandsView } from "./components/BrandsView";
export { WorkspaceCard } from "./components/WorkspaceCard";
export { useBrandsPage } from "./hooks/useBrandsPage";
export type { DetectedFont, DocumentAnalysis } from "./services/brandImport";
export { analyzeBrandDocument, nameFromFileName, strategyFieldCount, suggestedColors } from "./services/brandImport";
