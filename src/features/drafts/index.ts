// Public API of the drafts feature. Code outside features/drafts/
// imports from "./", never from a file inside it.
export { DraftsView } from "./components/drafts-view";
export { useDraftsPage } from "./hooks/use-drafts-page";
