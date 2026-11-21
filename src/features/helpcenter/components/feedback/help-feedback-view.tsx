"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppDate, DataTable, EmptyState, FilterSelectField, PageHeader, useToast } from "@/components/ui";
import type { ActionItem, DataColumn } from "@/components/ui";
import { useRequest } from "@/hooks/useRequest";
import { errorText } from "@/lib/api/errorText";
import { useContentMe } from "@/features/content";
import { listHelpFeedback, resolveHelpFeedback } from "../../api/help.api";
import { useHelpCopy } from "../../hooks/use-help-copy";
import type { HelpFeedbackReason, HelpFeedbackRow } from "../../types";

const REASONS: HelpFeedbackReason[] = ["outdated", "unclear", "missing_steps", "not_solved"];

/**
 * What readers answered under "Was this article helpful?" (C6): newest
 * first, filtered by article, answer, reason, status and language. Each
 * row's ⋯ marks it resolved (or reopens it) and opens the article's editor.
 * Read fresh on every visit, so a new answer shows at once.
 */
export function HelpFeedbackView() {
  const { h, lang } = useHelpCopy();
  const f = h.feedback;
  const router = useRouter();
  const me = useContentMe();
  const canWrite = !!me.data && me.data.role !== "viewer";
  const { showToast } = useToast();
  const [filters, setFilters] = useState({ article: "", helpful: "", reason: "", status: "", locale: "" });
  const key = JSON.stringify(filters);
  const list = useRequest(() => listHelpFeedback(filters), `help-feedback:${key}`);

  const set = (name: keyof typeof filters) => (value: string) => setFilters((x) => ({ ...x, [name]: value }));
  const titleOf = (r: { titleEn: string; titleAr: string }) => (lang === "ar" ? r.titleAr || r.titleEn : r.titleEn || r.titleAr) || f.untitled;

  const toggle = async (r: HelpFeedbackRow) => {
    try {
      await resolveHelpFeedback(r.id, !r.resolvedAt);
      showToast(r.resolvedAt ? f.toast.reopened : f.toast.resolved, "success");
      list.reload();
    } catch (e: unknown) {
      showToast(errorText(e, lang), "danger");
    }
  };

  const columns: DataColumn<HelpFeedbackRow>[] = [
    {
      key: "article",
      header: f.columns.article,
      sortValue: titleOf,
      cell: (r) => (
        <div className="min-w-0">
          <div dir="auto" className="truncate font-medium text-text">{titleOf(r)}</div>
          <div className="truncate text-caption text-text-muted">{f.languages[r.locale]}</div>
        </div>
      ),
    },
    {
      key: "answer",
      header: f.columns.answer,
      sortValue: (r) => (r.helpful ? 1 : 0),
      cell: (r) => (
        <span className="inline-flex items-center gap-space-3 text-text">
          <span aria-hidden="true" className={`size-2 rounded-full ${r.helpful ? "bg-success" : "bg-danger"}`} />
          {r.helpful ? f.helpful : f.notHelpful}
        </span>
      ),
    },
    {
      key: "comment",
      header: f.columns.comment,
      sortable: false,
      mobileWide: true,
      cell: (r) => (
        <div className="min-w-0 max-w-[36rem]">
          {r.reasons.length > 0 && <div className="text-caption text-text-muted">{r.reasons.map((x) => f.reasons[x]).join(" · ")}</div>}
          {r.comment && <p dir="auto" className="whitespace-pre-line text-body text-text">{r.comment}</p>}
        </div>
      ),
    },
    {
      key: "status",
      header: f.columns.status,
      sortValue: (r) => (r.resolvedAt ? 1 : 0),
      className: "hidden md:table-cell",
      cell: (r) => (
        <div className="text-caption text-text-muted">
          {/* "Resolved by Omar Aziz" says both; plain "Resolved" only when the person is gone. */}
          {r.resolvedAt ? (
            <div dir="auto" className="truncate">{r.resolvedBy ? f.resolvedBy(r.resolvedBy) : f.status.resolved}</div>
          ) : (
            <div className="text-text">{f.status.open}</div>
          )}
        </div>
      ),
    },
    {
      key: "when",
      header: f.columns.when,
      sortValue: (r) => r.updatedAt,
      className: "hidden lg:table-cell",
      cell: (r) => <AppDate className="text-caption text-text-muted" value={r.updatedAt} format="relative" locale={lang === "ar" ? "ar-u-nu-latn" : "en-GB"} />,
    },
  ];

  const rowActions = (r: HelpFeedbackRow): ActionItem[] => [
    ...(canWrite
      ? [r.resolvedAt
          ? { label: f.actions.reopen, icon: "undo", onSelect: () => void toggle(r) }
          : { label: f.actions.resolve, icon: "check", onSelect: () => void toggle(r) }]
      : []),
    { label: f.actions.edit, icon: "pen", onSelect: () => router.push(`/admin/cms/help/articles/${r.articleId}`) },
  ];

  const articles = list.data?.articles ?? [];
  const tally = filters.article ? list.data?.summary[filters.article] : undefined;
  const filtered = Object.values(filters).some(Boolean);
  const all = { value: "", label: f.filters.all };

  return (
    <div className="flex flex-col gap-space-8">
      <PageHeader title={f.title} description={tally ? `${f.description} ${f.tally(tally.yes, tally.no)}` : f.description} />
      <div className="mk-field-row flex flex-wrap items-end gap-ctl-row">
        <FilterSelectField label={f.filters.article} value={filters.article} onChange={set("article")} options={[all, ...articles.map((x) => ({ value: x.id, label: titleOf(x) }))]} />
        <FilterSelectField label={f.filters.answer} value={filters.helpful} onChange={set("helpful")} options={[all, { value: "yes", label: f.helpful }, { value: "no", label: f.notHelpful }]} />
        <FilterSelectField label={f.filters.reason} value={filters.reason} onChange={set("reason")} options={[all, ...REASONS.map((x) => ({ value: x, label: f.reasons[x] }))]} />
        <FilterSelectField label={f.filters.status} value={filters.status} onChange={set("status")} options={[all, { value: "open", label: f.status.open }, { value: "resolved", label: f.status.resolved }]} />
        <FilterSelectField label={f.filters.language} value={filters.locale} onChange={set("locale")} options={[all, { value: "en", label: f.languages.en }, { value: "ar", label: f.languages.ar }]} />
      </div>
      <DataTable
        label={f.table.label}
        itemLabel={f.table.item}
        columns={columns}
        rows={list.data?.results ?? undefined}
        getRowId={(r) => String(r.id)}
        getRowLabel={titleOf}
        loading={list.loading}
        error={list.failure ? errorText(list.failure, lang) : null}
        onRetry={list.reload}
        rowActions={rowActions}
        empty={filtered ? <EmptyState icon="search" title={f.noMatch.title} description={f.noMatch.body} /> : <EmptyState icon="inbox" title={f.empty.title} description={f.empty.body} />}
        stickyHeader={false}
      />
    </div>
  );
}
