"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppDate, Button, DataTable, EmptyState, FilterSelectField, Icon, PageHeader, SearchField, useDialog, useToast } from "@/components/ui";
import type { ActionItem, DataColumn } from "@/components/ui";
import { useRequest } from "@/hooks/useRequest";
import { errorText } from "@/lib/api/errorText";
import { useContentMe } from "@/features/content";
import { archiveHelpArticle, deleteHelpArticle, duplicateHelpArticle, listHelpArticles, listHelpCategories, unarchiveHelpArticle } from "../../api/help.api";
import { useHelpCopy } from "../../hooks/use-help-copy";
import type { HelpArticleRow, HelpArticleType } from "../../types";
import { NewArticleDialog } from "./new-article-dialog";
import { StatusDots } from "./status-dots";

const TYPES: HelpArticleType[] = ["guide", "tutorial", "faq", "troubleshooting"];

/** Every Help article; a row opens its editor, the ⋯ menu holds the rest. */
export function HelpArticlesView() {
  const { h, lang } = useHelpCopy();
  const a = h.articles;
  const router = useRouter();
  const me = useContentMe();
  const canWrite = !!me.data && me.data.role !== "viewer";
  const canManage = !!me.data?.canPublish;
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState("");
  const list = useRequest(() => listHelpArticles({ q, category, type }), `help-articles:${q}:${category}:${type}`);
  const cats = useRequest(listHelpCategories, "help-categories");
  const [creating, setCreating] = useState(false);
  const { confirm } = useDialog();
  const { showToast } = useToast();

  const title = (r: HelpArticleRow) => (lang === "ar" ? r.titleAr || r.titleEn : r.titleEn || r.titleAr) || a.untitled;
  const categoryName = (r: HelpArticleRow) => (lang === "ar" ? r.categoryAr || r.categoryEn : r.categoryEn || r.categoryAr) || a.uncategorised;
  const open = (r: HelpArticleRow) => router.push(`/admin/cms/help/articles/${r.id}`);

  const run = async (work: () => Promise<unknown>, done: string) => {
    try {
      await work();
      showToast(done, "success");
      list.reload();
    } catch (e: unknown) {
      showToast(errorText(e, lang), "danger");
    }
  };

  const columns: DataColumn<HelpArticleRow>[] = [
    {
      key: "title",
      header: a.columns.title,
      sortValue: title,
      cell: (r) => (
        <div className="min-w-0">
          <div dir="auto" className="truncate font-medium text-text">{title(r)}</div>
          <div dir="auto" className="truncate text-caption text-text-muted">{categoryName(r)}</div>
        </div>
      ),
    },
    { key: "type", header: a.columns.type, sortValue: (r) => a.types[r.type], cell: (r) => <span className="text-text-muted">{a.types[r.type]}</span>, className: "hidden md:table-cell" },
    { key: "languages", header: a.columns.languages, sortable: false, mobileWide: true, cell: (r) => <StatusDots status={r.status} /> },
    {
      key: "updated",
      header: a.columns.updated,
      sortValue: (r) => r.updatedAt,
      className: "hidden lg:table-cell",
      cell: (r) => (
        <div className="text-caption text-text-muted">
          <AppDate value={r.updatedAt} format="relative" locale={lang === "ar" ? "ar-u-nu-latn" : "en-GB"} />
          {r.updatedBy && <div dir="auto" className="truncate">{r.updatedBy}</div>}
        </div>
      ),
    },
  ];

  const rowActions = (r: HelpArticleRow): ActionItem[] => {
    const archived = r.status.en === "archived" || r.status.ar === "archived";
    return [
      { label: a.actions.open, icon: "pen", onSelect: () => open(r) },
      ...(canWrite ? [{ label: a.actions.duplicate, icon: "copy", onSelect: () => void run(() => duplicateHelpArticle(r.id), a.toast.duplicated) }] : []),
      ...(canManage
        ? [
            archived
              ? { label: a.actions.unarchive, icon: "undo", onSelect: () => void run(() => unarchiveHelpArticle(r.id), a.toast.unarchived) }
              : {
                  label: a.actions.archive,
                  icon: "inbox",
                  onSelect: async () => {
                    if (await confirm({ title: a.confirmArchive.title(title(r)), body: a.confirmArchive.body, confirmLabel: a.confirmArchive.confirm }))
                      void run(() => archiveHelpArticle(r.id), a.toast.archived);
                  },
                },
            {
              label: a.actions.remove,
              icon: "trash",
              tone: "danger" as const,
              onSelect: async () => {
                if (await confirm({ title: a.confirmRemove.title(title(r)), body: a.confirmRemove.body, confirmLabel: a.confirmRemove.confirm, tone: "danger" }))
                  void run(() => deleteHelpArticle(r.id), a.toast.removed);
              },
            },
          ]
        : []),
    ];
  };

  const filtered = !!(q || category || type);
  const catOptions = (cats.data ?? []).map((c) => ({
    value: String(c.id),
    label: `${c.parent ? "— " : ""}${(lang === "ar" ? c.titleAr || c.titleEn : c.titleEn || c.titleAr) || a.untitled}`,
  }));

  return (
    <div className="flex flex-col gap-space-8">
      <PageHeader
        title={a.title}
        description={a.description}
        actions={canWrite && <Button variant="primary" icon={<Icon name="plus" size={18} />} onClick={() => setCreating(true)}>{a.add}</Button>}
      />
      <div className="mk-field-row flex flex-wrap items-end gap-ctl-row">
        <div className="min-w-0 flex-1"><SearchField fullWidth label={a.search} value={q} onChange={(e) => setQ(e.target.value)} placeholder={a.search} /></div>
        <FilterSelectField label={a.filters.category} value={category} onChange={setCategory} options={[{ value: "", label: a.filters.all }, ...catOptions]} />
        <FilterSelectField label={a.filters.type} value={type} onChange={setType} options={[{ value: "", label: a.filters.all }, ...TYPES.map((x) => ({ value: x, label: a.types[x] }))]} />
      </div>
      <DataTable
        label={a.table.label}
        itemLabel={a.table.item}
        columns={columns}
        rows={list.data ?? undefined}
        getRowId={(r) => r.id}
        getRowLabel={title}
        loading={list.loading}
        error={list.failure ? errorText(list.failure, lang) : null}
        onRetry={list.reload}
        onRowClick={open}
        rowActions={rowActions}
        empty={filtered ? <EmptyState icon="search" title={a.noMatch.title} description={a.noMatch.body} /> : <EmptyState icon="file-alt" title={a.empty.title} description={a.empty.body} />}
        stickyHeader={false}
      />
      {creating && <NewArticleDialog onClose={() => setCreating(false)} />}
    </div>
  );
}
