import type { FlowItem } from "./types";

/**
 * Helpers shared by every template that renders its page from the flow.
 *
 * Each template keeps its own wording for the derived sections — Vault says
 * "Logo system", Signal says "Logo & Symbol" — so the titles stay per template
 * and only the lookup is shared. That was the point of the fallback argument on
 * `sectionTitle` in the first place: a studio's rename wins, and until there is
 * one the section sounds like the template it is being read in.
 */

/** A template's own default heading per section id, as [English, Arabic]. */
export type SectionTitles = Record<string, [string, string]>;

/**
 * What to call one item of the flow.
 *
 * A derived section takes the studio's rename if there is one and the
 * template's own wording otherwise. An authored one is titled by its own
 * block, because that title is the thing the studio typed on the page — there
 * is no separate override to consult, and keeping two would let them disagree.
 */
export function flowLabel(
  item: FlowItem,
  sectionTitle: (id: string, fallback: string) => string,
  titles: SectionTitles,
  isAr: boolean,
  index: number
): string {
  if (item.kind === "block") {
    const own = isAr ? item.block.arTitle : item.block.title;
    return own || (isAr ? `قسم ${index + 1}` : `Section ${index + 1}`);
  }
  const pair = titles[item.id];
  const fallback = pair ? (isAr ? pair[1] : pair[0]) : item.id;
  return sectionTitle(item.id, fallback);
}
