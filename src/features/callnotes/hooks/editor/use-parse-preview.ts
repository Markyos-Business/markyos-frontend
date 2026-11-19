"use client";

import { useEffect, useState } from "react";
import { previewText } from "../../api/call-notes.api";
import type { NoteKind, ParsePreview } from "../../types";
import { errorText } from "@/lib/api/errorText";

const DELAY_MS = 500;

/**
 * How the server will read `text`, refreshed shortly after typing stops. The
 * parser lives on the server only, so the preview and the save always agree.
 */
export function useParsePreview(text: string, kind: NoteKind | undefined, isAr: boolean) {
  const [preview, setPreview] = useState<ParsePreview | null>(null);
  // The failure itself; it becomes words at render, in the reader's language.
  const [error, setError] = useState<unknown>(null);

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
        (err: unknown) => live && setError(err ?? new Error())
      );
    }, DELAY_MS);
    return () => {
      live = false;
      window.clearTimeout(t);
    };
  }, [text, kind]);

  const message = error === null ? null : errorText(error, isAr ? "ar" : "en", { en: "Couldn't read the text.", ar: "تعذّرت قراءة النص." });
  return { preview: text.trim() ? preview : null, error: message };
}
