export type AssetType = "logo" | "photo" | "video" | "document";
export type AssetStatus = "approved" | "in-review" | "draft" | "rights-expiring" | "archived";
/** A market as a locale code, never a flag: "ar-SA", "ar-AE", "ar-EG". */
export type AssetMarket = "ar-SA" | "ar-AE" | "ar-EG";

export interface Asset {
  id: string;
  name: string;
  nameAr: string;
  type: AssetType;
  owner: string;
  market: AssetMarket;
  status: AssetStatus;
  /** ISO date the usage rights end, or null when they don't. */
  rightsExpiry: string | null;
  /** ISO timestamp. */
  updatedAt: string;
}
