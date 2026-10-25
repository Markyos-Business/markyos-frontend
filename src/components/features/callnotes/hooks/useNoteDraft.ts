"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "@/lib/api/client";
import { updateNote } from "../services/callNotesService";
import type { CallNote, NoteDraft } from "../types";
import { today } from "../utils/format";

const LOCAL_DELAY_MS = 600;
const SERVER_DELAY_MS = 1000;
const draftKey = (brandId: string) => `markyos:call-draft:${brandId}`;

const blank = (): NoteDraft => ({
  title: "",
  callDate: today(),
  durationMinutes: null,
  body: "",
  participants: [],
  source: "pasted",
  discoveryFormId: null,
});

const fromNote = (note: CallNote): NoteDraft => ({
  title: note.title,
  callDate: note.callDate,
  durationMinutes: note.durationMinutes,
  kind: note.kind,
  language: note.language,
  body: note.body,
  participants: note.participants,
  source: note.source,
  discoveryFormId: note.discoveryFormId,
});

function readLocal(brandId: string): NoteDraft | null {
  try {
    const raw = localStorage.getItem(draftKey(brandId));
    return raw ? { ...blank(), ...(JSON.parse(raw) as Partial<NoteDraft>) } : null;
  } catch {
    return null;
  }
}

/**
 * The notes being written. A new note is kept in this browser as a draft
 * until it's saved, so a closed tab loses nothing; an existing one saves
 * itself to the server shortly after each change, carrying the version it
 * was edited from so it can't overwrite a newer copy.
 */
export function useNoteDraft(brandId: string, note?: CallNote) {
  const editing = !!note;
  const [draft, setDraft] = useState<NoteDraft>(() => (note ? fromNote(note) : blank()));
  const [restored, setRestored] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState<CallNote | null>(null);
  const [dirty, setDirty] = useState(false);
  const version = useRef(note?.version ?? 0);
  const latest = useRef(draft);
  const queue = useRef<Promise<unknown>>(Promise.resolve());

  // A draft left in this browser comes back, once, after mount.
  useEffect(() => {
    if (editing) return;
    const local = readLocal(brandId);
    if (local && (local.body.trim() || local.title.trim())) {
      latest.current = local;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restoring browser storage is the effect
      setDraft(local);
      setRestored(true);
    }
  }, [brandId, editing]);

  const change = useCallback((patch: Partial<NoteDraft>) => {
    setDraft((d) => {
      const next = { ...d, ...patch };
      latest.current = next;
      return next;
    });
    setDirty(true);
  }, []);

  /** Sends the latest copy to the server now; resolves to whether it saved. */
  const flush = useCallback((): Promise<boolean> => {
    if (!note) return Promise.resolve(true);
    const next = queue.current.then(async () => {
      setSaving(true);
      try {
        const saved = await updateNote(note.id, { ...latest.current, version: version.current });
        version.current = saved.version;
        setSavedAt(Date.now());
        setError(null);
        setDirty(false);
        return true;
      } catch (err) {
        if (err instanceof ApiError && err.status === 409) setConflict((err.data as { current?: CallNote })?.current ?? null);
        setError(err instanceof Error ? err.message : "That didn't save.");
        return false;
      } finally {
        setSaving(false);
      }
    });
    queue.current = next;
    return next;
  }, [note]);

  // Persist after a pause: to the server when editing, to this browser when new.
  useEffect(() => {
    if (!dirty || conflict) return;
    const t = window.setTimeout(
      () => {
        if (editing) {
          if (latest.current.body.trim() && latest.current.title.trim()) void flush();
          return;
        }
        try {
          localStorage.setItem(draftKey(brandId), JSON.stringify(latest.current));
          setSavedAt(Date.now());
          setDirty(false);
        } catch {
          // Private mode: the draft just isn't kept.
        }
      },
      editing ? SERVER_DELAY_MS : LOCAL_DELAY_MS
    );
    return () => window.clearTimeout(t);
  }, [draft, dirty, editing, brandId, flush, conflict]);

  // Leaving with something not yet saved: the browser asks first. A new note
  // counts as unsaved until it's been saved as a note, draft or not.
  const unsaved = editing ? dirty || saving : !!draft.body.trim();
  useEffect(() => {
    if (!unsaved) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [unsaved]);

  const discardLocal = useCallback(() => {
    try {
      localStorage.removeItem(draftKey(brandId));
    } catch {
      // nothing to remove
    }
  }, [brandId]);

  return { draft, change, flush, restored, savedAt, saving, error, conflict, unsaved, discardLocal };
}
