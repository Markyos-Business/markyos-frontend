"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, DataTable, EmptyState, FormDialog, Icon, InputField, PageHeader, SelectField, StatusDot } from "@/components/ui";
import type { DataColumn } from "@/components/ui";
import { createArticle } from "../../api/content.api";
import { KINDS, kindLabel } from "../../copy";
import { useArticles } from "../../hooks/use-articles";
import { useContentLang } from "../../hooks/use-content-lang";
import { useContentMe } from "../../hooks/use-content-me";
import type { ArticleRow, ContentKind } from "../../types";

/** Lowercase Latin letters, digits and dashes, from an English title. */
const slugify = (text: string) =>
  text.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-").slice(0, 160);

/** Every article this person can open, one section or all of them. */
export function ArticlesView() {
  const router = useRouter();
  const params = useSearchParams();
  const kindParam = params.get("kind");
  const kind = KINDS.some((k) => k.kind === kindParam) ? (kindParam as ContentKind) : undefined;
  const { lang, c } = useContentLang();
  const me = useContentMe();
  const articles = useArticles(kind);
  const [creating, setCreating] = useState(false);
  const writable = KINDS.filter((k) => me.data?.sections.includes(k.kind) && me.data.role !== "viewer");
  const t = c.list;

  const columns: DataColumn<ArticleRow>[] = [
    {
      key: "title",
      header: t.columns.title,
      cell: (a) => {
        const primary = lang === "ar" ? a.titleAr || a.titleEn : a.titleEn || a.titleAr;
        return (
          <div className="min-w-0">
            <div dir="auto" className="truncate font-medium text-text">{primary || t.untitled}</div>
            <div dir="ltr" className="truncate text-caption text-text-muted">/{a.slug}</div>
          </div>
        );
      },
    },
    { key: "kind", header: t.columns.kind, cell: (a) => kindLabel(a.kind, lang) },
    {
      key: "status",
      header: t.columns.status,
      cell: (a) => <StatusDot tone={a.isPublished ? "success" : "neutral"} label={a.isPublished ? t.published : t.draft} />,
    },
    { key: "date", header: t.columns.date, cell: (a) => a.publishedOn ?? "—", className: "hidden md:table-cell" },
  ];

  return (
    <div className="flex flex-col gap-space-8">
      <PageHeader
        title={kind ? kindLabel(kind, lang) : t.title}
        description={t.description}
        actions={
          writable.length > 0 ? (
            <Button icon={<Icon name="plus" size={18} />} onClick={() => setCreating(true)}>
              {t.newArticle}
            </Button>
          ) : undefined
        }
      />
      <DataTable
        label={t.label}
        itemLabel={t.itemLabel}
        columns={columns}
        rows={articles.data ?? undefined}
        getRowId={(a) => a.id}
        getRowLabel={(a) => a.titleEn || a.titleAr || a.slug}
        loading={articles.loading}
        error={articles.error}
        onRetry={articles.reload}
        empty={<EmptyState icon="globe" title={t.empty} description="" />}
        onRowClick={(a) => router.push(`/admin/cms/articles/${a.id}`)}
      />
      {creating && (
        <CreateArticleDialog
          kinds={writable.map((k) => k.kind)}
          initialKind={kind && writable.some((k) => k.kind === kind) ? kind : writable[0]?.kind}
          onClose={() => setCreating(false)}
          onCreated={(id) => router.push(`/admin/cms/articles/${id}`)}
        />
      )}
    </div>
  );
}

function CreateArticleDialog({
  kinds,
  initialKind,
  onClose,
  onCreated,
}: {
  kinds: ContentKind[];
  initialKind?: ContentKind;
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const { lang, c } = useContentLang();
  const t = c.create;
  const [kind, setKind] = useState<ContentKind>(initialKind ?? kinds[0]);
  const [titleEn, setTitleEn] = useState("");
  const [titleAr, setTitleAr] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const shownSlug = slugTouched ? slug : slugify(titleEn);

  return (
    <FormDialog
      open
      title={t.title}
      submitLabel={t.submit}
      onClose={onClose}
      onSubmit={async () => {
        if (!titleEn.trim() && !titleAr.trim()) return t.needTitle;
        try {
          const doc = await createArticle(kind, shownSlug || `article-${Date.now()}`, { en: titleEn, ar: titleAr });
          onCreated(doc.id);
        } catch (e: unknown) {
          return e instanceof Error ? e.message : String(e);
        }
      }}
    >
      <SelectField
        label={t.kind}
        value={kind}
        options={kinds.map((k) => ({ value: k, label: kindLabel(k, lang) }))}
        onChange={(value) => setKind(value as ContentKind)}
      />
      <InputField label={t.titleEn} value={titleEn} onChange={(e) => setTitleEn(e.target.value)} dir="ltr" lang="en" />
      <InputField label={t.titleAr} value={titleAr} onChange={(e) => setTitleAr(e.target.value)} dir="rtl" lang="ar" />
      <InputField
        label={t.slug}
        hint={t.slugHint}
        value={shownSlug}
        onChange={(e) => {
          setSlugTouched(true);
          setSlug(slugify(e.target.value));
        }}
        dir="ltr"
      />
    </FormDialog>
  );
}
