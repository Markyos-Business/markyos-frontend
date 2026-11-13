// Public API of the templates feature. Code outside features/templates/
// imports from "./", never from a file inside it.
export { TemplatesHeader } from "./components/templates-header";
export { TemplatesView } from "./components/templates-view";
export { useTemplatesPage } from "./hooks/use-templates-page";
