// Public API of the call notes feature. Code outside features/callnotes/
// imports from "./", never from a file inside it.
export { CallNoteDetail, CallNoteEditor, DiscoveryView, RelatedCalls, callHref } from "./components";
export * from "./hooks/pages";
export { useCallNote } from "./hooks/shared/use-call-note";
export type * from "./types";
