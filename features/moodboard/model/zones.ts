import { nBetween } from "@/shared/lib/doc/core/order";
import { uid } from "@/shared/lib/utils";
import { MOODBOARD_TEMPLATES, templateByKey } from "./templates";
import type { MoodboardZone, ZoneKind } from "@/core/data/types";

/**
 * Building a board's zones from a template.
 *
 * Shared by the store (creating a board) and the hydration backfill (giving an
 * old flat board somewhere to put its images), because those two have to agree
 * exactly — a board created today and a board migrated from last month should
 * be indistinguishable afterwards.
 */

export const DEFAULT_TEMPLATE_KEY = "brand-identity";

export function zonesFromTemplate(templateKey: string | undefined): MoodboardZone[] {
  const template = templateByKey(templateKey) ?? templateByKey(DEFAULT_TEMPLATE_KEY)!;
  const keys = nBetween(null, null, template.zones.length);
  return template.zones.map((zone, i) => ({
    id: uid(),
    kind: zone.kind,
    title: zone.title,
    arTitle: zone.arTitle,
    // Copied onto the zone rather than looked up at render time, so renaming a
    // zone or editing its brief does not silently revert the next time the
    // template's copy is revised.
    instructions: zone.instructions,
    arInstructions: zone.arInstructions,
    order: keys[i],
    items: [],
  }));
}

/** The tray every board ends with. */
export function unsortedZone(order: string): MoodboardZone {
  const spec = MOODBOARD_TEMPLATES[0].zones.find((z) => z.kind === "unsorted");
  return {
    id: uid(),
    kind: "unsorted",
    title: spec?.title ?? "Unsorted",
    arTitle: spec?.arTitle ?? "غير مصنّف",
    instructions: spec?.instructions,
    arInstructions: spec?.arInstructions,
    order,
    items: [],
  };
}

/** Where a card of this kind naturally belongs, for "add a swatch" and friends. */
export function zoneForKind(zones: MoodboardZone[], kind: ZoneKind): MoodboardZone | undefined {
  return zones.find((z) => z.kind === kind) ?? zones.find((z) => z.kind === "unsorted");
}
