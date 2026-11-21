import { api } from "@/lib/api/client";
import type { HelpFeedbackList, HelpFeedbackRow, HelpArticleDoc, HelpArticleDraft, HelpArticleRow, HelpCategory, HelpCategoryInput, HelpLocale, HelpPreview, HelpVersion, HelpWorkflowAction } from "../types";

export const listHelpCategories = () => api<HelpCategory[]>("/help/admin/categories/");

export const saveHelpCategory = ({ id, ...body }: HelpCategoryInput) =>
  id
    ? api<HelpCategory>(`/help/admin/categories/${id}/`, { method: "PATCH", body })
    : api<HelpCategory>("/help/admin/categories/", { method: "POST", body });

export const deleteHelpCategory = (id: number) => api<void>(`/help/admin/categories/${id}/`, { method: "DELETE" });

/** One level's new order: every sibling id once. */
export const reorderHelpCategories = (parent: number | null, ids: number[]) =>
  api<HelpCategory[]>("/help/admin/categories/reorder/", { method: "POST", body: { parent, ids } });

// ── Articles ──

export const listHelpArticles = (filters: { q?: string; category?: string; type?: string } = {}) => {
  const query = new URLSearchParams(Object.entries(filters).filter(([, v]) => v) as [string, string][]).toString();
  return api<{ results: HelpArticleRow[] }>(`/help/admin/articles/${query ? `?${query}` : ""}`).then((r) => r.results);
};

export const getHelpArticle = (id: string) => api<HelpArticleDoc>(`/help/admin/articles/${id}/`);

/** A new draft with a title (and slug) in one language. */
export const createHelpArticle = (locale: HelpLocale, title: string, slug: string) =>
  api<HelpArticleDoc>("/help/admin/articles/", { method: "POST", body: { translations: { [locale]: { title, slug } } } });

/** Saves the whole draft; `version` is the one it started from (409 if someone saved since). */
export const saveHelpArticle = (id: string, draft: HelpArticleDraft, version: number) => {
  // An empty language is sent as null, so a never-used language stays absent.
  const translations = Object.fromEntries(
    (Object.entries(draft.translations) as [HelpLocale, HelpArticleDraft["translations"][HelpLocale]][]).map(([locale, t]) => [
      locale,
      t.title || t.slug || t.bodyHtml ? { ...t, ogImage: t.ogImage?.id ?? null } : null,
    ]),
  );
  return api<HelpArticleDoc>(`/help/admin/articles/${id}/`, { method: "PUT", body: { ...draft, translations, version } });
};

export const deleteHelpArticle = (id: string) => api<void>(`/help/admin/articles/${id}/`, { method: "DELETE" });
export const duplicateHelpArticle = (id: string) => api<HelpArticleDoc>(`/help/admin/articles/${id}/duplicate/`, { method: "POST" });
export const archiveHelpArticle = (id: string) => api<HelpArticleDoc>(`/help/admin/articles/${id}/archive/`, { method: "POST" });
export const unarchiveHelpArticle = (id: string) => api<HelpArticleDoc>(`/help/admin/articles/${id}/archive/`, { method: "DELETE" });
export const listHelpVersions = (id: string) => api<{ results: HelpVersion[] }>(`/help/admin/articles/${id}/versions/`).then((r) => r.results);
export const restoreHelpVersion = (id: string, number: number, version: number) =>
  api<HelpArticleDoc>(`/help/admin/articles/${id}/versions/${number}/restore/`, { method: "POST", body: { version } });

// ── Workflow (C7) ──

/** One step for one language. `at` is "YYYY-MM-DDTHH:mm" in the Help timezone. */
export const helpWorkflow = (id: string, locale: HelpLocale, action: HelpWorkflowAction, extra: { version?: number; at?: string; comment?: string } = {}) =>
  api<HelpArticleDoc>(`/help/admin/articles/${id}/workflow/`, { method: "POST", body: { locale, action, ...extra } });

export const createHelpPreview = (id: string, locale: HelpLocale) =>
  api<{ token: string; path: string; expiresAt: string }>(`/help/admin/articles/${id}/preview/`, { method: "POST", body: { locale } });

export const getHelpPreview = (token: string) => api<HelpPreview>(`/help/public/preview/${encodeURIComponent(token)}/`);

/** Feedback on articles (C6): ?article=&helpful=yes|no&reason=&status=open|resolved&locale=. */
export const listHelpFeedback = (filters: Record<string, string>) => {
  const query = new URLSearchParams(Object.entries(filters).filter(([, v]) => v)).toString();
  return api<HelpFeedbackList>(`/help/admin/feedback/${query ? `?${query}` : ""}`);
};

export const resolveHelpFeedback = (id: number, resolved: boolean) =>
  api<HelpFeedbackRow>(`/help/admin/feedback/${id}/`, { method: "PATCH", body: { resolved } });
