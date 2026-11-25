"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api/client";
import { useToast } from "@/components/ui";
import { createPreview, deleteArticle, getArticle, publishArticle, saveArticle, unpublishArticle, restoreVersion } from "../api/content.api";
import { MARKETING_URL } from "@/lib/marketing";
import type { ArticleDoc, ArticleDraft, ContentLocale, TranslationDraft } from "../types";
import { useContentLang } from "./use-content-lang";
import { errorText } from "@/lib/api/errorText";

const emptyTranslation = (): TranslationDraft => ({
  title: "", excerpt: "", bodyHtml: "", seoTitle: "", seoDescription: "", heroCaption: "", heroImage: null,
});

/** The editor's working copy, from what the server holds. */
export function toDraft(doc: ArticleDoc): ArticleDraft {
  const translation = (locale: ContentLocale): TranslationDraft => {
    const t = doc.translations[locale];
    if (!t) return emptyTranslation();
    return {
      title: t.title, excerpt: t.excerpt, bodyHtml: t.body_html, seoTitle: t.seo_title,
      seoDescription: t.seo_description, heroCaption: t.hero_caption, heroImage: t.hero_image,
    };
  };
  return {
    slug: doc.slug,
    publishedOn: doc.publishedOn,
    provisional: doc.provisional,
    guideType: doc.guideType,
    competitorName: doc.competitorName,
    downloadFile: doc.downloadFile,
    authorId: doc.author?.id ?? null,
    categoryId: null,
    tagIds: [],
    translations: { en: translation("en"), ar: translation("ar") },
  };
}

/**
 * One article being edited: its server copy, the working draft, and the
 * actions on it. Saves name the version they started from; when someone
 * else saved in between, their copy is loaded and the person is told.
 */
export function useArticleEditor(id: string, lookups: { categoryIdBySlug: (slug: string) => number | null; tagIdsBySlugs: (slugs: string[]) => number[] }) {
  const { c, lang } = useContentLang();
  const { showToast } = useToast();
  const [doc, setDoc] = useState<ArticleDoc | null>(null);
  const [draft, setDraft] = useState<ArticleDraft | null>(null);
  // The draft as last loaded or saved: what "unsaved changes" compares to.
  const [saved, setSaved] = useState<ArticleDraft | null>(null);
  // The load failure itself; it becomes words at render, in the reader's language.
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState<null | "save" | "publish" | "unpublish" | "delete" | "restore" | "preview">(null);

  const adopt = useCallback(
    (next: ArticleDoc) => {
      const loaded = {
        ...toDraft(next),
        categoryId: next.category ? lookups.categoryIdBySlug(next.category.slug) : null,
        tagIds: lookups.tagIdsBySlugs(next.tags.map((t) => t.slug)),
      };
      setDoc(next);
      setDraft(loaded);
      setSaved(loaded);
    },
    [lookups],
  );

  useEffect(() => {
    let live = true;
    getArticle(id)
      .then((next) => live && adopt(next))
      .catch((e: unknown) => live && setError(e ?? new Error()));
    return () => {
      live = false;
    };
  }, [id, adopt]);

  const dirty = !!draft && !!saved && JSON.stringify(draft) !== JSON.stringify(saved);

  const handle = useCallback(
    async (kind: NonNullable<typeof busy>, run: () => Promise<ArticleDoc | void>, done?: string) => {
      setBusy(kind);
      try {
        const next = await run();
        if (next) adopt(next);
        if (done) showToast(done, "success");
        return true;
      } catch (e: unknown) {
        const current = e instanceof ApiError ? (e.data as { current?: ArticleDoc } | null)?.current : undefined;
        if (e instanceof ApiError && e.status === 409 && current) {
          adopt(current);
          showToast(c.editor.conflict, "danger");
        } else {
          showToast(errorText(e, lang), "danger");
        }
        return false;
      } finally {
        setBusy(null);
      }
    },
    [adopt, c.editor.conflict, lang, showToast],
  );

  const save = () => (doc && draft ? handle("save", () => saveArticle(doc.id, draft, doc.version), c.editor.saved) : Promise.resolve(false));

  /** Saves first when there are unsaved edits, so what goes live is what is on screen. */
  const publish = async () => {
    if (!doc || !draft) return false;
    let version = doc.version;
    if (dirty) {
      let saved: ArticleDoc | null = null;
      const ok = await handle("save", async () => (saved = await saveArticle(doc.id, draft, doc.version)));
      if (!ok || !saved) return false;
      version = (saved as ArticleDoc).version;
    }
    return handle("publish", () => publishArticle(doc.id, version), c.editor.published);
  };

  /**
   * Opens the article as saved on the website, in `locale`, in a new tab.
   * Unsaved edits are saved first (the same path as Save), so the preview
   * shows what is on screen. The tab is opened at the click, before the
   * calls, so the browser doesn't treat it as an unasked pop-up.
   */
  const preview = async (locale: ContentLocale) => {
    if (!doc || !draft) return false;
    const tab = window.open("", "_blank");
    const fail = (message?: string) => {
      tab?.close();
      if (message) showToast(message, "danger");
      return false;
    };
    if (dirty && !(await handle("save", () => saveArticle(doc.id, draft, doc.version), c.editor.saved))) return fail();
    setBusy("preview");
    try {
      const link = await createPreview(doc.id);
      const url = `${MARKETING_URL}${link.paths[locale] ?? link.paths.ar}`;
      if (!tab) return fail(c.editor.previewBlocked);
      // The website gets no handle back on this page.
      tab.opener = null;
      tab.location.href = url;
      return true;
    } catch (e: unknown) {
      return fail(errorText(e, lang));
    } finally {
      setBusy(null);
    }
  };

  const unpublish = () => (doc ? handle("unpublish", () => unpublishArticle(doc.id), c.editor.takenDown) : Promise.resolve(false));
  const remove = () => (doc ? handle("delete", () => deleteArticle(doc.id)) : Promise.resolve(false));

  const setTranslation = (locale: ContentLocale, patch: Partial<TranslationDraft>) =>
    setDraft((d) => (d ? { ...d, translations: { ...d.translations, [locale]: { ...d.translations[locale], ...patch } } } : d));
  const patch = (next: Partial<ArticleDraft>) => setDraft((d) => (d ? { ...d, ...next } : d));

  return { doc, draft, error: error === null ? null : errorText(error, lang), busy, dirty, restore: (number:number) => doc ? handle("restore", () => restoreVersion(id, number, doc.version)) : Promise.resolve(false), save, publish, preview, unpublish, remove, setTranslation, patch };
}
