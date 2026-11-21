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

export type HelpLocale = "en" | "ar";
export type HelpArticleType = "guide" | "tutorial" | "faq" | "troubleshooting";
export type HelpAudience = "all" | "studio" | "freelancer" | "company";
export type HelpStatus = "draft" | "in_review" | "scheduled" | "published" | "archived";

export type HelpMediaRef = { id: string; url: string; altEn: string; altAr: string };

export type HelpTranslation = {
  title: string;
  slug: string;
  summary: string;
  bodyHtml: string;
  seoTitle: string;
  seoDescription: string;
  ogImage: HelpMediaRef | null;
  status: HelpStatus;
  isPublished: boolean;
  publishedAt: string | null;
  submittedBy: string | null;
  submittedAt: string | null;
  scheduledFor: string | null;
  reviewComment: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
};

/** One article as the editor loads it. */
export type HelpArticleDoc = {
  id: string;
  version: number;
  categoryId: number | null;
  type: HelpArticleType;
  audience: HelpAudience;
  visibility: HelpVisibility;
  authorId: number | null;
  tagIds: number[];
  relatedIds: string[];
  lastReviewed: string | null;
  createdAt: string;
  updatedAt: string;
  updatedBy: string | null;
  translations: Record<HelpLocale, HelpTranslation | null>;
  /** The zone scheduled times are shown and entered in (e.g. "Asia/Kuala_Lumpur"). */
  timezone: string;
};

export type HelpWorkflowAction = "submit" | "publish" | "schedule" | "unschedule" | "send_back" | "archive" | "unarchive";

/** What a signed preview link returns: the draft of one language. */
export type HelpPreview = {
  preview: true;
  locale: HelpLocale;
  status: HelpStatus;
  title: string;
  summary: string;
  bodyHtml: string;
  type: HelpArticleType;
  author: string | null;
  lastReviewed: string | null;
};

/** What the editor sends: the doc's editable fields; a language left empty is dropped. */
export type HelpTranslationDraft = Pick<HelpTranslation, "title" | "slug" | "summary" | "bodyHtml" | "seoTitle" | "seoDescription" | "ogImage">;
export type HelpArticleDraft = Pick<HelpArticleDoc, "categoryId" | "type" | "audience" | "visibility" | "authorId" | "tagIds" | "relatedIds" | "lastReviewed"> & {
  translations: Record<HelpLocale, HelpTranslationDraft>;
};

export type HelpArticleRow = {
  id: string;
  titleEn: string;
  titleAr: string;
  categoryId: number | null;
  categoryEn: string;
  categoryAr: string;
  type: HelpArticleType;
  visibility: HelpVisibility;
  status: Record<HelpLocale, HelpStatus | null>;
  updatedAt: string;
  updatedBy: string | null;
};

export type HelpVersion = { number: number; createdAt: string; updatedAt: string; createdBy: string | null };
