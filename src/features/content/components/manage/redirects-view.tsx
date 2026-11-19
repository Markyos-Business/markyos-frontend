"use client";

import { useState } from "react";
import { Button, DataTable, EmptyState, FormDialog, Icon, InputField, PageHeader, SelectField } from "@/components/ui";
import type { DataColumn } from "@/components/ui";
import { useRequest } from "@/hooks/useRequest";
import { deleteRedirect, listRedirects, saveRedirect, type Redirect } from "../../api/content.api";
import { useContentLang } from "../../hooks/use-content-lang";
import { useRemove } from "../../hooks/use-remove";
import { errorText } from "@/lib/api/errorText";

/** Old website addresses and where they now go. Content admins only. */
export function RedirectsView() {
  const { c, lang } = useContentLang();
  const t = c.redirects;
  const redirects = useRequest(listRedirects, "content-redirects");
  const remove = useRemove();
  const [editing, setEditing] = useState<Partial<Redirect> | null>(null);
  const columns: DataColumn<Redirect>[] = [
    { key: "from", header: t.from, cell: (r) => <span dir="ltr">{r.fromPath}</span> },
    { key: "to", header: t.to, cell: (r) => <span dir="ltr">{r.toPath}</span> },
    { key: "type", header: t.type, cell: (r) => (r.statusCode === 301 ? t.permanent : t.temporary) },
  ];
  return (
    <div className="flex flex-col gap-space-8">
      <PageHeader title={t.title} description={t.description} actions={<Button icon={<Icon name="plus" size={18} />} onClick={() => setEditing({ statusCode: 301 })}>{t.add}</Button>} />
      <DataTable
        label={t.title}
        columns={columns}
        rows={redirects.data ?? undefined}
        getRowId={(r) => String(r.id)}
        getRowLabel={(r) => r.fromPath}
        loading={redirects.loading}
        error={redirects.failure ? errorText(redirects.failure, lang) : null}
        onRetry={redirects.reload}
        empty={<EmptyState icon="external-link-alt" title={t.empty} description="" />}
        rowActions={(r) => [
          { label: c.common.edit, icon: "pen", onSelect: () => setEditing(r) },
          { label: c.common.remove, icon: "trash", tone: "danger", onSelect: () => void remove(() => deleteRedirect(r.id), redirects.reload) },
        ]}
      />
      {editing && (
        <RedirectDialog
          redirect={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            redirects.reload();
          }}
        />
      )}
    </div>
  );
}

function RedirectDialog({ redirect, onClose, onSaved }: { redirect: Partial<Redirect>; onClose: () => void; onSaved: () => void }) {
  const { c, lang } = useContentLang();
  const t = c.redirects;
  const [fromPath, setFrom] = useState(redirect.fromPath ?? "/");
  const [toPath, setTo] = useState(redirect.toPath ?? "/");
  const [statusCode, setCode] = useState<301 | 302>(redirect.statusCode ?? 301);
  return (
    <FormDialog
      open
      title={redirect.id ? c.common.edit : t.add}
      submitLabel={c.common.save}
      onClose={onClose}
      onSubmit={async () => {
        try {
          await saveRedirect({ id: redirect.id, fromPath, toPath, statusCode });
          onSaved();
        } catch (e: unknown) {
          return errorText(e, lang);
        }
      }}
    >
      <InputField label={t.from} value={fromPath} dir="ltr" required onChange={(e) => setFrom(e.target.value)} />
      <InputField label={t.to} value={toPath} dir="ltr" required onChange={(e) => setTo(e.target.value)} />
      <SelectField
        label={t.type}
        value={String(statusCode)}
        options={[{ value: "301", label: t.permanent }, { value: "302", label: t.temporary }]}
        onChange={(v) => setCode(v === "302" ? 302 : 301)}
      />
    </FormDialog>
  );
}
