"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Button,
  DatePicker,
  EmptyState,
  Icon,
  InputField,
  LanguageTabs,
  MultiSelect,
  PageHeader,
  RichTextField,
  SelectField,
  Skeleton,
  StatusDot,
  TextareaField,
  ToggleField,
  UploadButton,
  useDialog,
  useToast,
} from "@/components/ui";
import { uploadMedia } from "../../api/content.api";
import { kindLabel } from "../../copy";
import { useArticleEditor } from "../../hooks/use-article-editor";
import { useContentLang } from "../../hooks/use-content-lang";
import { useContentMe } from "../../hooks/use-content-me";
import { useTaxonomy } from "../../hooks/use-taxonomy";
import type { ArticleDraft, ContentLocale, MediaRef, TranslationDraft } from "../../types";
import { useMediaPicker } from "./media-picker";

const toRef = (m: { id: string; url: string; altEn: string; altAr: string; width: number | null; height: number | null }): MediaRef => ({
  id: m.id, url: m.url, altEn: m.altEn, altAr: m.altAr, width: m.width, height: m.height,
});

/** One article: both languages, its details, and publishing. */
export function ArticleEditorView({ id }: { id: string }) {
  const taxonomy = useTaxonomy();
  const { c } = useContentLang();
  if (taxonomy.error) {
    return <EmptyState icon="exclamation-circle" title={taxonomy.error} description="" action={<Button onClick={taxonomy.reload}>{c.retry}</Button>} />;
  }
  if (!taxonomy.data) return <EditorSkeleton />;
  return <Editor id={id} taxonomy={taxonomy.data} />;
}

type Taxonomy = NonNullable<ReturnType<typeof useTaxonomy>["data"]>;

