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
  /** Listed under "Getting started" on the Help Center home. */
  gettingStarted: boolean;
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
export type HelpArticleDraft = Pick<HelpArticleDoc, "categoryId" | "type" | "audience" | "visibility" | "gettingStarted" | "authorId" | "tagIds" | "relatedIds" | "lastReviewed"> & {
  translations: Record<HelpLocale, HelpTranslationDraft>;
};

export type HelpFeedbackReason = "outdated" | "unclear" | "missing_steps" | "not_solved";

/** One visitor's answer to "Was this article helpful?" (C6). */
export type HelpFeedbackRow = {
  id: number;
  articleId: string;
  titleEn: string;
  titleAr: string;
  locale: HelpLocale;
  helpful: boolean;
  reasons: HelpFeedbackReason[];
  comment: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  resolvedBy: string | null;
};

export type HelpFeedbackList = {
  results: HelpFeedbackRow[];
  articles: { id: string; titleEn: string; titleAr: string }[];
  summary: Record<string, { yes: number; no: number }>;
};

/** The Help Center dashboard for a period (C9). */
export type HelpAnalytics = {
  from: string;
  to: string;
  totals: { articleViews: number; votes: number; helpfulPct: number | null; searches: number; zeroResultSearches: number; clickThroughPct: number | null };
  daily: { date: string; views: number; searches: number }[];
  articles: HelpAnalyticsArticle[];
  mostViewed: HelpAnalyticsArticle[];
  leastHelpful: HelpAnalyticsArticle[];
  topics: { id: number; titleEn: string; titleAr: string; articleViews: number; topicPageViews: number; helpfulPct: number | null }[];
  reasons: { reason: HelpFeedbackReason; count: number }[];
  topSearches: HelpAnalyticsSearch[];
  zeroResults: HelpAnalyticsSearch[];
  stale: { id: string; titleEn: string; titleAr: string; lastReviewed: string | null; since: string | null }[];
  staleDays: number;
  leastHelpfulMinVotes: number;
};
export type HelpAnalyticsArticle = { id: string; titleEn: string; titleAr: string; categoryId: number | null; views: number; helpful: number; notHelpful: number; helpfulPct: number | null };
export type HelpAnalyticsSearch = { term: string; locale: HelpLocale; searches: number; clicks: number; ctr: number };

/** A card in the help panel's lists. */
export type HelpCardItem = { id: string; title: string; slug: string; summary: string; type: HelpArticleType; categorySlug: string; categoryTitle: string };

/** One article as the in-app help panel reads it. */
export type HelpAppArticle = HelpCardItem & {
  locale: HelpLocale;
  bodyHtml: string;
  publishedAt: string | null;
  related: HelpCardItem[];
  /** False: shown in the language it has, because it isn't published in the reader's. */
  inLocale: boolean;
  /** Also on the public website (not signed-in-only). */
  onWebsite: boolean;
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
