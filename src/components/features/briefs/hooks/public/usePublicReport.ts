"use client";

import { useState } from "react";
import { ApiError } from "@/lib/api/client";
import { useRequest } from "@/hooks/useRequest";
import { getPublicReport } from "../../services/briefsService";
import type { Citation } from "../../types";

/** The shared report for a client link; `gone` when the link is off, expired or wrong. */
export function usePublicReport(token: string) {
  const report = useRequest(
    () =>
      getPublicReport(token).then(
        (data) => ({ data, gone: false }),
        (err: unknown) => (err instanceof ApiError && err.status === 404 ? { data: null, gone: true } : Promise.reject(err))
      ),
    `public-brief:${token}`
  );
  // The citation whose quote is open.
  const [citation, setCitation] = useState<Citation | null>(null);
  return { report, citation, open: setCitation, close: () => setCitation(null) };
}
