"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ActionsDropdown, AppDate, Chart, DataTable, DatePicker, EmptyState, PageHeader, SegmentedControl, Skeleton, StatCard, StatGrid } from "@/components/ui";
import type { DataColumn } from "@/components/ui";
import { useRequest } from "@/hooks/useRequest";
import { errorText } from "@/lib/api/errorText";
import { downloadCsv, toCsv } from "@/lib/csv";
import { getHelpAnalytics } from "../../api/help.api";
import { useHelpCopy } from "../../hooks/use-help-copy";
import type { HelpAnalyticsArticle, HelpAnalyticsSearch } from "../../types";

type Preset = "7" | "30" | "90" | "custom";

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return iso(d);
};

/**
 * The Help Center dashboard (C9): views, helpfulness and searches for a
 * period, what readers didn't find, and what needs reviewing. Every number
 * comes from the platform's raw tables (anonymous page views, votes,
 * searches); CSV exports carry the same rows.
 */
export function HelpAnalyticsView() {
  const { h, lang } = useHelpCopy();
  const t = h.analytics;
  const router = useRouter();
  const [preset, setPreset] = useState<Preset>("30");
  const [range, setRange] = useState({ from: daysAgo(29), to: iso(new Date()) });
  const data = useRequest(() => getHelpAnalytics(range.from, range.to), `help-analytics:${range.from}:${range.to}`);
  const d = data.data;
  const title = (r: { titleEn: string; titleAr: string }) => (lang === "ar" ? r.titleAr || r.titleEn : r.titleEn || r.titleAr) || t.untitled;
  const locale = lang === "ar" ? "ar-u-nu-latn" : "en-GB";

  const pick = (value: Preset) => {
    setPreset(value);
    if (value !== "custom") setRange({ from: daysAgo(Number(value) - 1), to: iso(new Date()) });
  };

  const exportCsv = (kind: "articles" | "topics" | "searches" | "zero" | "stale") => {
    if (!d) return;
    const name = `markyos-help-${kind}-${d.from}-to-${d.to}.csv`;
    const searchRows = (rows: HelpAnalyticsSearch[]) => [["Search", "Language", "Searches", "Clicks", "Click-through %"], ...rows.map((r) => [r.term, r.locale, r.searches, r.clicks, r.ctr])];
    const table = {
      articles: [["Article (English)", "Article (Arabic)", "Views", "Helpful", "Not helpful", "Helpful %"], ...d.articles.map((a) => [a.titleEn, a.titleAr, a.views, a.helpful, a.notHelpful, a.helpfulPct])],
      topics: [["Topic (English)", "Topic (Arabic)", "Article views", "Topic page views", "Helpful %"], ...d.topics.map((x) => [x.titleEn, x.titleAr, x.articleViews, x.topicPageViews, x.helpfulPct])],
      searches: searchRows(d.topSearches),
      zero: searchRows(d.zeroResults),
      stale: [["Article (English)", "Article (Arabic)", "Last reviewed", "Counted from"], ...d.stale.map((s) => [s.titleEn, s.titleAr, s.lastReviewed, s.since])],
    }[kind];
    downloadCsv(name, toCsv(table));
  };

  const articleColumns: DataColumn<HelpAnalyticsArticle>[] = [
    { key: "article", header: t.allColumns.article, sortValue: title, cell: (r) => <span dir="auto" className="truncate font-medium text-text">{title(r)}</span> },
    { key: "views", header: t.allColumns.views, sortValue: (r) => r.views, cell: (r) => r.views.toLocaleString(locale) },
    { key: "helpful", header: t.allColumns.helpful, sortValue: (r) => r.helpful, className: "hidden md:table-cell", cell: (r) => r.helpful },
    { key: "notHelpful", header: t.allColumns.notHelpful, sortValue: (r) => r.notHelpful, className: "hidden md:table-cell", cell: (r) => r.notHelpful },
    { key: "pct", header: t.allColumns.pct, sortValue: (r) => r.helpfulPct ?? -1, cell: (r) => t.pct(r.helpfulPct) },
  ];

  return (
    <div className="flex flex-col gap-space-8">
      <PageHeader
        title={t.title}
        description={t.description}
        actions={
          d && (
            <ActionsDropdown
              label={t.export.label}
              align="end"
              items={(["articles", "topics", "searches", "zero", "stale"] as const).map((kind) => ({ label: t.export[kind], icon: "download", onSelect: () => exportCsv(kind) }))}
            />
          )
        }
      />

      <div className="mk-field-row flex flex-wrap items-end gap-ctl-row">
        <SegmentedControl<Preset>
          label={t.period.label}
          value={preset}
          onChange={pick}
          options={[
            { value: "7", label: t.period.d7 },
            { value: "30", label: t.period.d30 },
            { value: "90", label: t.period.d90 },
            { value: "custom", label: t.period.custom },
          ]}
        />
        {preset === "custom" && (
          <>
            <DatePicker label={t.period.from} value={range.from} max={range.to} onChange={(v) => v && setRange((r) => ({ ...r, from: v }))} />
            <DatePicker label={t.period.to} value={range.to} min={range.from} max={iso(new Date())} onChange={(v) => v && setRange((r) => ({ ...r, to: v }))} />
          </>
        )}
      </div>

      {data.loading && !d && <Skeleton className="h-64 rounded-card" />}
      {!!data.failure && <EmptyState icon="exclamation-circle" title={errorText(data.failure, lang)} description="" />}

      {d && (
        <>
          <StatGrid>
            <StatCard label={t.stats.views} value={d.totals.articleViews.toLocaleString(locale)} footnote={t.period.shown(d.from, d.to)} />
            <StatCard label={t.stats.helpful} value={t.pct(d.totals.helpfulPct)} footnote={t.stats.votes(d.totals.votes)} />
            <StatCard label={t.stats.searches} value={d.totals.searches.toLocaleString(locale)} footnote={t.stats.zero(d.totals.zeroResultSearches)} />
            <StatCard label={t.stats.ctr} value={t.pct(d.totals.clickThroughPct)} footnote={t.stats.ctrHint} />
          </StatGrid>

          <Panel title={t.chart.title}>
            <Chart label={t.chart.title} kind="line" data={d.daily.map((x) => ({ label: x.date.slice(5), values: [x.views, x.searches] }))} series={[t.chart.views, t.chart.searches]} />
          </Panel>

          <div className="grid gap-space-8 lg:grid-cols-2">
            <Panel title={t.mostViewed}>
              <Ranked none={t.none} rows={d.mostViewed.map((a) => ({ key: a.id, href: articleHref(a.id), name: title(a), value: a.views.toLocaleString(locale) }))} />
            </Panel>
            <Panel title={t.leastHelpful} hint={t.leastHelpfulHint(d.leastHelpfulMinVotes)}>
              <Ranked none={t.none} rows={d.leastHelpful.map((a) => ({ key: a.id, href: articleHref(a.id), name: title(a), value: `${t.pct(a.helpfulPct)} · ${a.helpful + a.notHelpful}` }))} />
            </Panel>
            <Panel title={t.topSearches}>
              <Ranked none={t.none} rows={d.topSearches.map((s) => ({ key: `${s.locale}:${s.term}`, name: s.term, tag: t.language[s.locale], value: `${s.searches} · ${t.pct(s.ctr)}` }))} />
            </Panel>
            <Panel title={t.zeroResults} hint={t.zeroHint}>
              <Ranked none={t.none} rows={d.zeroResults.map((s) => ({ key: `${s.locale}:${s.term}`, name: s.term, tag: t.language[s.locale], value: String(s.searches) }))} />
            </Panel>
            <Panel title={t.topics}>
              <Ranked
                none={t.none}
                rows={d.topics.map((x) => ({ key: String(x.id), name: title(x), value: `${x.articleViews.toLocaleString(locale)} · ${x.topicPageViews.toLocaleString(locale)} · ${t.pct(x.helpfulPct)}` }))}
                legend={`${t.topicColumns.articleViews} · ${t.topicColumns.topicViews} · ${t.topicColumns.helpful}`}
              />
            </Panel>
            <Panel title={t.reasons}>
              <Ranked none={t.none} rows={d.reasons.map((r) => ({ key: r.reason, name: h.feedback.reasons[r.reason], value: String(r.count) }))} />
            </Panel>
          </div>

          <Panel title={t.stale} hint={t.staleHint}>
            <Ranked
              none={t.none}
              rows={d.stale.map((s) => ({
                key: s.id,
                href: articleHref(s.id),
                name: title(s),
                value: s.lastReviewed ? <AppDate value={s.lastReviewed} locale={locale} /> : t.staleColumns.never,
              }))}
            />
          </Panel>

          <section className="flex flex-col gap-space-5">
            <h2 className="text-h5 font-medium">{t.all}</h2>
            <DataTable
              label={t.all}
              itemLabel={t.all}
              columns={articleColumns}
              rows={d.articles}
              getRowId={(r) => r.id}
              getRowLabel={title}
              onRowClick={(r) => router.push(articleHref(r.id))}
              empty={<EmptyState icon="chart-line" title={t.none} description="" />}
              stickyHeader={false}
            />
          </section>
        </>
      )}
    </div>
  );
}

