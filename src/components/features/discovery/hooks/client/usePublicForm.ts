"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { API_ENABLED, ApiError } from "@/lib/api/client";
import type { Lang } from "@/types";
import { validateAnswer } from "../../model/questionTypes";
import { evaluateVisibility } from "../../model/visibility";
import { getPublicForm, savePublicAnswers, submitPublicForm, uploadPublicFile } from "../../services/publicFormService";
import type { AnswerValue, PublicForm, UploadedFile } from "../../types";
import type { SaveState } from "../../components/client/ClientForm";

/** Why the form can't be filled in, when it can't. */
export type PublicFormProblem = "missing" | "revoked" | "closed" | "offline" | "error";

const SAVE_DELAY_MS = 600;
const storageKey = (token: string) => `markyos:form:${token}`;

/*
 * Where this browser keeps its resume token. With save-and-resume on it
 * outlives the tab, so the link picks up where the client left off; with it
 * off it lasts only as long as the tab, enough to survive a reload.
 */
function readResume(token: string): string | null {
  try {
    return localStorage.getItem(storageKey(token)) ?? sessionStorage.getItem(storageKey(token));
  } catch {
    return null;
  }
}

function writeResume(token: string, value: string, lasting: boolean) {
  try {
    (lasting ? localStorage : sessionStorage).setItem(storageKey(token), value);
  } catch {
    // Private mode: answers still save, they just won't come back on reload.
  }
}

const problemOf = (err: unknown): PublicFormProblem => {
  if (!(err instanceof ApiError)) return "error";
  if (err.status === 0) return "offline";
  if (err.status === 404) return "missing";
  if (err.status === 410) return (err.data as { code?: string } | null)?.code === "revoked" ? "revoked" : "closed";
  return "error";
};

/**
 * The client's side of a discovery form: load it, save each answer shortly
 * after it changes, upload files, submit.
 *
 * Saves run one at a time and carry only answers the server will take — ones
 * that are shown and valid. A link half-typed stays pending until it is a
 * link, rather than holding back every other answer in the same save.
 */
