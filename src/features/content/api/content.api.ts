import { api } from "@/lib/api/client";
import type {
  ArticleDoc,
  ArticleDraft,
  ArticleRow,
  Author,
  Category,
  ContentKind,
  ContentMe,
  MediaItem,
  Tag,
} from "../types";

export const getMe = () => api<ContentMe>("/content/me/");

export const listArticles = (kind?: ContentKind) =>
  api<{ results: ArticleRow[] }>(`/content/articles/${kind ? `?kind=${kind}` : ""}`).then((r) => r.results);

export const getArticle = (id: string) => api<ArticleDoc>(`/content/articles/${id}/`);

export const createArticle = (kind: ContentKind, slug: string, title: { en?: string; ar?: string }) =>
  api<ArticleDoc>("/content/articles/", {
    method: "POST",
    body: {
      kind,
      slug,
      translations: Object.fromEntries(
        Object.entries(title).filter(([, v]) => v?.trim()).map(([locale, v]) => [locale, { title: v!.trim() }])
      ),
    },
  });

/** The draft in the API's shape: ids for references, camelCase fields. */
function toInput(draft: ArticleDraft) {
  const translation = (t: ArticleDraft["translations"]["en"]) => ({
    title: t.title,
    excerpt: t.excerpt,
    bodyHtml: t.bodyHtml,
    seoTitle: t.seoTitle,
    seoDescription: t.seoDescription,
    heroCaption: t.heroCaption,
    heroImageId: t.heroImage?.id ?? null,
  });
  return {
    slug: draft.slug,
    publishedOn: draft.publishedOn,
    provisional: draft.provisional,
    guideType: draft.guideType,
    competitorName: draft.competitorName,
    downloadFileId: draft.downloadFile?.id ?? null,
    authorId: draft.authorId,
    categoryId: draft.categoryId,
    tagIds: draft.tagIds,
    translations: { en: translation(draft.translations.en), ar: translation(draft.translations.ar) },
  };
}

export const saveArticle = (id: string, draft: ArticleDraft, version: number) =>
  api<ArticleDoc>(`/content/articles/${id}/`, { method: "PUT", body: { ...toInput(draft), version } });

export const publishArticle = (id: string, version: number) =>
  api<ArticleDoc>(`/content/articles/${id}/publish/`, { method: "POST", body: { version } });

export const unpublishArticle = (id: string) =>
  api<ArticleDoc>(`/content/articles/${id}/publish/`, { method: "DELETE" });

export const deleteArticle = (id: string) => api<void>(`/content/articles/${id}/`, { method: "DELETE" });

export const listVersions = (id: string) =>
  api<{ results: { number: number; createdAt: string; createdBy: string | null }[] }>(`/content/articles/${id}/versions/`).then((r) => r.results);

export const restoreVersion = (id: string, number: number) =>
  api<ArticleDoc>(`/content/articles/${id}/versions/${number}/restore/`, { method: "POST" });

export const listMedia = () => api<{ results: MediaItem[] }>("/content/media/").then((r) => r.results);

export function uploadMedia(file: File, alt: { en?: string; ar?: string } = {}) {
  const body = new FormData();
  body.append("file", file);
  if (alt.en) body.append("altEn", alt.en);
  if (alt.ar) body.append("altAr", alt.ar);
  return api<MediaItem>("/content/media/", { method: "POST", body });
}

export const listAuthors = () => api<Author[]>("/content/authors/");
export const listCategories = () => api<Category[]>("/content/categories/");
export const listTags = () => api<Tag[]>("/content/tags/");
