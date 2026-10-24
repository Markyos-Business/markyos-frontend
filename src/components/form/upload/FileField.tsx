"use client";

import { useId, useRef } from "react";
import type { ChangeEvent } from "react";
import { useFileDrop } from "@/hooks/useFileDrop";
import { Button } from "../../ui/buttons/Button";
import { IconButton } from "../../ui/buttons/IconButton";
import { Icon } from "../../ui/primitives/Icon";
import { useToast } from "../../ui/overlays/Toast";
import { FieldLabel } from "../fields/InputField";

type FileFieldVariant = "dropzone" | "compact";

type FileFieldProps = {
  label: string;
  /** A line under the label; defaults to the accepted types and size limit. */
  description?: string;
  /** The chosen file; the caller owns it and does the upload. */
  file: File | null;
  onFileChange: (file: File) => void;
  onRemove: () => void;
  /** Called with a message when a file is refused, and with "" when one is accepted. */
  onError?: (message: string) => void;
  /** Extensions and/or MIME types, as for `<input accept>`: ".pdf,.png,image/jpeg". */
  accept: string;
  /** What `accept` means in words, for messages: "PDF or image". */
  acceptLabel: string;
  maxBytes?: number;
  /** A full drop area, or one compact row for forms that bundle several uploads. */
  variant?: FileFieldVariant;
  uploading?: boolean;
  /** 0–100 while `uploading`. */
  progress?: number;
  disabled?: boolean;
  required?: boolean;
};

const MB = 1024 * 1024;

/** Whether `file` is one of `accept`'s extensions or MIME types. */
const accepts = (file: File, accept: string) =>
  accept
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .some((rule) =>
      rule.startsWith(".")
        ? file.name.toLowerCase().endsWith(rule)
        : rule.endsWith("/*")
          ? file.type.toLowerCase().startsWith(rule.slice(0, -1))
          : file.type.toLowerCase() === rule
    );

/**
 * The spec's progress bar (§6.10): a 6px track on the neutral soft fill, the
 * fill moving in the 180ms reserved for it. It fills from the reading-start
 * side, by transform rather than width.
 */
const Progress = ({ value }: { value: number }) => (
  <span className="flex items-center gap-space-3">
    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-soft">
      <span
        className="block h-full origin-left rounded-full bg-accent transition-transform duration-base rtl:origin-right"
        style={{ transform: `scaleX(${Math.min(Math.max(value, 0), 100) / 100})` }}
      />
    </span>
    <span className="shrink-0 text-caption font-medium tabular-nums text-accent-text">{value}%</span>
  </span>
);

/**
 * Choose a file by dropping it or browsing. It checks type and size and says
 * why a file was refused (a toast, and `onError`); the upload itself is the
 * caller's, which reports back through `uploading` and `progress`.
 */
const FileField = ({
  label,
  description,
  file,
  onFileChange,
  onRemove,
  onError,
  accept,
  acceptLabel,
  maxBytes = 10 * MB,
  variant = "dropzone",
  uploading = false,
  progress = 0,
  disabled = false,
  required = false,
}: FileFieldProps) => {
  const id = `ff-${useId()}`;
  const inputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();
  const limit = `${Math.round(maxBytes / MB)}MB`;
  const fallback = `${acceptLabel} – max ${limit}`;

  const refuse = (message: string) => {
    showToast(message, "danger");
    onError?.(message);
  };
  const take = (selected: File) => {
    if (!accepts(selected, accept)) return refuse(`"${selected.name}" isn't a ${acceptLabel} file.`);
    if (selected.size > maxBytes) return refuse(`"${selected.name}" is larger than ${limit}.`);
    onError?.("");
    onFileChange(selected);
  };
  const onPick = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    e.target.value = "";
    if (selected) take(selected);
  };
  const { isDragging, dropHandlers } = useFileDrop({ onFiles: (files) => take(files[0]), disabled });

  const input = (
    <input id={id} ref={inputRef} type="file" accept={accept} required={required} disabled={disabled} onChange={onPick} className="sr-only" />
  );

  if (variant === "compact") {
    return (
      <div
        {...dropHandlers}
        className={`flex items-center gap-space-4 rounded-widget p-space-5 transition-[background-color,box-shadow] ${
          isDragging ? "bg-accent-soft shadow-edge-accent" : "bg-surface-1 shadow-edge"
        }`}
      >
        <span
          aria-hidden
          className={`flex size-9.5 shrink-0 items-center justify-center rounded-lg ${file ? "bg-success-soft text-success" : "bg-surface-2 text-text-muted"}`}
        >
          <Icon name={uploading ? "circle-notch" : file ? "check-circle" : "upload"} size={18} className={uploading ? "animate-spin-quick text-accent-text" : ""} />
        </span>
        <span className="min-w-0 flex-1">
          <label htmlFor={id} className="block truncate text-body font-medium text-text">
            {label}
            {required && (
              <span aria-hidden className="ms-0.5 text-danger">
                *
              </span>
            )}
          </label>
          {file && uploading ? (
            <span className="mt-space-2 block">
              <Progress value={progress} />
            </span>
          ) : (
            <span className="block truncate text-caption text-text-muted">{file ? file.name : (description ?? fallback)}</span>
          )}
        </span>
        {file && !uploading && <IconButton icon="times" label={`Remove ${file.name}`} disabled={disabled} onClick={onRemove} className="text-text-muted hover:text-text" />}
        {!file && (
          <Button variant="outline" size="sm" disabled={disabled} onClick={() => inputRef.current?.click()}>
            Upload
          </Button>
        )}
        {input}
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-space-3">
      <div>
        <FieldLabel htmlFor={id} required={required}>
          {label}
        </FieldLabel>
        {description && <p className="text-caption text-text-faint">{description}</p>}
      </div>
      <label
        htmlFor={id}
        {...dropHandlers}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-card border border-dashed px-space-10 py-space-11 text-center transition-[background-color,border-color] has-disabled:cursor-not-allowed has-disabled:opacity-58 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent ${
          isDragging ? "border-accent bg-accent-soft" : "border-line-strong bg-surface-1 hover:border-accent"
        }`}
      >
        <span aria-hidden className="mb-space-5 flex size-control items-center justify-center rounded-lg bg-accent-soft text-accent-on-soft">
          <Icon name="upload" size={22} />
        </span>
        <span className="text-body font-medium text-text">
          Drag and drop, or <span className="text-accent-text underline">browse</span>
        </span>
        <span className="mt-space-2 text-caption text-text-muted">{fallback}</span>
        {input}
      </label>
      {file && (
        <div className="rounded-widget bg-surface-1 px-space-6 py-space-5 shadow-edge">
          <div className="flex items-center justify-between gap-space-4">
            <span className="truncate text-body text-text-secondary">{file.name}</span>
            {!uploading && (
              <Button variant="outline" size="sm" icon={<Icon name="trash" size={18} />} onClick={onRemove}>
                Remove
              </Button>
            )}
          </div>
          {uploading && (
            <span className="mt-space-4 block">
              <Progress value={progress} />
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export { FileField };
export type { FileFieldProps, FileFieldVariant };
