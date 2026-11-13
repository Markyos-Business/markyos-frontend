"use client";

import { useEffect, useRef, useState } from "react";
import { useFileDrop } from "@/hooks/useFileDrop";
import { Avatar } from "../avatar/avatar";
import { Button } from "../button/button";
import { Icon } from "../icon";
import { FormDialog } from "../overlay/form-dialog";
import { labelClasses } from "../field/input-field";
import { useUiStrings } from "../ui-strings";
import { FileDropzone } from "./file-dropzone";
import { fileSize, sortFiles } from "./file-rules";
import { ImageCropper, cropToDataUrl, type CropView } from "./image-cropper";

type ImageUploadProps = {
  label: string;
  description?: string;
  /** The current image (a URL or data URL), or null. */
  value: string | null;
  /** The cropped image as a data URL, or null when removed. */
  onChange: (value: string | null) => void;
  /** Width over height of the result. Default 16/9. */
  aspect?: number;
  /** Width of the result in pixels. Default 1600. */
  outputWidth?: number;
  /** Accepted types. Default "image/png,image/jpeg,image/webp". */
  accept?: string;
  acceptLabel?: string;
  /** Largest file in bytes. Default 10 MB. */
  maxBytes?: number;
  disabled?: boolean;
  error?: string;
};

const DEFAULT_ACCEPT = "image/png,image/jpeg,image/webp";
const START: CropView = { zoom: 1, x: 0, y: 0 };

/** The crop step both uploads share: a dialog around the cropper, Apply and Cancel. */
function useCropDialog({ aspect, outputWidth, onDone }: { aspect: number; outputWidth: number; onDone: (dataUrl: string) => void }) {
  const [source, setSource] = useState<string | null>(null);
  const [view, setView] = useState<CropView>(START);
  // An object URL holds the file in memory until revoked.
  useEffect(() => () => {
    if (source?.startsWith("blob:")) URL.revokeObjectURL(source);
  }, [source]);
  return {
    open: (src: string) => {
      setView(START);
      setSource(src);
    },
    dialog: (title: string, submit: string, shape: "rect" | "circle") => (
      <FormDialog
        open={source !== null}
        title={title}
        submitLabel={submit}
        onClose={() => setSource(null)}
        onSubmit={async () => {
          if (!source) return;
          onDone(await cropToDataUrl(source, view, aspect, outputWidth));
          setSource(null);
        }}
      >
        {source && <ImageCropper src={source} aspect={aspect} shape={shape} view={view} onViewChange={setView} />}
      </FormDialog>
    ),
  };
}

/**
 * A picture for a brand, a cover or a post: drop or browse, then choose what
 * shows in the crop, at a fixed aspect. With an image in place it shows a
 * preview with Crop, Replace and Remove. Hands back a data URL of the crop.
 */
const ImageUpload = ({ label, description, value, onChange, aspect = 16 / 9, outputWidth = 1600, accept = DEFAULT_ACCEPT, acceptLabel: givenAcceptLabel, maxBytes = 10 * 1024 * 1024, disabled = false, error }: ImageUploadProps) => {
  const { t } = useUiStrings();
  const acceptLabel = givenAcceptLabel ?? t.imageTypes;
  const picker = useRef<HTMLInputElement>(null);
  const crop = useCropDialog({ aspect, outputWidth, onDone: onChange });
  const choose = (file: File) => crop.open(URL.createObjectURL(file));

  if (!value) {
    return (
      <>
        <FileDropzone label={label} description={description} accept={accept} acceptLabel={acceptLabel} maxBytes={maxBytes} multiple={false} disabled={disabled} onFiles={([f]) => choose(f)} />
        {error && <span className="px-space-5 text-caption text-danger">{error}</span>}
        {crop.dialog(t.adjustImage, t.apply, "rect")}
      </>
    );
  }

  return (
    <div className="flex w-full flex-col gap-space-3">
      <span className={labelClasses}>{label}</span>
      <div className="overflow-hidden rounded-card bg-surface-sunken shadow-edge" style={{ aspectRatio: String(aspect) }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- a data URL from the crop, not a page image */}
        <img src={value} alt={t.imagePreview(label)} className="size-full object-cover" />
      </div>
      <div className="flex flex-wrap gap-space-3">
        <Button size="sm" variant="outline" icon={<Icon name="expand" size={16} />} disabled={disabled} onClick={() => crop.open(value)}>
          {t.crop}
        </Button>
        <Button size="sm" variant="outline" icon={<Icon name="upload" size={16} />} disabled={disabled} onClick={() => picker.current?.click()}>
          {t.replace}
        </Button>
        <Button size="sm" variant="ghost" icon={<Icon name="trash" size={16} />} disabled={disabled} onClick={() => onChange(null)}>
          {t.removeFile}
        </Button>
      </div>
      <input
        ref={picker}
        type="file"
        accept={accept}
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f && sortFiles([f], { accept, maxBytes }).accepted.length) choose(f);
        }}
        className="hidden"
      />
      {error && <span className="px-space-5 text-caption text-danger">{error}</span>}
      {crop.dialog(t.adjustImage, t.apply, "rect")}
    </div>
  );
};