function Editor({ id, taxonomy }: { id: string; taxonomy: Taxonomy }) {
  const router = useRouter();
  const { lang, c } = useContentLang();
  const t = c.editor;
  const f = t.fields;
  const me = useContentMe();
  const { confirm } = useDialog();
  const { showToast } = useToast();
  const picker = useMediaPicker();
  const lookups = useMemo(
    () => ({
      categoryIdBySlug: (slug: string) => taxonomy.categories.find((x) => x.slug === slug)?.id ?? null,
      tagIdsBySlugs: (slugs: string[]) => taxonomy.tags.filter((x) => slugs.includes(x.slug)).map((x) => x.id),
    }),
    [taxonomy],
  );
  const editor = useArticleEditor(id, lookups);
  const { doc, draft } = editor;

  if (editor.error) return <EmptyState icon="exclamation-circle" title={editor.error} description="" />;
  if (!doc || !draft) return <EditorSkeleton />;

  const canWrite = !!me.data && me.data.role !== "viewer" && me.data.sections.includes(doc.kind);
  const canPublish = !!me.data?.canPublish;
  const title = (lang === "ar" ? draft.translations.ar.title || draft.translations.en.title : draft.translations.en.title || draft.translations.ar.title) || c.list.untitled;
  const status = !doc.isPublished ? t.statusDraft : doc.hasUnpublishedChanges || editor.dirty ? t.statusChanged : t.statusPublished;

  const chooseImage = async (locale: ContentLocale) => {
    const item = await picker.pick();
    return item ? { url: item.url, alt: locale === "ar" ? item.altAr || item.altEn : item.altEn || item.altAr } : null;
  };

  const remove = async () => {
    const ok = await confirm({ title: t.removeTitle, body: t.removeBody, confirmLabel: t.remove, tone: "danger" });
    if (ok && (await editor.remove())) router.replace("/admin/cms");
  };

  return (
    <div className="flex flex-col gap-space-8">
      <PageHeader
        title={title}
        breadcrumb={<Link href={`/admin/cms?kind=${doc.kind}`}>{kindLabel(doc.kind, lang)}</Link>}
        description={
          <span className="inline-flex flex-wrap items-center gap-space-4">
            <StatusDot tone={doc.isPublished ? (doc.hasUnpublishedChanges || editor.dirty ? "warning" : "success") : "neutral"} label={status} />
            {editor.dirty && <span className="text-caption text-text-muted">{t.unsaved}</span>}
          </span>
        }
        actions={
          canWrite ? (
            <>
              <Button variant="outline" onClick={() => void editor.save()} disabled={!editor.dirty || !!editor.busy}>
                {editor.busy === "save" ? t.saving : t.save}
              </Button>
              {canPublish && (
                <Button onClick={() => void editor.publish()} disabled={!!editor.busy || (doc.isPublished && !doc.hasUnpublishedChanges && !editor.dirty)}>
                  {doc.isPublished ? t.update : t.publish}
                </Button>
              )}
            </>
          ) : undefined
        }
        secondaryActions={
          canPublish ? (
            <>
              {doc.isPublished && (
                <Button variant="ghost" icon={<Icon name="eye-slash" size={18} />} onClick={() => void editor.unpublish()} disabled={!!editor.busy}>
                  {t.takeDown}
                </Button>
              )}
              <Button variant="danger-soft" icon={<Icon name="trash" size={18} />} onClick={() => void remove()} disabled={!!editor.busy}>
                {t.remove}
              </Button>
            </>
          ) : undefined
        }
      />

      <div className="grid gap-space-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="mk-surface rounded-card bg-surface-1 p-space-8">
          <LanguageTabs
            label={f.body}
            arabicValue={draft.translations.ar.title}
            english={<TranslationFields locale="en" draft={draft.translations.en} readOnly={!canWrite} onChange={(p) => editor.setTranslation("en", p)} onInsertImage={() => chooseImage("en")} pickCover={picker.pick} />}
            arabic={<TranslationFields locale="ar" draft={draft.translations.ar} readOnly={!canWrite} onChange={(p) => editor.setTranslation("ar", p)} onInsertImage={() => chooseImage("ar")} pickCover={picker.pick} />}
          />
        </section>

        <aside className="mk-surface flex flex-col gap-space-6 self-start rounded-card bg-surface-1 p-space-8">
          <h2 className="text-h5 font-medium">{t.details}</h2>
          <InputField label={f.slug} value={draft.slug} dir="ltr" readOnly={!canWrite} onChange={(e) => editor.patch({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })} />
          <DatePicker label={f.date} value={draft.publishedOn} readOnly={!canWrite} onChange={(value) => editor.patch({ publishedOn: value })} />
          <SelectField
            label={f.author}
            value={draft.authorId ? String(draft.authorId) : ""}
            disabled={!canWrite}
            options={[{ value: "", label: f.none }, ...taxonomy.authors.map((a) => ({ value: String(a.id), label: a.name }))]}
            onChange={(value) => editor.patch({ authorId: value ? Number(value) : null })}
          />
          <SelectField
            label={f.category}
            value={draft.categoryId ? String(draft.categoryId) : ""}
            disabled={!canWrite}
            options={[{ value: "", label: f.none }, ...taxonomy.categories.map((x) => ({ value: String(x.id), label: lang === "ar" ? x.labelAr : x.labelEn }))]}
            onChange={(value) => editor.patch({ categoryId: value ? Number(value) : null })}
          />
          <MultiSelect
            label={f.tags}
            value={draft.tagIds.map(String)}
            disabled={!canWrite}
            options={taxonomy.tags.map((x) => ({ value: String(x.id), label: lang === "ar" ? x.labelAr : x.labelEn }))}
            onValueChange={(values) => editor.patch({ tagIds: values.map(Number) })}
          />
          {doc.kind === "guides" && <GuideFields draft={draft} readOnly={!canWrite} onChange={editor.patch} onUploadError={(m) => showToast(m, "danger")} />}
          {doc.kind === "compare" && (
            <InputField label={f.competitor} value={draft.competitorName} readOnly={!canWrite} onChange={(e) => editor.patch({ competitorName: e.target.value })} />
          )}
          <ToggleField label={f.provisional} description={f.provisionalHint} checked={draft.provisional} disabled={!canWrite} onChange={(provisional) => editor.patch({ provisional })} />
        </aside>
      </div>
      {picker.element}
    </div>
  );
}

