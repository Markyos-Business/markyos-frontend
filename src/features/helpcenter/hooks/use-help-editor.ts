"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "@/lib/api/client";
import { errorText } from "@/lib/api/errorText";
import { useToast } from "@/components/ui";
import { getHelpArticle, restoreHelpVersion, saveHelpArticle } from "../api/help.api";
import type { HelpArticleDoc, HelpArticleDraft, HelpLocale, HelpTranslationDraft } from "../types";
import { useHelpCopy } from "./use-help-copy";

/** A pause in typing longer than this saves on its own. */
const AUTOSAVE_MS = 2500;

const emptyTranslation = (): HelpTranslationDraft => ({ title: "", slug: "", summary: "", bodyHtml: "", seoTitle: "", seoDescription: "", ogImage: null });

export function toDraft(doc: HelpArticleDoc): HelpArticleDraft {
  const t = (locale: HelpLocale): HelpTranslationDraft => {
    const x = doc.translations[locale];
    return x ? { title: x.title, slug: x.slug, summary: x.summary, bodyHtml: x.bodyHtml, seoTitle: x.seoTitle, seoDescription: x.seoDescription, ogImage: x.ogImage } : emptyTranslation();
  };
  return {
    categoryId: doc.categoryId,
    type: doc.type,
    audience: doc.audience,
    visibility: doc.visibility,
    authorId: doc.authorId,
    tagIds: doc.tagIds,
    relatedIds: doc.relatedIds,
    lastReviewed: doc.lastReviewed,
    translations: { en: t("en"), ar: t("ar") },
  };
}

type SaveState = "idle" | "saving" | "saved" | "failed";

/**
 * One Help article being edited: the server copy, the working draft, and
 * saving. Edits save on their own after a pause (autosave) or with Save; each
 * save names the version it started from, so a newer save by someone else is
 * never overwritten: their copy is loaded and the person is told.
 */
export function useHelpEditor(id: string) {
  const { h, lang } = useHelpCopy();
  const { showToast } = useToast();
  const [doc, setDoc] = useState<HelpArticleDoc | null>(null);
  const [draft, setDraft] = useState<HelpArticleDraft | null>(null);
  const [saved, setSaved] = useState<HelpArticleDraft | null>(null);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [state, setState] = useState<SaveState>("idle");
  // Server field errors from the last save, keyed like "en.slug".
  const [fields, setFields] = useState<Record<string, string>>({});
  const inFlight = useRef(false);

  const adopt = useCallback((next: HelpArticleDoc) => {
    const d = toDraft(next);
    setDoc(next);
    setDraft(d);
    setSaved(d);
  }, []);

  useEffect(() => {
    let live = true;
    getHelpArticle(id).then((next) => live && adopt(next)).catch((e: unknown) => live && setLoadError(e ?? new Error()));
    return () => {
      live = false;
    };
  }, [id, adopt]);

  const dirty = !!draft && !!saved && JSON.stringify(draft) !== JSON.stringify(saved);

  const save = useCallback(async () => {
    if (!doc || !draft || inFlight.current) return false;
    inFlight.current = true;
    setState("saving");
    try {
      const next = await saveHelpArticle(doc.id, draft, doc.version);
      setDoc(next);
      // Keep what's on screen (typing may have continued); mark it saved.
      setSaved(draft);
      setFields({});
      setState("saved");
      return true;
    } catch (e: unknown) {
      const body = e instanceof ApiError ? (e.data as { code?: string; current?: HelpArticleDoc; fields?: Record<string, string> } | null) : null;
      if (body?.code === "conflict" && body.current) {
        adopt(body.current);
        showToast(h.editor.conflict, "danger");
        setState("idle");
      } else if (body?.fields) {
        setFields(body.fields);
        showToast(h.editor.invalid, "danger");
        setState("failed");
      } else {
        showToast(e instanceof ApiError ? h.editor.autosaveFailed : errorText(e, lang), "danger");
        setState("failed");
      }
      return false;
    } finally {
      inFlight.current = false;
    }
  }, [doc, draft, adopt, h, lang, showToast]);

  // Autosave: a pause after an edit saves it. A failed save waits for the next edit or Save.
  useEffect(() => {
    if (!dirty || state === "saving" || state === "failed") return;
    const timer = window.setTimeout(() => void save(), AUTOSAVE_MS);
    return () => window.clearTimeout(timer);
  }, [draft, dirty, state, save]);

  const restore = useCallback(
    async (number: number) => {
      if (!doc) return false;
      try {
        adopt(await restoreHelpVersion(doc.id, number, doc.version));
        showToast(h.editor.history.restored(number), "success");
        return true;
      } catch (e: unknown) {
        showToast(errorText(e, lang), "danger");
        return false;
      }
    },
    [doc, adopt, h, lang, showToast],
  );

  const patch = (next: Partial<HelpArticleDraft>) => {
    setDraft((d) => (d ? { ...d, ...next } : d));
    if (state !== "saving") setState("idle");
  };
  const setTranslation = (locale: HelpLocale, next: Partial<HelpTranslationDraft>) => {
    setDraft((d) => (d ? { ...d, translations: { ...d.translations, [locale]: { ...d.translations[locale], ...next } } } : d));
    if (state !== "saving") setState("idle");
  };

  return { doc, draft, dirty, state, fields, loadError: loadError === null ? null : errorText(loadError, lang), save, restore, patch, setTranslation, adopt };
}
