// Public API of the call notes feature. Code outside features/callnotes/
// imports from "@/components/features/callnotes", never from a file inside it.
export { CallNoteDetail, CallNoteEditor, DiscoveryView, RelatedCalls, callHref } from "./components";
export { useCallNote } from "./hooks/useCallNote";
export type * from "./types";