function TranslationFields({
  locale,
  draft,
  readOnly,
  onChange,
  onInsertImage,
  pickCover,
}: {
  locale: ContentLocale;
  draft: TranslationDraft;
  readOnly: boolean;
  onChange: (patch: Partial<TranslationDraft>) => void;
  onInsertImage: () => Promise<{ url: string; alt: string } | null>;
  pickCover: ReturnType<typeof useMediaPicker>["pick"];
}) {
  const { c } = useContentLang();
  const t = c.editor;
  const f = t.fields;
  const dir = locale === "ar" ? "rtl" : "ltr";
  return (
    <div className="flex flex-col gap-space-6 pt-space-6">
      <InputField label={f.title} value={draft.title} dir={dir} readOnly={readOnly} maxLength={200} onChange={(e) => onChange({ title: e.target.value })} />
      <TextareaField label={f.excerpt} value={draft.excerpt} dir={dir} readOnly={readOnly} maxLength={600} rows={3} onChange={(e) => onChange({ excerpt: e.target.value })} />
      <div className="flex flex-col gap-space-3">
        <span className="text-caption text-text-muted">{f.heroImage}</span>
        <div className="flex flex-wrap items-center gap-space-4">
          {draft.heroImage && (
            // eslint-disable-next-line @next/next/no-img-element -- media from the content store, any host
            <img src={draft.heroImage.url} alt={locale === "ar" ? draft.heroImage.altAr : draft.heroImage.altEn} className="h-20 rounded-lg object-cover" />
          )}
          {!readOnly && (
            <>
              <Button variant="outline" size="sm" onClick={() => void pickCover().then((m) => m && onChange({ heroImage: toRef(m) }))}>
                {draft.heroImage ? t.changeImage : t.chooseImage}
              </Button>
              {draft.heroImage && (
                <Button variant="ghost" size="sm" onClick={() => onChange({ heroImage: null })}>
                  {t.removeImage}
                </Button>
              )}
            </>
          )}
        </div>
      </div>
      {draft.heroImage && <InputField label={f.heroCaption} value={draft.heroCaption} dir={dir} readOnly={readOnly} onChange={(e) => onChange({ heroCaption: e.target.value })} />}
      <RichTextField
        label={f.body}
        value={draft.bodyHtml}
        onChange={(bodyHtml) => onChange({ bodyHtml })}
        tools="article"
        onInsertImage={onInsertImage}
        readOnly={readOnly}
        minHeight={360}
      />
      <InputField label={f.seoTitle} value={draft.seoTitle} dir={dir} readOnly={readOnly} maxLength={200} onChange={(e) => onChange({ seoTitle: e.target.value })} />
      <TextareaField label={f.seoDescription} value={draft.seoDescription} dir={dir} readOnly={readOnly} maxLength={320} rows={2} onChange={(e) => onChange({ seoDescription: e.target.value })} />
    </div>
  );
}

function GuideFields({
  draft,
  readOnly,
  onChange,
  onUploadError,
}: {
  draft: ArticleDraft;
  readOnly: boolean;
  onChange: (patch: Partial<ArticleDraft>) => void;
  onUploadError: (message: string) => void;
}) {
  const { c } = useContentLang();
  const f = c.editor.fields;
  const types = c.editor.guideTypes;
  return (
    <>
      <SelectField
        label={f.guideType}
        value={draft.guideType}
        disabled={readOnly}
        options={[{ value: "", label: f.none }, ...(["checklist", "template", "worksheet"] as const).map((k) => ({ value: k, label: types[k] }))]}
        onChange={(value) => onChange({ guideType: value as ArticleDraft["guideType"] })}
      />
      <div className="flex flex-col gap-space-3">
        <span className="text-caption text-text-muted">{f.download}</span>
        {draft.downloadFile && (
          <a href={draft.downloadFile.url} target="_blank" rel="noreferrer" dir="ltr" className="truncate text-body">
            {draft.downloadFile.url.split("/").pop()}
          </a>
        )}
        {!readOnly && (
          <UploadButton
            variant="outline"
            size="sm"
            onFiles={(files) => {
              const file = files[0];
              if (file) void uploadMedia(file).then((m) => onChange({ downloadFile: toRef(m) })).catch((e: unknown) => onUploadError(e instanceof Error ? e.message : String(e)));
            }}
          >
            {c.editor.chooseFile}
          </UploadButton>
        )}
      </div>
    </>
  );
}

/** The editor's shape while it loads, so nothing shifts when it arrives. */
function EditorSkeleton() {
  return (
    <div className="flex flex-col gap-space-8" aria-busy>
      <Skeleton className="h-10 w-1/3" />
      <div className="grid gap-space-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Skeleton className="h-96" />
        <Skeleton className="h-72" />
      </div>
    </div>
  );
}
