"use client";

import { useState } from "react";
import { Badge, Button, DataTable, EmptyState, Icon, PageHeader, Tag, useDialog, useToast } from "@/components/ui";
import type { ActionItem, DataColumn } from "@/components/ui";
import { useRequest } from "@/hooks/useRequest";
import { errorText } from "@/lib/api/errorText";
import { useContentMe } from "@/features/content";
import { deleteHelpCategory, listHelpCategories, reorderHelpCategories, saveHelpCategory } from "../../api/help.api";
import { useHelpCopy } from "../../hooks/use-help-copy";
import type { HelpCategory, HelpCategoryInput } from "../../types";
import { CategoryDialog } from "./category-dialog";
import { categoryError } from "./category-error";

/**
 * Help categories, each followed by its subcategories, in the order visitors
 * see them. Everyone with Help access reads; only content admins change.
 */
export function HelpCategoriesView() {
  const { h, lang } = useHelpCopy();
  const t = h.categories;
  const me = useContentMe();
  const canManage = !!me.data?.canPublish;
  const list = useRequest(listHelpCategories, "help-categories");
  const rows = list.data ?? [];
  const [editing, setEditing] = useState<HelpCategoryInput | null>(null);
  const { confirm } = useDialog();
  const { showToast } = useToast();

  const name = (c: HelpCategory) => (lang === "ar" ? c.titleAr || c.titleEn : c.titleEn || c.titleAr) || t.untitled;
  const other = (c: HelpCategory) => (lang === "ar" ? c.titleEn : c.titleAr);
  const siblings = (c: HelpCategory) => rows.filter((r) => r.parent === c.parent);

  const run = async (work: () => Promise<unknown>, done: string) => {
    try {
      await work();
      showToast(done, "success");
      list.reload();
    } catch (e: unknown) {
      showToast(categoryError(e, h, lang), "danger");
    }
  };

  const move = (c: HelpCategory, step: -1 | 1) => {
    const ids = siblings(c).map((s) => s.id);
    const at = ids.indexOf(c.id);
    [ids[at], ids[at + step]] = [ids[at + step], ids[at]];
    void run(() => reorderHelpCategories(c.parent, ids), t.toast.moved);
  };

  const remove = async (c: HelpCategory) => {
    const ok = await confirm({ title: t.confirmRemove.title(name(c)), body: t.confirmRemove.body, confirmLabel: t.confirmRemove.confirm, tone: "danger" });
    if (ok) void run(() => deleteHelpCategory(c.id), t.toast.removed);
  };

  const columns: DataColumn<HelpCategory>[] = [
    {
      key: "name",
      header: t.columns.name,
      sortable: false,
      cell: (c) => (
        // A subcategory is indented under its parent; the indent carries the hierarchy, the label says it.
        <div className={`flex min-w-0 items-center gap-space-4 ${c.parent ? "ps-space-9" : ""}`}>
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-surface-2 text-text-muted">
            <Icon name={c.icon || (c.parent ? "angle-right" : "layer-group")} size={16} />
          </span>
          <div className="min-w-0">
            <div dir="auto" className="truncate font-medium text-text">{name(c)}</div>
            {other(c) && <div dir="auto" className="truncate text-caption text-text-muted">{other(c)}</div>}
            {/* The indent says it on a wide screen; phone cards lose the indent, so the words show there. */}
            {c.parent && <div className="truncate text-caption text-text-muted md:sr-only">{t.sub.replace("{parent}", name(rows.find((r) => r.id === c.parent) ?? c))}</div>}
          </div>
        </div>
      ),
    },
    {
      key: "slug",
      header: t.columns.slug,
      sortable: false,
      className: "hidden md:table-cell",
      cell: (c) => <bdi dir="auto" className="text-text-muted">{(lang === "ar" ? c.slugAr || c.slugEn : c.slugEn || c.slugAr) ?? "—"}</bdi>,
    },
    { key: "visibility", header: t.columns.visibility, sortable: false, cell: (c) => <Tag tone={c.visibility === "public" ? "neutral" : "indigo"}>{t.visibility[c.visibility]}</Tag> },
    { key: "status", header: t.columns.status, sortable: false, cell: (c) => <Badge tone={c.status === "active" ? "success" : "neutral"} dot>{t.status[c.status]}</Badge> },
    { key: "articles", header: t.columns.articles, sortable: false, className: "hidden md:table-cell", cell: (c) => <span className="text-text-muted">{t.articles(c.articleCount)}</span> },
  ];

  const rowActions = (c: HelpCategory): ActionItem[] => {
    const level = siblings(c);
    const at = level.findIndex((s) => s.id === c.id);
    const blocked = c.articleCount > 0 || rows.some((r) => r.parent === c.id);
    return [
      { label: t.actions.edit, icon: "pen", onSelect: () => setEditing(c) },
      ...(c.parent === null ? [{ label: t.actions.addSub, icon: "plus", onSelect: () => setEditing({ parent: c.id, visibility: c.visibility }) }] : []),
      { label: t.actions.moveUp, icon: "angle-up", disabled: at <= 0, onSelect: () => move(c, -1) },
      { label: t.actions.moveDown, icon: "angle-down", disabled: at === level.length - 1, onSelect: () => move(c, 1) },
      c.status === "active"
        ? { label: t.actions.hide, icon: "eye-slash", onSelect: () => void run(() => saveHelpCategory({ id: c.id, status: "hidden" }), t.toast.hidden) }
        : { label: t.actions.show, icon: "eye", onSelect: () => void run(() => saveHelpCategory({ id: c.id, status: "active" }), t.toast.shown) },
      { label: t.actions.remove, icon: "trash", tone: "danger", disabled: blocked, reason: blocked ? t.actions.removeBlocked : undefined, onSelect: () => void remove(c) },
    ];
  };

  return (
    <div className="flex flex-col gap-space-8">
      <PageHeader
        title={t.title}
        description={t.description}
        actions={canManage && <Button variant="primary" icon={<Icon name="plus" size={18} />} onClick={() => setEditing({})}>{t.add}</Button>}
      />
      <DataTable
        label={t.table.label}
        itemLabel={t.table.item}
        columns={columns}
        rows={list.data ?? undefined}
        getRowId={(c) => String(c.id)}
        getRowLabel={name}
        loading={list.loading}
        error={list.failure ? errorText(list.failure, lang) : null}
        onRetry={list.reload}
        empty={<EmptyState icon="layer-group" title={t.empty.title} description={t.empty.body} />}
        rowActions={canManage ? rowActions : undefined}
        stickyHeader={false}
      />
      {editing && (
        <CategoryDialog
          category={editing}
          all={rows}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            showToast(t.toast.saved, "success");
            list.reload();
          }}
        />
      )}
    </div>
  );
}
