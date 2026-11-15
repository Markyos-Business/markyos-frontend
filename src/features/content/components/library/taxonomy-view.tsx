"use client";

import { useState } from "react";
import { Button, DataTable, EmptyState, FormDialog, Icon, InputField, PageHeader, TabPanel, Tabs, useTabIds } from "@/components/ui";
import type { ActionItem, DataColumn } from "@/components/ui";
import { useRequest } from "@/hooks/useRequest";
import { useUrlTab } from "@/hooks/useUrlTab";
import { deleteAuthor, deleteLabel, listAuthors, listCategories, listTags, saveAuthor, saveLabel } from "../../api/content.api";
import { useContentLang } from "../../hooks/use-content-lang";
import { useContentMe } from "../../hooks/use-content-me";
import { useRemove } from "../../hooks/use-remove";
import type { Author, Category } from "../../types";

const TABS = ["authors", "categories", "tags"] as const;
type TabKey = (typeof TABS)[number];

/** Authors, categories and tags: one address per tab. */
export function TaxonomyView() {
  const { c } = useContentLang();
  const t = c.taxonomy;
  const ids = useTabIds();
  const [tab, setTab] = useUrlTab(TABS, "authors");
  return (
    <div className="flex flex-col gap-space-8">
      <PageHeader title={t.title} description={t.description} />
      <Tabs {...ids} label={t.title} tabs={TABS.map((key) => ({ key, label: t.tabs[key] }))} active={tab} onChange={(key) => setTab(key as TabKey)} />
      <TabPanel key={tab} id={ids.panelId} tabsId={ids.id} active={tab}>
        {tab === "authors" ? <AuthorsTable /> : <LabelsTable kind={tab} />}
      </TabPanel>
    </div>
  );
}

function AuthorsTable() {
  const { lang, c } = useContentLang();
  const t = c.taxonomy;
  const me = useContentMe();
  const authors = useRequest(listAuthors, "content-authors");
  const remove = useRemove();
  const [editing, setEditing] = useState<Partial<Author> | null>(null);
  const canEdit = !!me.data?.canContribute;
  const columns: DataColumn<Author>[] = [
    { key: "name", header: t.name, cell: (a) => <span dir="auto" className="font-medium">{a.name}</span> },
    { key: "role", header: lang === "ar" ? t.roleAr : t.roleEn, cell: (a) => <span dir="auto">{(lang === "ar" ? a.roleAr : a.roleEn) || "—"}</span> },
  ];
  const actions = (a: Author): ActionItem[] => [
    ...(canEdit ? [{ label: c.common.edit, icon: "pen", onSelect: () => setEditing(a) }] : []),
    ...(me.data?.canPublish ? [{ label: c.common.remove, icon: "trash", tone: "danger" as const, onSelect: () => void remove(() => deleteAuthor(a.id), authors.reload) }] : []),
  ];
  return (
    <div className="flex flex-col gap-space-6">
      {canEdit && (
        <div>
          <Button icon={<Icon name="plus" size={18} />} onClick={() => setEditing({})}>{t.addAuthor}</Button>
        </div>
      )}
      <DataTable
        label={t.tabs.authors}
        columns={columns}
        rows={authors.data ?? undefined}
        getRowId={(a) => String(a.id)}
        getRowLabel={(a) => a.name}
        loading={authors.loading}
        error={authors.error}
        onRetry={authors.reload}
        empty={<EmptyState icon="users" title={t.empty} description="" />}
        rowActions={canEdit || me.data?.canPublish ? actions : undefined}
      />
      {editing && (
        <AuthorDialog
          author={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            authors.reload();
          }}
        />
      )}
    </div>
  );
}

