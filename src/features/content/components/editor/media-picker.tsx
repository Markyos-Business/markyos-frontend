"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FormDialog, UploadButton, useToast } from "@/components/ui";
import { listMedia, uploadMedia } from "../../api/content.api";
import { useContentLang } from "../../hooks/use-content-lang";
import type { MediaItem } from "../../types";
import { errorText } from "@/lib/api/errorText";

/**
 * Choosing an image from the media library, or uploading a new one.
 *
 * `pick()` opens the dialog and resolves with the chosen image, or null when
 * it's closed: the article editor awaits it for an image in the text, the
 * cover field for the cover.
 */
export function useMediaPicker() {
  const [resolver, setResolver] = useState<((item: MediaItem | null) => void) | null>(null);
  const pick = useCallback(() => new Promise<MediaItem | null>((resolve) => setResolver(() => resolve)), []);
  const close = (item: MediaItem | null) => {
    resolver?.(item);
    setResolver(null);
  };
  const element = resolver ? <MediaPickerDialog onDone={close} /> : null;
  return { pick, element };
}

function MediaPickerDialog({ onDone }: { onDone: (item: MediaItem | null) => void }) {
  const { c, lang } = useContentLang();
  const t = c.picker;
  const { showToast } = useToast();
  const [items, setItems] = useState<MediaItem[] | null>(null);
  const [chosen, setChosen] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const done = useRef(false);

  useEffect(() => {
    listMedia()
      .then((all) => setItems(all.filter((m) => m.contentType.startsWith("image/"))))
      .catch(() => setItems([]));
  }, []);

  const upload = async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    setUploading(true);
    try {
      const item = await uploadMedia(file);
      setItems((current) => [item, ...(current ?? [])]);
      setChosen(item.id);
    } catch (e: unknown) {
      showToast(errorText(e, lang), "danger");
    } finally {
      setUploading(false);
    }
  };

  const finish = (item: MediaItem | null) => {
    if (done.current) return;
    done.current = true;
    onDone(item);
  };

  return (
    <FormDialog
      open
      title={t.title}
      submitLabel={t.choose}
      cancelLabel={t.cancel}
      onClose={() => finish(null)}
      onSubmit={() => finish(items?.find((m) => m.id === chosen) ?? null)}
    >
      <div className="flex justify-end">
        <UploadButton variant="outline" accept="image/*" onFiles={(files) => void upload(files)} disabled={uploading}>
          {uploading ? t.uploading : t.upload}
        </UploadButton>
      </div>
      {items && items.length === 0 && <p className="text-body text-text-muted">{t.empty}</p>}
      <div role="listbox" aria-label={t.title} className="grid max-h-[50vh] grid-cols-3 gap-space-4 overflow-y-auto sm:grid-cols-4">
        {items?.map((m) => (
          <button
            key={m.id}
            type="button"
            role="option"
            aria-selected={chosen === m.id}
            onClick={() => setChosen(m.id)}
            onDoubleClick={() => finish(m)}
            className={`overflow-hidden rounded-lg bg-surface-2 ${chosen === m.id ? "shadow-[inset_0_0_0_2px_var(--accent)]" : "shadow-edge"}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- media from the content store, any host */}
            <img src={m.url} alt={m.altEn || m.altAr || m.fileName} className="aspect-square w-full object-cover" />
          </button>
        ))}
      </div>
    </FormDialog>
  );
}
