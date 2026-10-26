// Public API of the templates feature. Code outside features/templates/
// imports from "@/components/features/templates", never from a file inside it.
export { TemplatesHeader } from "./components/TemplatesHeader";
export { TemplatesView } from "./components/TemplatesView";
export { useTemplatesPage } from "./hooks/useTemplatesPage";
