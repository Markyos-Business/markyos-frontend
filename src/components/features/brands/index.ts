// Public API of the brands feature. Code outside features/brands/
// imports from "@/features/brands", never from a file inside it.
export { BrandLimitView } from "./components/new/BrandLimitView";
export { BrandsHeader } from "./components/list/BrandsHeader";
export { BrandsView } from "./components/list/BrandsView";
export { NewBrandView } from "./components/new/NewBrandView";
export { WorkspaceCard } from "./components/list/WorkspaceCard";
export { useBrandsPage } from "./hooks/list/useBrandsPage";
export { useNewBrandPage } from "./hooks/new/useNewBrandPage";
export type { DetectedFont, DocumentAnalysis } from "./services/brandsService";
export { analyzeBrandDocument, nameFromFileName, strategyFieldCount, suggestedColors } from "./services/brandsService";
