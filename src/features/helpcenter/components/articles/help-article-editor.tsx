"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, DatePicker, EmptyState, Icon, InputField, LanguageTabs, MultiSelect, PageHeader, RichTextField, SelectField, Skeleton, TextareaField, useDialog, useToast } from "@/components/ui";
import { useRequest } from "@/hooks/useRequest";
import { errorText } from "@/lib/api/errorText";
import { useContentMe, useMediaPicker, useTaxonomy } from "@/features/content";
import { archiveHelpArticle, deleteHelpArticle, duplicateHelpArticle, listHelpArticles, listHelpCategories, unarchiveHelpArticle } from "../../api/help.api";
import { useHelpCopy } from "../../hooks/use-help-copy";
import { useHelpEditor } from "../../hooks/use-help-editor";
import type { HelpArticleType, HelpAudience, HelpLocale, HelpMediaRef, HelpStatus, HelpTranslationDraft, HelpVisibility } from "../../types";
import { LabelledChoice } from "../shared/labelled-choice";
import { WorkflowBar } from "../workflow/workflow-bar";
import { HelpVersionHistory } from "./help-version-history";
import { StatusDots } from "./status-dots";

const TYPES: HelpArticleType[] = ["guide", "tutorial", "faq", "troubleshooting"];
const AUDIENCES: HelpAudience[] = ["all", "studio", "freelancer", "company"];
const LIST = "/admin/cms/help";

