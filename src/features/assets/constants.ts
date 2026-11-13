import type { BadgeTone } from "@/components/ui";
import type { AssetStatus } from "./types";

/** Each status as the StatusDot tone that shows it (spec §6.8: the dot carries the colour). */
export const ASSET_STATUS_TONE: Record<AssetStatus, BadgeTone> = {
  approved: "success",
  "in-review": "info",
  draft: "neutral",
  "rights-expiring": "warning",
  archived: "neutral",
};

export const ASSETS_PER_PAGE = 5;
