"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { API_ENABLED, ApiError } from "@/lib/api/client";
import { fetchBrief, saveBriefAnswer, sendBrief } from "@/lib/api/public";
import { useApp } from "@/contexts/AppContext";
import type { Brief } from "@/types";

type Found = { brief: Brief; workspace: { name: string } } | undefined;

/** Answers are saved once typing pauses, not on every keystroke. */
const SAVE_DELAY_MS = 600;

function withAnswer(brief: Brief, questionKey: string, value: string): Brief {
  const answeredAt = Date.now();
  const answers = brief.answers.some((a) => a.questionKey === questionKey)
    ? brief.answers.map((a) => (a.questionKey === questionKey ? { ...a, value, answeredAt } : a))
    : [...brief.answers, { questionKey, value, answeredAt }];
  return { ...brief, answers, status: brief.status === "submitted" ? brief.status : "in_progress" };
}

/**
 * The brief behind `/b/<token>`, and the client's two actions on it.
 *
 * With a backend the brief lives on the server: the client fills it in on
 * their own device and each answer is written into the studio's brand.
 * Without one it is this browser's own copy, as before. The page cannot tell
 * the difference — except that sending can now fail, so `submit` says why.
 */
export function usePublicBrief(token: string) {
  const { hydrated, getBriefByToken, answerBrief, submitBrief } = useApp();
  const [server, setServer] = useState<{ token: string; found: Found } | null>(null);
  /** Answers typed but not yet sent, by question. */
  const pending = useRef(new Map<string, string>());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saving = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    if (!API_ENABLED) return;
    let cancelled = false;
    fetchBrief(token).then(
      (found) => !cancelled && setServer({ token, found: found ?? undefined }),
      () => !cancelled && setServer({ token, found: undefined })
    );
    return () => {
      cancelled = true;
    };
  }, [token]);

  const flush = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    const batch = [...pending.current];
    pending.current.clear();
    // Chained, so answers reach the server in the order they were typed.
    saving.current = saving.current.then(async () => {
      for (const [key, value] of batch) {
        try {
          await saveBriefAnswer(token, key, value);
        } catch (err) {
          console.error(`Markyos: could not save an answer: ${err instanceof Error ? err.message : err}`);
          // Kept for the next try, unless a newer answer replaced it.
          if (!pending.current.has(key)) pending.current.set(key, value);
        }
      }
    });
    return saving.current;
  }, [token]);

  useEffect(() => {
    if (!API_ENABLED) return;
    // Closing the tab mid-answer is the usual way to lose one.
    const onHide = () => document.visibilityState === "hidden" && void flush();
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, [flush]);

  const answer = useCallback(
    (questionKey: string, value: string) => {
      if (!API_ENABLED) return answerBrief(token, questionKey, value);
      setServer((prev) =>
        prev?.found ? { ...prev, found: { ...prev.found, brief: withAnswer(prev.found.brief, questionKey, value) } } : prev
      );
      pending.current.set(questionKey, value);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void flush(), SAVE_DELAY_MS);
    },
    [token, answerBrief, flush]
  );

  /** Sends the brief. Null when it went, otherwise what to tell the client. */
  const submit = useCallback(async (): Promise<string | null> => {
    if (!API_ENABLED) {
      submitBrief(token);
      return null;
    }
    await flush();
    const unsaved = "Some answers haven't saved yet. Check your connection and try again.";
    if (pending.current.size > 0) return unsaved;
    try {
      const brief = await sendBrief(token);
      setServer((prev) => (prev?.found ? { ...prev, found: { ...prev.found, brief } } : prev));
      return null;
    } catch (err) {
      return err instanceof ApiError ? err.message : unsaved;
    }
  }, [token, submitBrief, flush]);

  if (!API_ENABLED) {
    return { hydrated, found: hydrated ? (getBriefByToken(token) as Found) : undefined, answer, submit };
  }
  const current = server?.token === token ? server : null;
  return { hydrated: !!current, found: current?.found, answer, submit };
}
