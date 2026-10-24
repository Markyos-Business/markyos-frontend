"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getForm } from "../services/discoveryService";
import type { DiscoveryForm } from "../types";

/**
 * The form being edited, and every change to it.
 *
 * Each change is one API call that answers with the whole updated form, which
 * replaces what's on screen; so the builder always shows what the server
 * holds, and "Saved" means saved. Calls run one at a time, in order, so two
 * quick edits can't land the wrong way round.
 */
export function useFormEditor(formId: string) {
  const [form, setForm] = useState<DiscoveryForm | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(0);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const queue = useRef<Promise<unknown>>(Promise.resolve());

  useEffect(() => {
    let live = true;
    getForm(formId).then(
      (f) => live && setForm(f),
      (err: unknown) => live && setLoadError(err instanceof Error ? err.message : "Couldn't open this form.")
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
        setError(err instanceof Error ? err.message : "That didn't save.");
        return false;
      } finally {
        setSaving((n) => n - 1);
      }
    });
    queue.current = next;
    return next;
  }, []);

  return { form, setForm, loadError, error, setError, saving: saving > 0, savedAt, run };
}
