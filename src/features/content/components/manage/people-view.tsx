"use client";

import { useState } from "react";
import { Button, CheckboxGroup, DataTable, EmptyState, FormDialog, Icon, InputField, PageHeader, SelectField, Tag, TextareaField } from "@/components/ui";
import type { DataColumn } from "@/components/ui";
import { useSession } from "@/contexts/AppContext";
import { useRequest } from "@/hooks/useRequest";
import { grantAccess, listPeople, revokeAccess, updateAccess, type Person } from "../../api/content.api";
import { KINDS, kindLabel } from "../../copy";
import { useContentLang } from "../../hooks/use-content-lang";
import { useRemove } from "../../hooks/use-remove";
import type { ContentKind } from "../../types";

/** Who can work on website content, and on which sections. Content admins only. */
export function PeopleView() {
  const { lang, c } = useContentLang();
  const t = c.people;
  const session = useSession();
  const people = useRequest(listPeople, "content-people");
  const remove = useRemove();
  const [editing, setEditing] = useState<Partial<Person> | null>(null);
  const isMe = (p: Person) => p.userId === session?.accountId;
  const columns: DataColumn<Person>[] = [
    {
      key: "person",
      header: t.title,
      cell: (p) => (
        <div className="min-w-0">
          <div dir="auto" className="truncate font-medium">
            {p.name || p.email}
            {isMe(p) && <span className="ms-space-3 text-caption text-text-muted">({t.you})</span>}
          </div>
          <div dir="ltr" className="truncate text-caption text-text-muted">{p.email}</div>
        </div>
      ),
    },
    { key: "role", header: t.role, cell: (p) => <Tag tone={p.role === "admin" ? "primary" : "neutral"}>{t.roles[p.role]}</Tag> },
    { key: "sections", header: t.sections, cell: (p) => (p.role === "admin" ? "—" : p.sections.map((k) => kindLabel(k, lang)).join(lang === "ar" ? "، " : ", ") || "—") },
  ];
  return (
    <div className="flex flex-col gap-space-8">
      <PageHeader title={t.title} description={t.description} actions={<Button icon={<Icon name="user-plus" size={18} />} onClick={() => setEditing({ role: "editor", sections: [] })}>{t.add}</Button>} />
      <DataTable
        label={t.title}
        columns={columns}
        rows={people.data ?? undefined}
        getRowId={(p) => String(p.id)}
        getRowLabel={(p) => p.name || p.email}
        loading={people.loading}
        error={people.error}
        onRetry={people.reload}
        empty={<EmptyState icon="users" title={t.empty} description="" />}
        rowActions={(p) =>
          isMe(p)
            ? []
            : [
                { label: c.common.edit, icon: "pen", onSelect: () => setEditing(p) },
                { label: t.revoke, icon: "user-slash", tone: "danger", onSelect: () => void remove(() => revokeAccess(p.id), people.reload, t.revokeConfirm) },
              ]
        }
      />
      {editing && (
        <PersonDialog
          person={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            people.reload();
          }}
        />
      )}
    </div>
  );
}

function PersonDialog({ person, onClose, onSaved }: { person: Partial<Person>; onClose: () => void; onSaved: () => void }) {
  const { lang, c } = useContentLang();
  const t = c.people;
  const [email, setEmail] = useState(person.email ?? "");
  const [role, setRole] = useState<Person["role"]>(person.role ?? "editor");
  const [sections, setSections] = useState<ContentKind[]>(person.sections ?? []);
  const [notes, setNotes] = useState(person.notes ?? "");
  return (
    <FormDialog
      open
      title={person.id ? c.common.edit : t.add}
      submitLabel={c.common.save}
      onClose={onClose}
      onSubmit={async () => {
        try {
          if (person.id) await updateAccess(person.id, { role, sections, notes });
          else await grantAccess({ email, role, sections, notes });
          onSaved();
        } catch (e: unknown) {
          return e instanceof Error ? e.message : String(e);
        }
      }}
    >
      {!person.id && <InputField label={t.email} type="email" value={email} dir="ltr" required onChange={(e) => setEmail(e.target.value)} />}
      <SelectField
        label={t.role}
        hint={t.roleHelp[role]}
        value={role}
        options={(["admin", "editor", "viewer"] as const).map((r) => ({ value: r, label: t.roles[r] }))}
        onChange={(v) => setRole(v as Person["role"])}
      />
      {role !== "admin" && (
        <CheckboxGroup
          label={t.sections}
          options={KINDS.map((k) => ({ value: k.kind, label: kindLabel(k.kind, lang) }))}
          value={sections}
          onChange={(v) => setSections(v as ContentKind[])}
        />
      )}
      <TextareaField label={t.notes} hint={t.notesHint} value={notes} rows={2} maxLength={1000} onChange={(e) => setNotes(e.target.value)} />
    </FormDialog>
  );
}
