"use client";

import { useCallback, useState } from "react";
import { useRequest } from "@/hooks/useRequest";
import { getAnalysis, runAnalysis } from "../services/callNotesService";
import type { AnalysisState } from "../types";

/** The brand's latest analysis, and running a new one. */
export function useAnalysis(brandId: string) {
  const request = useRequest(() => getAnalysis(brandId), brandId);
  const [fresh, setFresh] = useState<AnalysisState | null>(null);
  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);

  const run = useCallback(async () => {
    setRunning(true);
    setRunError(null);
    try {
      setFresh(await runAnalysis(brandId));
    } catch (err) {
      setRunError(err instanceof Error ? err.message : "The analysis didn't work. Try again.");
    }
    setRunning(false);
  }, [brandId]);

  return { state: fresh ?? request.data, loading: request.loading && !request.data, error: request.error, running, runError, run };
}
