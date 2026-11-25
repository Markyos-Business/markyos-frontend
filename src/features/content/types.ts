/** Website content (markyos.com), as the content API returns it. */

export type ContentKind = "blog" | "guides" | "help" | "compare" | "whatsNew";
export type ContentLocale = "en" | "ar";
export type ContentRole = "admin" | "editor" | "viewer";

/** What the signed-in person can do; `role` is null without access. */
export type ContentMe = {
  role: ContentRole | null;
  sections: ContentKind[];
  canPublish: boolean;
  canManagePeople: boolean;
  canContribute: boolean;
};

export type MediaItem = {
  id: string;
  url: string;
  fileName: string;
  contentType: string;
  size: number;
  width: number | null;
  height: number | null;
  altEn: string;
  altAr: string;
  credit: string;
  createdAt: string;
};

/** A media reference inside an article (a subset of MediaItem). */
export type MediaRef = { id: string; url: string; altEn: string; altAr: string; width: number | null; height: number | null };

export type Translation = {
  title: string;
  excerpt: string;
  body_html: string;
  seo_title: string;
  seo_description: string;
  hero_caption: string;
  hero_image: MediaRef | null;
};

export type ArticleDoc = {
  id: string;
  kind: ContentKind;
  slug: string;
  publishedOn: string | null;
  provisional: boolean;
  guideType: "" | "checklist" | "template" | "worksheet";
  competitorName: string;
  downloadFile: MediaRef | null;
  author: { id: number; name: string } | null;
  category: { slug: string; en: string; ar: string } | null;
  tags: { slug: string; en: string; ar: string }[];
  translations: Partial<Record<ContentLocale, Translation>>;
  version: number;
  isPublished: boolean;
  publishedAt: string | null;
  hasUnpublishedChanges: boolean;
  updatedAt: string;
};

export type ArticleRow = {
  id: string;
  kind: ContentKind;
  slug: string;
  titleEn: string;
  titleAr: string;
  publishedOn: string | null;
  isPublished: boolean;
  updatedAt: string;
};

export type Author = { id: number; name: string; roleEn: string; roleAr: string; bioEn: string; bioAr: string; avatarId: string | null };
export type Category = { id: number; slug: string; labelEn: string; labelAr: string };
export type Tag = Category;

/** The editor's working copy of one language. */
export type TranslationDraft = {
  title: string;
  excerpt: string;
  bodyHtml: string;
  seoTitle: string;
  seoDescription: string;
  heroCaption: string;
  heroImage: MediaRef | null;
};

/** The editor's working copy of an article. */
export type ArticleDraft = {
  slug: string;
  publishedOn: string | null;
  provisional: boolean;
  guideType: ArticleDoc["guideType"];
  competitorName: string;
  downloadFile: MediaRef | null;
  authorId: number | null;
  categoryId: number | null;
  tagIds: number[];
  translations: Record<ContentLocale, TranslationDraft>;
};

/** One page of a list the server pages (DRF's shape). */
export type Paged<T> = { count: number; next: string | null; previous: string | null; results: T[] };

/** Which list a website sign-up joined. */
export type SignupTopic = "newsletter" | "contact" | "beta_studio" | "beta_company";

/** An address left on markyos.com: the newsletter, the contact list or a beta. */
export type WebsiteSignup = {
  id: number;
  email: string;
  topic: SignupTopic;
  locale: ContentLocale;
  country: string;
  createdAt: string;
};

/** What a contact-form message is about. */
export type MessageTopic = "sales" | "support" | "studios" | "press" | "security" | "feature" | "other";

/** A message sent through the website's contact form. */
export type ContactMessage = {
  id: number;
  name: string;
  email: string;
  topic: MessageTopic;
  who: string;
  company: string;
  country: string;
  phone: string;
  replyLanguage: string;
  locale: ContentLocale;
  message: string;
  createdAt: string;
  /** Whether the team was emailed about it; `emailError` says why not. */
  emailed: boolean;
  emailError: string;
};

/** A private, unindexed link to a draft on the website. */
export type ArticlePreview = { token: string; expiresAt: string; paths: Record<ContentLocale, string> };
