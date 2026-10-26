// Public API of the brands feature. Code outside features/brands/
// imports from "@/features/brands", never from a file inside it.
export { BrandLimitView } from "./components/BrandLimitView";
export { BrandsHeader } from "./components/BrandsHeader";
export { BrandsView } from "./components/BrandsView";
export { NewBrandView } from "./components/NewBrandView";
export { WorkspaceCard } from "./components/WorkspaceCard";
export { useBrandsPage } from "./hooks/useBrandsPage";
export { useNewBrandPage } from "./hooks/useNewBrandPage";
export type { DetectedFont, DocumentAnalysis } from "./services/brandImport";
export { analyzeBrandDocument, nameFromFileName, strategyFieldCount, suggestedColors } from "./services/brandImport";