function AuthorDialog({ author, onClose, onSaved }: { author: Partial<Author>; onClose: () => void; onSaved: () => void }) {
  const { c } = useContentLang();
  const t = c.taxonomy;
  const [name, setName] = useState(author.name ?? "");
  const [roleEn, setRoleEn] = useState(author.roleEn ?? "");
  const [roleAr, setRoleAr] = useState(author.roleAr ?? "");
  return (
    <FormDialog
      open
      title={author.id ? c.common.edit : t.addAuthor}
      submitLabel={c.common.save}
      onClose={onClose}
      onSubmit={async () => {
        try {
          await saveAuthor({ id: author.id, name, roleEn, roleAr, bioEn: author.bioEn ?? "", bioAr: author.bioAr ?? "", avatarId: author.avatarId ?? null });
          onSaved();
        } catch (e: unknown) {
          return e instanceof Error ? e.message : String(e);
        }
      }}
    >
      <InputField label={t.name} value={name} required maxLength={120} dir="auto" onChange={(e) => setName(e.target.value)} />
      <InputField label={t.roleEn} value={roleEn} dir="ltr" maxLength={120} onChange={(e) => setRoleEn(e.target.value)} />
      <InputField label={t.roleAr} value={roleAr} dir="rtl" maxLength={120} onChange={(e) => setRoleAr(e.target.value)} />
    </FormDialog>
  );
}

function LabelsTable({ kind }: { kind: "categories" | "tags" }) {
  const { lang, c } = useContentLang();
  const t = c.taxonomy;
  const me = useContentMe();
  const items = useRequest(kind === "categories" ? listCategories : listTags, `content-${kind}`);
  const remove = useRemove();
  const [editing, setEditing] = useState<Partial<Category> | null>(null);
  // Grouping is a taxonomy decision, not a writing one: admins only.
  const canEdit = !!me.data?.canPublish;
  const columns: DataColumn<Category>[] = [
    { key: "label", header: lang === "ar" ? t.labelAr : t.labelEn, cell: (x) => <span dir="auto" className="font-medium">{lang === "ar" ? x.labelAr : x.labelEn}</span> },
    { key: "slug", header: t.slug, cell: (x) => <span dir="ltr" className="text-text-muted">{x.slug}</span> },
  ];
  return (
    <div className="flex flex-col gap-space-6">
      {canEdit && (
        <div>
          <Button icon={<Icon name="plus" size={18} />} onClick={() => setEditing({})}>{kind === "categories" ? t.addCategory : t.addTag}</Button>
        </div>
      )}
      <DataTable
        label={t.tabs[kind]}
        columns={columns}
        rows={items.data ?? undefined}
        getRowId={(x) => String(x.id)}
        getRowLabel={(x) => x.labelEn}
        loading={items.loading}
        error={items.error}
        onRetry={items.reload}
        empty={<EmptyState icon="layer-group" title={t.empty} description="" />}
        rowActions={
          canEdit
            ? (x) => [
                { label: c.common.edit, icon: "pen", onSelect: () => setEditing(x) },
                { label: c.common.remove, icon: "trash", tone: "danger", onSelect: () => void remove(() => deleteLabel(kind, x.id), items.reload) },
              ]
            : undefined
        }
      />
      {editing && (
        <LabelDialog
          kind={kind}
          item={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            items.reload();
          }}
        />
      )}
    </div>
  );
}

function LabelDialog({ kind, item, onClose, onSaved }: { kind: "categories" | "tags"; item: Partial<Category>; onClose: () => void; onSaved: () => void }) {
  const { c } = useContentLang();
  const t = c.taxonomy;
  const [labelEn, setLabelEn] = useState(item.labelEn ?? "");
  const [labelAr, setLabelAr] = useState(item.labelAr ?? "");
  const [slug, setSlug] = useState(item.slug ?? "");
  return (
    <FormDialog
      open
      title={item.id ? c.common.edit : kind === "categories" ? t.addCategory : t.addTag}
      submitLabel={c.common.save}
      onClose={onClose}
      onSubmit={async () => {
        try {
          const key = slug || labelEn.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
          await saveLabel(kind, { id: item.id, slug: key, labelEn, labelAr });
          onSaved();
        } catch (e: unknown) {
          return e instanceof Error ? e.message : String(e);
        }
      }}
    >
      <InputField label={t.labelEn} value={labelEn} required dir="ltr" maxLength={120} onChange={(e) => setLabelEn(e.target.value)} />
      <InputField label={t.labelAr} value={labelAr} required dir="rtl" maxLength={120} onChange={(e) => setLabelAr(e.target.value)} />
      <InputField label={t.slug} value={slug} dir="ltr" maxLength={80} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} />
    </FormDialog>
  );
}
