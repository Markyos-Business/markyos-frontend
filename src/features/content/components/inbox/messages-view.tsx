"use client";

import { useRouter } from "next/navigation";
import { Button, DataTable, EmptyState, FilterBar, FilterSelectField, Icon, PageHeader, SearchField, formatDayMonth } from "@/components/ui";
import type { ActionItem, DataColumn } from "@/components/ui";
import { errorText } from "@/lib/api/errorText";
import { deleteMessage, exportMessages, listMessages } from "../../api/content.api";
import { useContentLang } from "../../hooks/use-content-lang";
import { useInboxList } from "../../hooks/use-inbox-list";
import { useRemove } from "../../hooks/use-remove";
import type { ContactMessage, MessageTopic } from "../../types";
import { DeliveryTag } from "./delivery-tag";
import { replyHref } from "./message-mail";

export const MESSAGES_HOME = "/admin/cms/messages";
const TOPICS: MessageTopic[] = ["sales", "support", "studios", "press", "security", "feature", "other"];

/**
 * What people sent through the website's contact form (LR-13), newest first,
 * with whether the team was emailed about each one. Clicking a row opens the
 * whole message. Content admins only, like the rest of the inbox.
 */
export function MessagesView() {
  const router = useRouter();
  const { c, lang } = useContentLang();
  const t = c.messages;
  const remove = useRemove();
  const inbox = useInboxList<ContactMessage>({ key: "content-messages", list: listMessages, exportCsv: exportMessages, fileName: "markyos-messages" });

  const columns: DataColumn<ContactMessage>[] = [
    {
      key: "name",
      header: t.columns.name,
      cell: (m) => (
        <div className="min-w-0">
          <div dir="auto" className="truncate font-medium text-text">{m.name || "—"}</div>
          {m.company && <div dir="auto" className="truncate text-caption text-text-muted">{m.company}</div>}
        </div>
      ),
    },
    { key: "email", header: t.columns.email, cell: (m) => <bdi dir="ltr" className="block truncate">{m.email}</bdi>, className: "hidden md:table-cell" },
    { key: "topic", header: t.columns.topic, cell: (m) => t.topics[m.topic] ?? m.topic },
    { key: "who", header: t.columns.who, cell: (m) => (m.who ? t.who[m.who] ?? <bdi>{m.who}</bdi> : "—"), className: "hidden lg:table-cell" },
    {
      key: "date",
      header: t.columns.date,
      cell: (m) => (
        <time dateTime={m.createdAt} className="text-text-muted">
          {formatDayMonth(new Date(m.createdAt), lang, true)}
        </time>
      ),
    },
    { key: "delivery", header: t.columns.delivery, cell: (m) => <DeliveryTag message={m} /> },
  ];

  const rowActions = (m: ContactMessage): ActionItem[] => [
    { label: t.reply, icon: "envelope", onSelect: () => window.location.assign(replyHref(m)) },
    {
      label: t.delete,
      icon: "trash",
      tone: "danger",
      onSelect: () => void remove(() => deleteMessage(m.id), inbox.afterRemove, t.removeConfirm, { body: t.removeBody, confirmLabel: t.delete, done: t.deleted }),
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
          icon="tag"
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
        getRowId={(m) => String(m.id)}
        getRowLabel={(m) => m.name || m.email}
        loading={inbox.request.loading}
        error={inbox.request.failure ? errorText(inbox.request.failure, lang) : null}
        onRetry={inbox.request.reload}
        onRowClick={(m) => router.push(`${MESSAGES_HOME}/${m.id}`)}
        rowActions={rowActions}
        sortable={false}
        paging={inbox.paging}
        empty={
          inbox.filtered ? (
            <EmptyState icon="search" title={t.noMatch} description={t.noMatchBody} />
          ) : (
            <EmptyState icon="inbox" title={t.empty} description={t.emptyBody} />
          )
        }
      />
    </div>
  );
}
