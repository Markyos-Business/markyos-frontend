"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getForm } from "../../api/discovery.api";
import type { DiscoveryForm } from "../../types";
import { errorText } from "@/lib/api/errorText";

/**
 * The form being edited, and every change to it.
 *
 * Each change is one API call that answers with the whole updated form, which
 * replaces what's on screen; so the builder always shows what the server
 * holds, and "Saved" means saved. Calls run one at a time, in order, so two
 * quick edits can't land the wrong way round.
 */
export function useFormEditor(formId: string, isAr: boolean) {
  const [form, setForm] = useState<DiscoveryForm | null>(null);
  // Failures themselves; they become words at render, in the reader's language.
  const [loadError, setLoadError] = useState<unknown>(null);
  const [error, setError] = useState<unknown>(null);
  const [saving, setSaving] = useState(0);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const queue = useRef<Promise<unknown>>(Promise.resolve());

  useEffect(() => {
    let live = true;
    getForm(formId).then(
      (f) => live && setForm(f),
      (err: unknown) => live && setLoadError(err ?? new Error())
    );
    return () => {
      live = false;
    };
  }, [formId]);

  /** Runs a change after any still in flight; resolves to whether it saved. */
  const run = useCallback((change: () => Promise<DiscoveryForm>): Promise<boolean> => {
    setSaving((n) => n + 1);
    const next = queue.current.then(async () => {
      try {
        setForm(await change());
        setSavedAt(Date.now());
        setError(null);
        return true;
      } catch (err) {
        setError(err ?? new Error());
        return false;
      } finally {
        setSaving((n) => n - 1);
      }
    });
    queue.current = next;
    return next;
  }, []);

  const lang = isAr ? "ar" : "en";
  return {
    form,
    setForm,
    loadError: loadError === null ? null : errorText(loadError, lang, { en: "Couldn't open this questionnaire.", ar: "تعذّر فتح الاستبيان." }),
    error: error === null ? null : errorText(error, lang, { en: "That didn't save.", ar: "لم يُحفظ ذلك." }),
    clearError: () => setError(null),
    saving: saving > 0,
    savedAt,
    run,
  };
}
