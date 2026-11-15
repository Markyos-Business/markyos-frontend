"use client";

import { useId, useState } from "react";
import { useFileDrop } from "@/hooks/useFileDrop";
import { Icon } from "../icon";
import { labelClasses } from "../field/input-field";
import { useUiStrings } from "../ui-strings";
import { fileSize, sortFiles, type FileRejection } from "./file-rules";

type FileDropzoneProps = {
  label: string;
  /** A line under the label. */
  description?: string;
  /** Extensions, MIME types or groups: ".pdf,image/*". */
  accept?: string;
  /** What the accepted types are called, for the hint and refusals: "PDF or image". */
  acceptLabel: string;
  /** The largest file allowed, in bytes. */
  maxBytes?: number;
  /** The most files at once, counting `already`. */
  maxFiles?: number;
  /** Files already chosen, so `maxFiles` counts them. */
  already?: number;
  /** Several files at once. Default true. */
  multiple?: boolean;
  /** The files that passed type, size and count. */
  onFiles: (files: File[]) => void;
  /** The ones that didn't, and why; they are also listed under the zone. */
  onReject?: (rejections: FileRejection[]) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
};

/**
 * A place to drop files or browse for them. Type, size and count are checked
 * here; files that don't pass are listed under the zone, each with its
 * reason, until the next drop. The zone is a real label around a file input,
 * so Tab reaches it and Enter or Space opens the picker.
 */
const FileDropzone = ({ label, description, accept, acceptLabel, maxBytes, maxFiles, already = 0, multiple = true, onFiles, onReject, disabled = false, required = false, className = "" }: FileDropzoneProps) => {
  const { t } = useUiStrings();
  const id = `dz-${useId()}`;
  const [rejections, setRejections] = useState<FileRejection[]>([]);
  const limit = maxBytes !== undefined ? fileSize(maxBytes) : undefined;
  const hint = limit ? t.fileLimit(acceptLabel, limit) : acceptLabel;

  const take = (files: File[]) => {
    const { accepted, rejected } = sortFiles(multiple ? files : files.slice(0, 1), { accept, maxBytes, maxFiles, already });
    setRejections(rejected);
    if (rejected.length) onReject?.(rejected);
    if (accepted.length) onFiles(accepted);
  };
  const { isDragging, dropHandlers } = useFileDrop({ onFiles: take, disabled });
  const reason = (r: FileRejection) =>
    r.reason === "type" ? t.wrongFileType(r.file.name, acceptLabel) : r.reason === "size" ? t.fileTooLarge(r.file.name, limit ?? "") : t.tooManyFiles(maxFiles ?? 0);

  return (
    <div className={`flex w-full flex-col gap-space-3 ${className}`}>
      <div>
        <label htmlFor={id} className={labelClasses}>
          {label}
          {required && (
            <span aria-hidden className="ms-0.5 text-danger">
              *
            </span>
          )}
        </label>
        {description && <p className="px-space-5 text-caption text-text-faint">{description}</p>}
      </div>
      <label
        {...dropHandlers}
        // `relative` keeps the hidden file input inside the zone.
        className={`relative flex cursor-pointer flex-col items-center justify-center rounded-card border border-dashed px-space-8 py-space-10 text-center transition-[background-color,border-color] has-disabled:cursor-not-allowed has-disabled:opacity-58 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent ${
          isDragging ? "border-accent bg-accent-soft" : rejections.length ? "border-danger bg-surface-1" : "border-line-strong bg-surface-1 hover:border-accent"
        }`}
      >
        <span aria-hidden className="mb-space-5 flex size-control items-center justify-center rounded-lg bg-accent-soft text-accent-on-soft">
          <Icon name="upload" size={22} />
        </span>
        <span className="text-body font-medium text-text">
          {t.dragOrBrowse} <span className="text-accent-text underline">{t.browse}</span>
        </span>
        <span className="mt-space-2 text-caption text-text-muted">{hint}</span>
        <input
          id={id}
          type="file"
          accept={accept}
          multiple={multiple}
          required={required}
          disabled={disabled}
          aria-describedby={rejections.length ? `${id}-refused` : undefined}
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            e.target.value = "";
            if (files.length) take(files);
          }}
          className="sr-only"
        />
      </label>
      {rejections.length > 0 && (
        <div id={`${id}-refused`} role="alert" className="flex flex-col gap-space-1 px-space-5 text-caption text-danger">
          <span className="font-medium">{t.filesRejected(rejections.length)}</span>
          <ul className="flex flex-col gap-space-1">
            {rejections.map((r) => (
              <li key={`${r.file.name}-${r.reason}`} className="flex items-start gap-space-2">
                <Icon name="exclamation-circle" size={16} className="mt-0.5 shrink-0" />
                <span dir="auto">{reason(r)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export { FileDropzone };
export type { FileDropzoneProps };
