// Public API of the brands feature. Code outside features/brands/
// imports from "@/features/brands", never from a file inside it.
export { BrandLimitView } from "./components/new/brand-limit-view";
export { BrandsHeader } from "./components/list/brands-header";
export { BrandsView } from "./components/list/brands-view";
export { NewBrandView } from "./components/new/new-brand-view";
export { WorkspaceCard } from "./components/list/workspace-card";
export { useBrandsPage } from "./hooks/list/use-brands-page";
export { useNewBrandPage } from "./hooks/new/use-new-brand-page";
export type { DetectedFont, DocumentAnalysis } from "./api/brands.api";
export { analyzeBrandDocument, nameFromFileName, strategyFieldCount, suggestedColors } from "./api/brands.api";