/** One Help article: both languages, its details, history; saves on its own. */
export function HelpArticleEditor({ id }: { id: string }) {
  const { h, lang } = useHelpCopy();
  const t = h.editor;
  const f = t.fields;
  const router = useRouter();
  const me = useContentMe();
  const taxonomy = useTaxonomy();
  const categories = useRequest(listHelpCategories, "help-categories");
  const others = useRequest(() => listHelpArticles(), "help-articles-all");
  const picker = useMediaPicker();
  const editor = useHelpEditor(id);
  const { confirm } = useDialog();
  const { showToast } = useToast();
  const { doc, draft } = editor;

  if (editor.loadError) return <EmptyState icon="exclamation-circle" title={editor.loadError} description="" />;
  if (!doc || !draft) return <EditorSkeleton />;

  const canWrite = !!me.data && me.data.role !== "viewer";
  const canManage = !!me.data?.canPublish;
  const readOnly = !canWrite;
  const statusOf = (locale: HelpLocale): HelpStatus | null => doc.translations[locale]?.status ?? null;
  const archived = statusOf("en") === "archived" || statusOf("ar") === "archived";
  const name = (lang === "ar" ? draft.translations.ar.title || draft.translations.en.title : draft.translations.en.title || draft.translations.ar.title) || h.articles.untitled;
  const saveLabel = editor.state === "saving" ? t.saving : editor.dirty ? t.unsaved : editor.state === "saved" ? t.saved : "";

  const run = async (work: () => Promise<unknown>, done: string, then?: () => void) => {
    try {
      await work();
      showToast(done, "success");
      then?.();
    } catch (e: unknown) {
      showToast(errorText(e, lang), "danger");
    }
  };

  const categoryOptions = (categories.data ?? []).map((c) => {
    const parent = categories.data?.find((p) => p.id === c.parent);
    const label = (x: typeof c) => (lang === "ar" ? x.titleAr || x.titleEn : x.titleEn || x.titleAr) || h.articles.untitled;
    return { value: String(c.id), label: parent ? `${label(parent)} › ${label(c)}` : label(c) };
  });

  const fieldsFor = (locale: HelpLocale) => (
    <div className="flex flex-col gap-space-6 pt-space-6">
      {/* Each language is published on its own, from its own tab. */}
      <WorkflowBar doc={doc} locale={locale} canWrite={canWrite} canManage={canManage} dirty={editor.dirty} save={editor.save} adopt={editor.adopt} />
    <TranslationFields
      locale={locale}
      draft={draft.translations[locale]}
      readOnly={readOnly}
      errors={editor.fields}
      onChange={(p) => editor.setTranslation(locale, p)}
      pickImage={async () => {
        const m = await picker.pick();
        return m ? { id: m.id, url: m.url, altEn: m.altEn, altAr: m.altAr } : null;
      }}
    />
    </div>
  );

  return (
    <div className="flex flex-col gap-space-8">
      <PageHeader
        title={name}
        breadcrumb={<Link href={LIST}>{t.back}</Link>}
        description={
          <span className="inline-flex flex-wrap items-center gap-ctl-row">
            <StatusDots status={{ en: statusOf("en"), ar: statusOf("ar") }} />
            {saveLabel && <span role="status" className="text-caption text-text-muted">{saveLabel}</span>}
          </span>
        }
        actions={canWrite && (
          // Outline: each language's Publish is the main action on this page.
          <Button variant="outline" onClick={() => void editor.save()} disabled={!editor.dirty || editor.state === "saving"}>
            {editor.state === "saving" ? t.saving : t.save}
          </Button>
        )}
        secondaryActions={
          <>
            <HelpVersionHistory id={id} version={doc.version} canWrite={canWrite} onRestore={editor.restore} />
            {canWrite && (
              <Button variant="outline" icon={<Icon name="copy" size={18} />} onClick={() => void run(async () => router.push(`${LIST}/articles/${(await duplicateHelpArticle(id)).id}`), h.articles.toast.duplicated)}>
                {h.articles.actions.duplicate}
              </Button>
            )}
            {canManage && (
              archived ? (
                <Button variant="outline" icon={<Icon name="undo" size={18} />} onClick={() => void run(async () => editor.adopt(await unarchiveHelpArticle(id)), h.articles.toast.unarchived)}>
                  {h.articles.actions.unarchive}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  icon={<Icon name="inbox" size={18} />}
                  onClick={async () => {
                    if (await confirm({ title: h.articles.confirmArchive.title(name), body: h.articles.confirmArchive.body, confirmLabel: h.articles.confirmArchive.confirm }))
                      void run(async () => editor.adopt(await archiveHelpArticle(id)), h.articles.toast.archived);
                  }}
                >
                  {h.articles.actions.archive}
                </Button>
              )
            )}
            {canManage && (
              <Button
                variant="danger-soft"
                icon={<Icon name="trash" size={18} />}
                onClick={async () => {
                  if (await confirm({ title: h.articles.confirmRemove.title(name), body: h.articles.confirmRemove.body, confirmLabel: h.articles.confirmRemove.confirm, tone: "danger" }))
                    void run(() => deleteHelpArticle(id), h.articles.toast.removed, () => router.replace(LIST));
                }}
              >
                {h.articles.actions.remove}
              </Button>
            )}
          </>
        }
      />

      <div className="grid gap-space-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="mk-surface rounded-card bg-surface-1 p-space-8">
          <LanguageTabs label={f.body} arabicValue={draft.translations.ar.title} english={fieldsFor("en")} arabic={fieldsFor("ar")} />
        </section>

        <aside className="mk-surface flex flex-col gap-field-stack self-start rounded-card bg-surface-1 p-space-8">
          <h2 className="text-h5 font-medium">{t.details}</h2>
          <SelectField label={f.category} value={draft.categoryId ? String(draft.categoryId) : ""} disabled={readOnly} options={[{ value: "", label: f.none }, ...categoryOptions]} onChange={(v) => editor.patch({ categoryId: v ? Number(v) : null })} />
          <SelectField label={f.type} value={draft.type} disabled={readOnly} options={TYPES.map((x) => ({ value: x, label: h.articles.types[x] }))} onChange={(v) => editor.patch({ type: v as HelpArticleType })} />
          <SelectField label={f.audience} value={draft.audience} disabled={readOnly} options={AUDIENCES.map((x) => ({ value: x, label: h.articles.audiences[x] }))} onChange={(v) => editor.patch({ audience: v as HelpAudience })} />
          <LabelledChoice<HelpVisibility>
            label={f.visibility}
            value={draft.visibility}
            disabled={readOnly}
            onChange={(visibility) => !readOnly && editor.patch({ visibility })}
            options={[{ value: "public", label: h.categories.visibility.public }, { value: "signed_in", label: h.categories.visibility.signed_in }]}
          />
          <SelectField
            label={f.author}
            value={draft.authorId ? String(draft.authorId) : ""}
            disabled={readOnly}
            options={[{ value: "", label: f.none }, ...(taxonomy.data?.authors ?? []).map((x) => ({ value: String(x.id), label: x.name }))]}
            onChange={(v) => editor.patch({ authorId: v ? Number(v) : null })}
          />
          <MultiSelect
            label={f.tags}
            value={draft.tagIds.map(String)}
            disabled={readOnly}
            options={(taxonomy.data?.tags ?? []).map((x) => ({ value: String(x.id), label: lang === "ar" ? x.labelAr : x.labelEn }))}
            onValueChange={(values) => editor.patch({ tagIds: values.map(Number) })}
          />
          <MultiSelect
            label={f.related}
            value={draft.relatedIds}
            disabled={readOnly}
            options={(others.data ?? []).filter((r) => r.id !== id).map((r) => ({ value: r.id, label: (lang === "ar" ? r.titleAr || r.titleEn : r.titleEn || r.titleAr) || h.articles.untitled }))}
            onValueChange={(relatedIds) => editor.patch({ relatedIds })}
          />
          <DatePicker label={f.lastReviewed} value={draft.lastReviewed} readOnly={readOnly} onChange={(lastReviewed) => editor.patch({ lastReviewed })} />
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
  errors,
  onChange,
  pickImage,
}: {
  locale: HelpLocale;
  draft: HelpTranslationDraft;
  readOnly: boolean;
  errors: Record<string, string>;
  onChange: (patch: Partial<HelpTranslationDraft>) => void;
  pickImage: () => Promise<HelpMediaRef | null>;
}) {
  const { h } = useHelpCopy();
  const t = h.editor;
  const f = t.fields;
  const dir = locale === "ar" ? "rtl" : "ltr";
  const alt = (m: HelpMediaRef) => (locale === "ar" ? m.altAr || m.altEn : m.altEn || m.altAr);
  return (
    <div className="flex flex-col gap-field-stack">
      <InputField label={f.title} value={draft.title} dir={dir} readOnly={readOnly} maxLength={200} onChange={(e) => onChange({ title: e.target.value })} />
      <InputField
        label={f.slug}
        hint={f.slugHint}
        error={errors[`${locale}.slug`] ? t.errors.slug : undefined}
        value={draft.slug}
        dir={dir}
        readOnly={readOnly}
        maxLength={160}
        onChange={(e) => onChange({ slug: locale === "en" ? e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") : e.target.value.replace(/\s+/g, "-") })}
      />
      <TextareaField label={f.summary} hint={f.summaryHint} value={draft.summary} dir={dir} readOnly={readOnly} maxLength={300} rows={2} onChange={(e) => onChange({ summary: e.target.value })} />
      <RichTextField
        label={f.body}
        value={draft.bodyHtml}
        onChange={(bodyHtml) => onChange({ bodyHtml })}
        tools="help"
        onInsertImage={async () => {
          const m = await pickImage();
          return m ? { url: m.url, alt: alt(m) } : null;
        }}
        readOnly={readOnly}
        minHeight={360}
      />
      <h3 className="pt-space-4 text-h5 font-medium">{t.seo}</h3>
      <InputField label={f.seoTitle} value={draft.seoTitle} dir={dir} readOnly={readOnly} maxLength={200} onChange={(e) => onChange({ seoTitle: e.target.value })} />
      <TextareaField label={f.seoDescription} value={draft.seoDescription} dir={dir} readOnly={readOnly} maxLength={320} rows={2} onChange={(e) => onChange({ seoDescription: e.target.value })} />
      <div className="flex flex-col gap-space-3">
        <span className="text-caption text-text-muted">{f.ogImage}</span>
        <div className="flex flex-wrap items-center gap-ctl-row">
          {draft.ogImage && (
            // eslint-disable-next-line @next/next/no-img-element -- media from the content store, any host
            <img src={draft.ogImage.url} alt={alt(draft.ogImage)} className="h-20 rounded-lg object-cover" />
          )}
          {!readOnly && (
            <>
              <Button variant="outline" size="sm" onClick={() => void pickImage().then((m) => m && onChange({ ogImage: m }))}>{f.chooseImage}</Button>
              {draft.ogImage && <Button variant="ghost" size="sm" onClick={() => onChange({ ogImage: null })}>{f.removeImage}</Button>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

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
