import { api, apiFile } from "@/lib/api/client";
import type {
  ArticleDoc,
  ArticleDraft,
  ArticlePreview,
  ContactMessage,
  Paged,
  WebsiteSignup,
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

export const restoreVersion = (id: string, number: number, version: number) =>
  api<ArticleDoc>(`/content/articles/${id}/versions/${number}/restore/`, { method: "POST", body: { version } });

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

// ---- library and admin ----------------------------------------------------------

export const updateMedia = (id: string, patch: { altEn?: string; altAr?: string; credit?: string }) =>
  api<MediaItem>(`/content/media/${id}/`, { method: "PATCH", body: patch });
export const deleteMedia = (id: string) => api<void>(`/content/media/${id}/`, { method: "DELETE" });

export const saveAuthor = (author: Omit<Author, "id"> & { id?: number }) =>
  author.id
    ? api<Author>(`/content/authors/${author.id}/`, { method: "PATCH", body: author })
    : api<Author>("/content/authors/", { method: "POST", body: author });
export const deleteAuthor = (id: number) => api<void>(`/content/authors/${id}/`, { method: "DELETE" });

type Label = Omit<Category, "id"> & { id?: number };
export const saveLabel = (kind: "categories" | "tags", item: Label) =>
  item.id
    ? api<Category>(`/content/${kind}/${item.id}/`, { method: "PATCH", body: item })
    : api<Category>(`/content/${kind}/`, { method: "POST", body: item });
export const deleteLabel = (kind: "categories" | "tags", id: number) => api<void>(`/content/${kind}/${id}/`, { method: "DELETE" });

export type Redirect = { id: number; fromPath: string; toPath: string; statusCode: 301 | 302 };
export const listRedirects = () => api<Redirect[]>("/content/redirects/");
export const saveRedirect = (r: Omit<Redirect, "id"> & { id?: number }) =>
  r.id
    ? api<Redirect>(`/content/redirects/${r.id}/`, { method: "PATCH", body: r })
    : api<Redirect>("/content/redirects/", { method: "POST", body: r });
export const deleteRedirect = (id: number) => api<void>(`/content/redirects/${id}/`, { method: "DELETE" });

export type Traffic = {
  days: number;
  views: number;
  visitors: number;
  byDay: { date: string; views: number }[];
  topPages: { path: string; views: number }[];
  devices: Record<string, number>;
  locales: Record<string, number>;
  referrers: { host: string; views: number }[];
};
export const getTraffic = (days = 30) => api<Traffic>(`/content/traffic/?days=${days}`);

export type Person = { id: number; userId: string; email: string; name: string; role: "admin" | "editor" | "viewer"; sections: ContentKind[]; notes: string; grantedAt: string };
export const listPeople = () => api<{ results: Person[] }>("/content/people/").then((r) => r.results);
export const grantAccess = (p: { email: string; role: Person["role"]; sections: ContentKind[]; notes?: string }) =>
  api<Person>("/content/people/", { method: "POST", body: p });
export const updateAccess = (id: number, p: Partial<Pick<Person, "role" | "sections" | "notes">>) =>
  api<Person>(`/content/people/${id}/`, { method: "PATCH", body: p });
export const revokeAccess = (id: number) => api<void>(`/content/people/${id}/`, { method: "DELETE" });

// ---- the website's inbox: sign-ups and contact messages -------------------------

/** `?topic=&q=&page=` with the empty ones left out. */
const inboxQuery = (q: { topic?: string; q?: string; page?: number }) => {
  const params = new URLSearchParams();
  if (q.topic) params.set("topic", q.topic);
  if (q.q) params.set("q", q.q);
  if (q.page && q.page > 1) params.set("page", String(q.page));
  const s = params.toString();
  return s ? `?${s}` : "";
};
export type InboxQuery = { topic?: string; q?: string; page?: number };

export const listSignups = (q: InboxQuery) => api<Paged<WebsiteSignup>>(`/content/signups/${inboxQuery(q)}`);
/** Every sign-up the filters match, as the server's CSV. */
export const exportSignups = (q: InboxQuery) => apiFile(`/content/signups/export/${inboxQuery({ ...q, page: undefined })}`);
export const deleteSignup = (id: number) => api<void>(`/content/signups/${id}/`, { method: "DELETE" });

export const listMessages = (q: InboxQuery) => api<Paged<ContactMessage>>(`/content/messages/${inboxQuery(q)}`);
export const getMessage = (id: string) => api<ContactMessage>(`/content/messages/${encodeURIComponent(id)}/`);
export const exportMessages = (q: InboxQuery) => apiFile(`/content/messages/export/${inboxQuery({ ...q, page: undefined })}`);
export const deleteMessage = (id: number) => api<void>(`/content/messages/${id}/`, { method: "DELETE" });

/** A seven-day, unindexed link to the article as saved, on the website. */
export const createPreview = (id: string) => api<ArticlePreview>(`/content/articles/${id}/preview/`, { method: "POST" });
