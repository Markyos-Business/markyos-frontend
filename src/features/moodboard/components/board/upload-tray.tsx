"use client";

import { Button, Icon, IconButton, Progress } from "@/components/ui";
import type { UploadRow } from "../../hooks/board/use-moodboard-uploads";

/**
 * Images on their way to the board: one row per file with its progress, the
 * reason and a Retry when one fails. Floats in the window's bottom-end
 * corner, clear of the sidebar and the board's toolbar, in either view, and
 * only while something is going up.
 */
export function MoodboardUploadTray({ rows, isAr, onRetry, onDismiss }: { rows: UploadRow[]; isAr: boolean; onRetry: (id: string) => void; onDismiss: (id: string) => void }) {
  if (rows.length === 0) return null;
  const going = rows.filter((r) => r.status === "uploading").length;
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-space-6 end-space-6 z-toast flex w-72 max-w-[calc(100%-2rem)] flex-col gap-space-3 rounded-card bg-surface-1 p-space-4 shadow-raised"
    >
      <span className="text-caption font-medium text-text">
        {going > 0 ? (isAr ? `جارٍ رفع ${going} من ${rows.length}` : `Uploading ${going} of ${rows.length}`) : isAr ? "الرفع" : "Uploads"}
      </span>
      {rows.map((r) => (
        <div key={r.id} className="flex flex-col gap-space-2">
          <div className="flex items-center gap-ctl-row">
            <Icon name={r.status === "failed" ? "exclamation-circle" : r.status === "done" ? "check-circle" : "image"} size={16}
              className={r.status === "failed" ? "text-danger" : r.status === "done" ? "text-success" : "text-text-muted"} />
            <span dir="auto" className="min-w-0 flex-1 truncate text-caption text-text [text-align:match-parent]">{r.name}</span>
            {r.status === "failed" && (
              <>
                <Button size="xs" variant="secondary" onClick={() => onRetry(r.id)}>{isAr ? "إعادة المحاولة" : "Retry"}</Button>
                <IconButton size="xs" icon="times" label={isAr ? "إزالة" : "Remove"} onClick={() => onDismiss(r.id)} />
              </>
            )}
          </div>
          {r.status === "uploading" && <Progress value={r.progress * 100} label={r.name} />}
          {r.status === "failed" && r.error && <span className="text-caption text-danger">{r.error}</span>}
        </div>
      ))}
    </div>
  );
}
