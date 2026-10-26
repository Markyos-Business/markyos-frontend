// Public API of the compliance feature. Code outside features/compliance/
// imports from "@/features/compliance", never from a file inside it.
export { AssetColorContent } from "./components/AssetColorContent";
export { CopyLinterContent } from "./components/CopyLinterContent";
export { useCompliancePage } from "./hooks/useCompliancePage";
export { detectScript, lintCopy } from "./model/copyLint";