const articleHref = (id: string) => `/admin/cms/help/articles/${id}`;

function Panel({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="mk-surface rounded-card bg-surface-1 p-space-8">
      <h2 className="text-h5 font-medium">{title}</h2>
      {hint && <p className="mt-space-2 text-caption text-text-muted">{hint}</p>}
      <div className="mt-space-6">{children}</div>
    </section>
  );
}

function Ranked({
  rows,
  none,
  legend,
}: {
  rows: { key: string; name: string; value: React.ReactNode; href?: string; tag?: string }[];
  none: string;
  legend?: string;
}) {
  if (rows.length === 0) return <p className="text-body text-text-muted">{none}</p>;
  return (
    <>
      {legend && <p className="mb-space-4 text-caption text-text-muted">{legend}</p>}
      <ol className="flex flex-col gap-space-4">
        {rows.map((r) => (
          <li key={r.key} className="flex items-center justify-between gap-space-6 text-body">
            <span className="flex min-w-0 items-center gap-space-3">
              {r.tag && <span className="shrink-0 rounded-md bg-ink-soft px-space-2 text-caption text-text-muted">{r.tag}</span>}
              {r.href ? (
                <Link dir="auto" href={r.href} className="truncate text-text hover:underline">
                  {r.name}
                </Link>
              ) : (
                <span dir="auto" className="truncate text-text">{r.name}</span>
              )}
            </span>
            <span className="shrink-0 font-medium tabular-nums">{r.value}</span>
          </li>
        ))}
      </ol>
    </>
  );
}
