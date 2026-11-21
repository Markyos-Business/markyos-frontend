export type HelpVisibility = "public" | "signed_in";
export type HelpCategoryStatus = "active" | "hidden";

/** A category as the admin API returns it (both languages). */
export type HelpCategory = {
  id: number;
  parent: number | null;
  titleEn: string;
  titleAr: string;
  slugEn: string | null;
  slugAr: string | null;
  descriptionEn: string;
  descriptionAr: string;
  icon: string;
  visibility: HelpVisibility;
  status: HelpCategoryStatus;
  order: number;
  articleCount: number;
};

export type HelpCategoryInput = Partial<Omit<HelpCategory, "id" | "order" | "articleCount">> & { id?: number };
