import type { Citation } from "../types";

/** Where a citation opens: the exact answer, or the exact turn or line of a call. */
export function citationHref(slug: string, citation: Citation): string {
  const ref = citation.ref;
  if (ref.type === "form") return `/w/${slug}/forms/${ref.formId}/answers?q=${ref.questionId}`;
  const at = ref.turn != null ? `?turn=${ref.turn}` : ref.para != null ? `?para=${ref.para}` : "";
  return `/w/${slug}/discovery/calls/${ref.noteId}${at}`;
}