export function usePublicForm(token: string) {
  const [form, setForm] = useState<PublicForm | null>(null);
  const [problem, setProblem] = useState<PublicFormProblem | null>(API_ENABLED ? null : "offline");
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [files, setFiles] = useState<Record<string, UploadedFile>>({});
  const [lang, setLang] = useState<Lang>("en");
  const [submitted, setSubmitted] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  const resume = useRef<string | null>(null);
  const pending = useRef<Record<string, AnswerValue>>({});
  const latest = useRef<{ form: PublicForm | null; answers: Record<string, AnswerValue>; lang: Lang }>({ form: null, answers: {}, lang: "en" });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queue = useRef<Promise<unknown>>(Promise.resolve());

  useEffect(() => {
    if (!API_ENABLED) return;
    let live = true;
    getPublicForm(token, readResume(token)).then(
      ({ form, response }) => {
        if (!live) return;
        const language = response && form.languages.includes(response.language) ? response.language : form.primaryLanguage;
        resume.current = response?.resumeToken ?? null;
        latest.current = { form, answers: response?.answers ?? {}, lang: language };
        setForm(form);
        setAnswers(response?.answers ?? {});
        setFiles(response?.files ?? {});
        setLang(language);
        setSubmitted(!!response?.submittedAt || form.status === "submitted");
        if (form.closed) setProblem("closed");
      },
      (err: unknown) => {
        if (!live) return;
        // No form, so no language of its own: say why in the browser's.
        setLang(navigator.language?.toLowerCase().startsWith("ar") ? "ar" : "en");
        setProblem(problemOf(err));
      }
    );
    return () => {
      live = false;
    };
  }, [token]);

  const remember = useCallback(
    (value: string) => {
      resume.current = value;
      writeResume(token, value, latest.current.form?.allowSaveAndResume ?? true);
    },
    [token]
  );

  /** Sends what is pending and ready; resolves once it has (or hasn't). */
  const flush = useCallback((): Promise<void> => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    const next = queue.current.then(async () => {
      const { form, answers, lang } = latest.current;
      if (!form) return;
      const questions = form.sections.flatMap((s) => s.questions);
      const visible = evaluateVisibility(questions, answers);
      const batch: Record<string, AnswerValue> = {};
      for (const q of questions) {
        if (!(q.id in pending.current)) continue;
        const value = pending.current[q.id];
        // A question that has since been hidden: the server drops it on submit.
        if (!visible.has(q.id) && value !== null) {
          delete pending.current[q.id];
          continue;
        }
        try {
          validateAnswer(q.type, q.config, value);
          batch[q.id] = value;
        } catch {
          // Not an answer yet; it goes once it is.
        }
      }
      if (!Object.keys(batch).length) return;
      setSaveState("saving");
      try {
        const saved = await savePublicAnswers(token, { answers: batch, resumeToken: resume.current, language: lang });
        remember(saved.resumeToken);
        for (const [id, value] of Object.entries(batch)) if (pending.current[id] === value) delete pending.current[id];
        setSaveState("saved");
      } catch (err) {
        if (err instanceof ApiError && err.status === 409) setSubmitted(true);
        else if (err instanceof ApiError && err.status === 410) setProblem(problemOf(err));
        setSaveState("error");
      }
    });
    queue.current = next;
    return next;
  }, [token, remember]);

  const answer = useCallback(
    (questionId: string, value: AnswerValue) => {
      setAnswers((prev) => {
        const nextAnswers = { ...prev, [questionId]: value };
        latest.current = { ...latest.current, answers: nextAnswers };
        return nextAnswers;
      });
      pending.current[questionId] = value;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void flush(), SAVE_DELAY_MS);
    },
    [flush]
  );

  const changeLang = useCallback((next: Lang) => {
    latest.current = { ...latest.current, lang: next };
    setLang(next);
  }, []);

  const upload = useCallback(
    async (questionId: string, file: File): Promise<UploadedFile> => {
      try {
        const { resumeToken, ...uploaded } = await uploadPublicFile(token, questionId, file, resume.current, latest.current.lang);
        remember(resumeToken);
        setFiles((prev) => ({ ...prev, [uploaded.assetId]: uploaded }));
        return uploaded;
      } catch (err) {
        if (err instanceof ApiError && err.status === 0) throw new Error(latest.current.lang === "ar" ? "تعذّر رفع الملف. تحقّق من الاتصال." : "The file didn't upload. Check your connection.");
        throw err;
      }
    },
    [token, remember]
  );

  /** Resolves to a message to show, or null once the answers are in. */
  const submit = useCallback(async (): Promise<string | null> => {
    const ar = latest.current.lang === "ar";
    await flush();
    try {
      await submitPublicForm(token, resume.current);
      setSubmitted(true);
      return null;
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setSubmitted(true);
        return null;
      }
      if (err instanceof ApiError && err.status === 400 && Array.isArray((err.data as { missing?: unknown } | null)?.missing)) {
        return ar ? "بعض الأسئلة المطلوبة لم يُجَب عنها بعد." : "Some required questions aren't answered yet.";
      }
      if (err instanceof ApiError && err.status === 0) return ar ? "لم تُرسَل الإجابات. تحقّق من الاتصال وحاول مجددًا." : "Your answers didn't send. Check your connection and try again.";
      return err instanceof Error ? err.message : ar ? "لم ينجح ذلك." : "That didn't work.";
    }
  }, [token, flush]);

  // Leaving with a save still waiting: send it now rather than lose it.
  useEffect(() => {
    const leave = () => {
      if (Object.keys(pending.current).length) void flush();
    };
    window.addEventListener("pagehide", leave);
    return () => window.removeEventListener("pagehide", leave);
  }, [flush]);

  return { form, problem, answers, files, lang, setLang: changeLang, submitted, saveState, answer, upload, submit };
}
