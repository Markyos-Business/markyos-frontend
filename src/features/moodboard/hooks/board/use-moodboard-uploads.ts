"use client";

import { useCallback, useRef, useState } from "react";
import { errorText } from "@/lib/api/errorText";
import { uploadFile } from "@/lib/api/uploadFile";
import { fileToDownscaledDataUrl } from "../../utils/image-downscale";

/** The server's limit for one brand file (backend UPLOAD_MAX_BYTES). */
export const UPLOAD_MAX_BYTES = 25 * 1024 * 1024;

export type UploadRow = {
  id: string;
  name: string;
  /** 0–1 while uploading. */
  progress: number;
  status: "uploading" | "failed" | "done";
  error?: string;
};

type Job = { file: File; place: (url: string, sizeKB: number) => void };

/**
 * Images going up to the server, one row each, for the upload tray.
 *
 * A card is added only once the server has the file (`place` runs with its
 * URL), so nothing on the board points at a file that never arrived. A failed
 * file keeps its row with the reason and a Retry; a finished one clears
 * itself. The same file chosen twice while the first is still going is
 * skipped.
 */
export function useMoodboardUploads(isAr: boolean) {
  const [rows, setRows] = useState<UploadRow[]>([]);
  const jobs = useRef(new Map<string, Job>());
  const lang = isAr ? "ar" : "en";

  const patch = (id: string, change: Partial<UploadRow>) =>
    setRows((all) => all.map((r) => (r.id === id ? { ...r, ...change } : r)));

  const run = useCallback(async (id: string) => {
    const job = jobs.current.get(id);
    if (!job) return;
    patch(id, { status: "uploading", progress: 0, error: undefined });
    try {
      // The same reduction as before (1600px long edge), then the real upload.
      const dataUrl = await fileToDownscaledDataUrl(job.file);
      const blob = await (await fetch(dataUrl)).blob();
      // Checked after the reduction: a 30MB photo is fine once it is 1600px; a big GIF or SVG is kept whole.
      if (blob.size > UPLOAD_MAX_BYTES) {
        patch(id, { status: "failed", error: isAr ? "الملف أكبر من 25 ميغابايت." : "This file is over 25 MB." });
        return;
      }
      const url = await uploadFile(blob, job.file.name, (p) => patch(id, { progress: p }));
      job.place(url, Math.max(1, Math.round(blob.size / 1024)));
      jobs.current.delete(id);
      patch(id, { status: "done", progress: 1 });
      setTimeout(() => setRows((all) => all.filter((r) => r.id !== id)), 2000);
    } catch (err) {
      patch(id, { status: "failed", error: errorText(err, lang, { en: "The upload didn't go through.", ar: "لم يكتمل الرفع." }) });
    }
  }, [lang, isAr]);

  /** Queue `files`; each one calls `placeFor(file)` for where its card goes once it's up. */
  const start = useCallback((files: File[], placeFor: (file: File, index: number) => Job["place"]) => {
    files.forEach((file, i) => {
      const key = `${file.name}:${file.size}:${file.lastModified}`;
      const busy = [...jobs.current.entries()].some(([, j]) => `${j.file.name}:${j.file.size}:${j.file.lastModified}` === key);
      if (busy) return;
      const id = `${key}:${Date.now()}:${i}`;
      jobs.current.set(id, { file, place: placeFor(file, i) });
      setRows((all) => [...all, { id, name: file.name, progress: 0, status: "uploading" }]);
      void run(id);
    });
  }, [run]);

  const retry = useCallback((id: string) => void run(id), [run]);
  const dismiss = useCallback((id: string) => {
    jobs.current.delete(id);
    setRows((all) => all.filter((r) => r.id !== id));
  }, []);

  return { rows, start, retry, dismiss };
}
