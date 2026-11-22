"use client";

import { Chart, EmptyState, PageHeader, Skeleton, StatCard, StatGrid } from "@/components/ui";
import { useRequest } from "@/hooks/useRequest";
import { getTraffic } from "../../api/content.api";
import { useContentLang } from "../../hooks/use-content-lang";

const DAYS = 30;

/** Anonymous page views on the website, for the last 30 days. */
export function TrafficView() {
  const { c } = useContentLang();
  const t = c.traffic;
  const traffic = useRequest(() => getTraffic(DAYS), "content-traffic");
  const data = traffic.data;
  return (
    <div className="flex flex-col gap-space-8">
      <PageHeader title={t.title} description={t.description} />
      {traffic.loading && <Skeleton className="h-64 rounded-card" />}
      {traffic.error && <EmptyState icon="exclamation-circle" title={traffic.error} description="" />}
      {data && data.views === 0 && <EmptyState icon="chart-line" title={t.empty} description="" />}
      {data && data.views > 0 && (
        <>
          <StatGrid>
            <StatCard label={t.views} value={data.views.toLocaleString()} footnote={t.range(data.days)} />
            <StatCard label={t.visitors} value={data.visitors.toLocaleString()} footnote={t.range(data.days)} />
          </StatGrid>
          <section className="mk-surface rounded-card bg-surface-1 p-space-8">
            <h2 className="mb-space-6 text-h5 font-medium">{t.perDay}</h2>
            <Chart label={t.perDay} data={data.byDay.map((d) => ({ label: d.date.slice(5), values: [d.views] }))} series={[t.views]} />
          </section>
          <div className="grid gap-space-8 md:grid-cols-3">
            <Ranked title={t.topPages} rows={data.topPages.map((p) => [p.path, p.views])} />
            <Ranked title={t.referrers} rows={data.referrers.map((r) => [r.host, r.views])} />
            <Ranked title={t.devices} rows={Object.entries(data.devices)} />
          </div>
        </>
      )}
    </div>
  );
}

function Ranked({ title, rows }: { title: string; rows: [string, number][] }) {
  return (
    <section className="mk-surface rounded-card bg-surface-1 p-space-8">
      <h2 className="mb-space-5 text-h5 font-medium">{title}</h2>
      {rows.length === 0 && <p className="text-body text-text-muted">—</p>}
      <ol className="flex flex-col gap-space-3">
        {rows.map(([name, n]) => (
          <li key={name} className="flex items-center justify-between gap-space-4 text-body">
            <span dir="ltr" className="truncate text-text">{name}</span>
            <span className="font-medium">{n.toLocaleString()}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
