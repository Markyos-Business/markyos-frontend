"use client";

import { useState } from "react";
import { Button, EmptyState, FormDialog, Icon, InputField, PageHeader, Skeleton, UploadButton, useToast } from "@/components/ui";
import { useRequest } from "@/hooks/useRequest";
import { deleteMedia, listMedia, updateMedia, uploadMedia } from "../../api/content.api";
import { useContentLang } from "../../hooks/use-content-lang";
import { useContentMe } from "../../hooks/use-content-me";
import { useRemove } from "../../hooks/use-remove";
import type { MediaItem } from "../../types";
import { errorText } from "@/lib/api/errorText";

/** Every file the website uses, with the descriptions images need. */
export function MediaView() {
  const { lang, c } = useContentLang();
  const t = c.media;
  const me = useContentMe();
  const media = useRequest(listMedia, "content-media");
  const { showToast } = useToast();
  const [editing, setEditing] = useState<MediaItem | null>(null);
  const [uploading, setUploading] = useState(false);

  const upload = async (files: File[]) => {
    setUploading(true);
    try {
      for (const file of files) await uploadMedia(file);
      media.reload();
    } catch (e: unknown) {
      showToast(errorText(e, lang), "danger");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-space-8">
      <PageHeader
        title={t.title}
        description={t.description}
        actions={
          me.data?.canContribute ? (
            <UploadButton multiple onFiles={(files) => void upload(files)} disabled={uploading} icon={<Icon name="upload" size={18} />}>
              {t.upload}
            </UploadButton>
          ) : undefined
        }
      />
      {media.loading && <Skeleton className="h-64 rounded-card" />}
      {media.data && media.data.length === 0 && <EmptyState icon="image" title={t.empty} description="" />}
      <ul className="grid grid-cols-2 gap-space-6 sm:grid-cols-3 lg:grid-cols-5">
        {media.data?.map((m) => {
          const alt = lang === "ar" ? m.altAr || m.altEn : m.altEn || m.altAr;
          return (
            <li key={m.id}>
              <button type="button" onClick={() => setEditing(m)} className="mk-surface flex w-full flex-col overflow-hidden rounded-card bg-surface-1 text-start">
                {m.contentType.startsWith("image/") ? (
                  // eslint-disable-next-line @next/next/no-img-element -- media from the content store, any host
                  <img src={m.url} alt={alt} className="aspect-video w-full bg-surface-2 object-cover" />
                ) : (
                  <span className="grid aspect-video w-full place-items-center bg-surface-2 text-text-muted">
                    <Icon name="file-alt" size={22} />
                  </span>
                )}
                <span className="flex flex-col gap-space-1 p-space-4">
                  <span dir="ltr" className="truncate text-caption text-text-muted">{m.fileName}</span>
                  <span dir="auto" className={`truncate text-body ${alt ? "text-text" : "text-warning"}`}>{alt || t.noAlt}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {editing && (
        <EditMediaDialog
          item={editing}
          canEdit={!!me.data?.canContribute}
          canDelete={!!me.data?.canPublish}
          onClose={() => setEditing(null)}
          onChanged={() => {
            setEditing(null);
            media.reload();
          }}
        />
      )}
    </div>
  );
}

function EditMediaDialog({ item, canEdit, canDelete, onClose, onChanged }: { item: MediaItem; canEdit: boolean; canDelete: boolean; onClose: () => void; onChanged: () => void }) {
  const { c, lang } = useContentLang();
  const t = c.media;
  const remove = useRemove();
  const [altEn, setAltEn] = useState(item.altEn);
  const [altAr, setAltAr] = useState(item.altAr);
  const [credit, setCredit] = useState(item.credit);
  return (
    <FormDialog
      open
      title={t.edit}
      submitLabel={c.common.save}
      onClose={onClose}
      onSubmit={async () => {
        if (!canEdit) return onClose();
        try {
          await updateMedia(item.id, { altEn, altAr, credit });
          onChanged();
        } catch (e: unknown) {
          return errorText(e, lang);
        }
      }}
    >
      {item.contentType.startsWith("image/") && (
        // eslint-disable-next-line @next/next/no-img-element -- media from the content store, any host
        <img src={item.url} alt={altEn || altAr} className="max-h-56 w-full rounded-lg bg-surface-2 object-contain" />
      )}
      <InputField label={t.altEn} value={altEn} dir="ltr" readOnly={!canEdit} maxLength={300} onChange={(e) => setAltEn(e.target.value)} />
      <InputField label={t.altAr} value={altAr} dir="rtl" readOnly={!canEdit} maxLength={300} onChange={(e) => setAltAr(e.target.value)} />
      <InputField label={t.credit} value={credit} readOnly={!canEdit} maxLength={200} onChange={(e) => setCredit(e.target.value)} />
      {canDelete && (
        <div>
          <Button variant="danger" size="sm" icon={<Icon name="trash" size={18} />} onClick={() => void remove(() => deleteMedia(item.id), onChanged)}>
            {c.common.remove}
          </Button>
        </div>
      )}
    </FormDialog>
  );
}