type AvatarUploadProps = Omit<ImageUploadProps, "aspect" | "description"> & {
  /** Initials shown with no photo: "NH". */
  initials: string;
};

/**
 * A profile photo: the avatar, a circular crop, Upload or Change and Remove.
 * A photo can also be dropped on the avatar. Hands back a square data URL
 * (512 px by default); it's shown in a circle wherever it's used.
 */
const AvatarUpload = ({ label, value, onChange, initials, outputWidth = 512, accept = DEFAULT_ACCEPT, acceptLabel: givenAcceptLabel, maxBytes = 5 * 1024 * 1024, disabled = false, error }: AvatarUploadProps) => {
  const { t } = useUiStrings();
  const acceptLabel = givenAcceptLabel ?? t.imageTypes;
  const picker = useRef<HTMLInputElement>(null);
  const [refused, setRefused] = useState<string | null>(null);
  const crop = useCropDialog({ aspect: 1, outputWidth, onDone: onChange });
  const choose = (file: File) => {
    const { accepted, rejected } = sortFiles([file], { accept, maxBytes });
    setRefused(rejected[0] ? (rejected[0].reason === "type" ? t.wrongFileType(file.name, acceptLabel) : t.fileTooLarge(file.name, fileSize(maxBytes))) : null);
    if (accepted[0]) crop.open(URL.createObjectURL(accepted[0]));
  };
  const { isDragging, dropHandlers } = useFileDrop({ onFiles: (files) => choose(files[0]), disabled });
  const note = error ?? refused;

  return (
    <div className="flex flex-col gap-space-3">
      <span className={labelClasses}>{label}</span>
      <div className="flex items-center gap-space-6">
        <div {...dropHandlers} className={`rounded-full transition-shadow ${isDragging ? "shadow-edge-accent" : ""}`}>
          <Avatar initials={initials} src={value} size={96} />
        </div>
        <div className="flex flex-col items-start gap-space-3">
          <Button size="sm" variant="outline" icon={<Icon name="upload" size={16} />} disabled={disabled} onClick={() => picker.current?.click()}>
            {value ? t.changePhoto : t.uploadPhoto}
          </Button>
          {value && (
            <Button size="sm" variant="ghost" icon={<Icon name="trash" size={16} />} disabled={disabled} onClick={() => onChange(null)}>
              {t.removePhoto}
            </Button>
          )}
          <span className="text-caption text-text-faint">{t.fileLimit(acceptLabel, fileSize(maxBytes))}</span>
        </div>
      </div>
      <input
        ref={picker}
        type="file"
        accept={accept}
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) choose(f);
        }}
        className="hidden"
      />
      {note && (
        <span role="alert" className="text-caption text-danger">
          {note}
        </span>
      )}
      {crop.dialog(t.adjustImage, t.apply, "circle")}
    </div>
  );
};

export { AvatarUpload, ImageUpload };
export type { AvatarUploadProps, ImageUploadProps };
