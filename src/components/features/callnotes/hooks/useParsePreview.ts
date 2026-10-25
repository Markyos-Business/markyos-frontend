"use client";

import { useEffect, useState } from "react";
import { previewText } from "../services/callNotesService";
import type { NoteKind, ParsePreview } from "../types";

const DELAY_MS = 500;

/**
 * How the server will read `text`, refreshed shortly after typing stops. The
 * parser lives on the server only, so the preview and the save always agree.
 */
export function useParsePreview(text: string, kind?: NoteKind) {
  const [preview, setPreview] = useState<ParsePreview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!text.trim()) return;
    let live = true;
    const t = window.setTimeout(() => {
      previewText(text, kind).then(
        (p) => {
          if (!live) return;
          setPreview(p);
          setError(null);
        },
        (err: unknown) => live && setError(err instanceof Error ? err.message : "Couldn't read the text.")
      );
    }, DELAY_MS);
    return () => {
      live = false;
      window.clearTimeout(t);
    };
  }, [text, kind]);

  return { preview: text.trim() ? preview : null, error };
}
