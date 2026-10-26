"use client";

import { useCallback, useEffect, useState } from "react";
import { getAnalysis } from "../services/briefsService";
import type { BriefAnalysis, Section } from "../types";

const POLL_MS = 2000;

const busy = (a: BriefAnalysis) => a.status === "queued" || a.status === "running" || a.sections.some((s) => s.status === "regenerating");

/**
 * One analysis, kept fresh: polled every couple of seconds while it runs or
 * a section is being rewritten, then left alone.
 */
export function useBriefAnalysis(id: string | null) {
  const [analysis, setAnalysis] = useState<BriefAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!id) return;
    let live = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    getAnalysis(id).then(
      (fresh) => {
        if (!live) return;
        setAnalysis(fresh);
        setError(null);
        if (busy(fresh)) timer = setTimeout(() => setTick((n) => n + 1), POLL_MS);
      },
      (err: unknown) => live && setError(err instanceof Error ? err.message : "Couldn't load the analysis.")
    );
    return () => {
      live = false;
      if (timer) clearTimeout(timer);
    };
  }, [id, tick]);

  const reload = useCallback(() => setTick((n) => n + 1), []);

  /** Puts a section the API just returned in place, and polls if it's busy. */
  const replaceSection = useCallback((section: Section) => {
    setAnalysis((a) => (a ? { ...a, sections: a.sections.map((s) => (s.key === section.key ? section : s)) } : a));
    if (section.status === "regenerating") setTimeout(() => setTick((n) => n + 1), POLL_MS);
  }, []);

  return { analysis: id && analysis?.id === id ? analysis : analysis && !id ? null : analysis, error, reload, replaceSection };
}
