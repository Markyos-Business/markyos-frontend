"use client";

import { useState } from "react";
import { IconButton } from "../button/icon-button";
import { Icon } from "../icon";
import { Progress } from "../progress";
import { useUiStrings } from "../ui-strings";
import { fileSize } from "./file-rules";

type UploadStatus = "queued" | "uploading" | "done" | "failed";

type UploadItem = {
  id: string;
  name: string;
  /** Bytes. */
  size: number;
  status: UploadStatus;
  /** 0–100 while uploading. */
  progress?: number;
  /** Why it failed, in one sentence; "Upload failed" otherwise. */
  error?: string;
};

type UploadListProps = {
  /** The list's accessible name: "Brief files". */
  label: string;
  items: readonly UploadItem[];
  onCancel?: (id: string) => void;
  onRetry?: (id: string) => void;
  onRemove?: (id: string) => void;
};

const TILE: Record<UploadStatus, string> = {
  queued: "bg-surface-2 text-text-muted",
  uploading: "bg-accent-soft text-accent-on-soft",
  done: "bg-success-soft text-success",
  failed: "bg-danger-soft text-danger",
};
const GLYPH: Record<UploadStatus, string> = { queued: "clock", uploading: "upload", done: "check-circle", failed: "exclamation-circle" };

/**
 * Files on their way up: each row has the name, size and status, a bar while
 * uploading, and what can be done (cancel while waiting or uploading, retry
 * and remove after a failure, remove when done). Status changes are announced
 * once each; the percentage isn't read out as it climbs.
 */
const UploadList = ({ label, items, onCancel, onRetry, onRemove }: UploadListProps) => {
  const { t } = useUiStrings();
  const statusText = (i: UploadItem) =>
    i.status === "queued" ? t.uploadQueued : i.status === "uploading" ? t.uploadUploading(Math.round(i.progress ?? 0)) : i.status === "done" ? t.uploadDone : (i.error ?? t.uploadFailed);

  // What changed since the last render, said once in a polite live region.
  const [seen, setSeen] = useState<Record<string, UploadStatus>>({});
  const [announcement, setAnnouncement] = useState("");
  const changed = items.filter((i) => seen[i.id] !== i.status && i.status !== "uploading");
  if (changed.length || items.some((i) => !(i.id in seen))) {
    setSeen(Object.fromEntries(items.map((i) => [i.id, i.status])));
    if (changed.length && Object.keys(seen).length) setAnnouncement(changed.map((i) => `${i.name}: ${statusText(i)}`).join(". "));
  }

  if (!items.length) return null;
  return (
    <>
      <ul aria-label={label} className="flex flex-col gap-space-3">
        {items.map((i) => (
          <li key={i.id} className="flex items-center gap-space-4 rounded-widget bg-surface-1 px-space-5 py-space-4 shadow-edge">
            <span aria-hidden className={`flex size-9.5 shrink-0 items-center justify-center rounded-lg ${TILE[i.status]}`}>
              <Icon name={GLYPH[i.status]} size={18} />
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-space-1">
              <span className="truncate text-body font-medium text-text" dir="auto">
                {i.name}
              </span>
              {i.status === "uploading" ? (
                <Progress value={i.progress ?? 0} label={`${i.name}, ${statusText(i)}`} size="md" showValue />
              ) : (
                <span className={`flex flex-wrap gap-x-space-3 text-caption ${i.status === "failed" ? "text-danger" : "text-text-muted"}`}>
                  <span dir="ltr">{fileSize(i.size)}</span>
                  <span>{statusText(i)}</span>
                </span>
              )}
            </span>
            <span className="flex shrink-0 items-center">
              {i.status === "failed" && onRetry && <IconButton icon="sync" label={t.retryUpload(i.name)} onClick={() => onRetry(i.id)} />}
              {(i.status === "queued" || i.status === "uploading") && onCancel && <IconButton icon="times" label={t.cancelUpload(i.name)} onClick={() => onCancel(i.id)} />}
              {(i.status === "done" || i.status === "failed") && onRemove && <IconButton icon="trash" label={t.remove(i.name)} onClick={() => onRemove(i.id)} />}
            </span>
          </li>
        ))}
      </ul>
      <span role="status" aria-live="polite" className="sr-only">
        {announcement}
      </span>
    </>
  );
};

export { UploadList };
export type { UploadItem, UploadListProps, UploadStatus };
