"use client";

import { Button, DataTable, EmptyState, FilterBar, FilterSelectField, Icon, PageHeader, SearchField, formatDayMonth, useToast } from "@/components/ui";
import type { ActionItem, DataColumn } from "@/components/ui";
import { errorText } from "@/lib/api/errorText";
import { deleteSignup, exportSignups, listSignups } from "../../api/content.api";
import { useContentLang } from "../../hooks/use-content-lang";
import { useInboxList } from "../../hooks/use-inbox-list";
import { useRemove } from "../../hooks/use-remove";
import type { SignupTopic, WebsiteSignup } from "../../types";

const TOPICS: SignupTopic[] = ["newsletter", "contact", "beta_studio", "beta_company"];

/**
 * Addresses left on markyos.com (LR-13): the newsletter, the contact list
 * and the two betas, newest first, filtered by list and searched by email.
 * Content admins only; the menu shows it to them alone and the server
 * refuses everyone else.
 */
export function SignupsView() {
  const { c, lang } = useContentLang();
  const t = c.signups;
  const { showToast } = useToast();
  const remove = useRemove();
  const inbox = useInboxList<WebsiteSignup>({ key: "content-signups", list: listSignups, exportCsv: exportSignups, fileName: "markyos-signups" });

  const copyEmail = async (s: WebsiteSignup) => {
    try {
      await navigator.clipboard.writeText(s.email);
      showToast(t.copied, "success");
    } catch (e: unknown) {
      showToast(errorText(e, lang), "danger");
    }
  };

  const columns: DataColumn<WebsiteSignup>[] = [
    { key: "email", header: t.columns.email, cell: (s) => <bdi dir="ltr" className="block truncate font-medium text-text">{s.email}</bdi> },
    { key: "topic", header: t.columns.topic, cell: (s) => t.topics[s.topic] ?? s.topic },
    { key: "locale", header: t.columns.locale, cell: (s) => c.inbox.languages[s.locale] ?? s.locale, className: "hidden md:table-cell" },
    { key: "country", header: t.columns.country, cell: (s) => (s.country ? <bdi>{s.country}</bdi> : "—"), className: "hidden md:table-cell" },
    {
      key: "date",
      header: t.columns.date,
      cell: (s) => (
        <time dateTime={s.createdAt} className="text-text-muted">
          {formatDayMonth(new Date(s.createdAt), lang, true)}
        </time>
      ),
    },
  ];

  const rowActions = (s: WebsiteSignup): ActionItem[] => [
    { label: t.copyEmail, icon: "copy", onSelect: () => void copyEmail(s) },
    {
      label: t.delete,
      icon: "trash",
      tone: "danger",
      onSelect: () => void remove(() => deleteSignup(s.id), inbox.afterRemove, t.removeConfirm, { body: t.removeBody, confirmLabel: t.delete, done: t.deleted }),
    },
  ];

  return (
    <div className="flex flex-col gap-space-8">
      <PageHeader
        title={t.title}
        description={t.description}
        actions={
          <Button icon={<Icon name="download" size={18} />} onClick={() => void inbox.download()} loading={inbox.exporting} loadingText={c.inbox.exporting}>
            {c.inbox.export}
          </Button>
        }
      />
      <FilterBar
        active={inbox.filtered}
        filterCount={inbox.values.topic ? 1 : 0}
        onClear={inbox.clearFilters}
        search={
          <SearchField
            key={inbox.searchKey}
            label={t.searchLabel}
            placeholder={t.search}
            defaultValue={inbox.searchSeed}
            dir="auto"
            onDebouncedChange={inbox.setSearch}
          />
        }
      >
        <FilterSelectField
          label={t.columns.topic}
          hideLabel
          icon="list-ul"
          active={!!inbox.values.topic}
          value={inbox.values.topic}
          onChange={inbox.setTopic}
          options={[{ value: "", label: t.allTopics }, ...TOPICS.map((x) => ({ value: x, label: t.topics[x] }))]}
        />
      </FilterBar>
      <DataTable
        label={t.label}
        itemLabel={t.itemLabel}
        columns={columns}
        rows={inbox.rows}
        getRowId={(s) => String(s.id)}
        getRowLabel={(s) => s.email}
        loading={inbox.request.loading}
        error={inbox.request.failure ? errorText(inbox.request.failure, lang) : null}
        onRetry={inbox.request.reload}
        rowActions={rowActions}
        sortable={false}
        paging={inbox.paging}
        empty={
          inbox.filtered ? (
            <EmptyState icon="search" title={t.noMatch} description={t.noMatchBody} />
          ) : (
            <EmptyState icon="envelope" title={t.empty} description={t.emptyBody} />
          )
        }
      />
    </div>
  );
}
