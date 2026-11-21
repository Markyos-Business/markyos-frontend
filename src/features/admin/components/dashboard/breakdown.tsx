import { Dashboard, DashboardCard } from "@/components/ui";
const { BreakdownTable } = Dashboard;

/** Feature data ordering; presentation is owned by the shared widget table. */
export function Breakdown({ title, empty, counts, labels, order }: {
  title: string;
  empty: string;
  counts: Record<string, number>;
  labels: Record<string, string>;
  order?: string[];
}) {
  const keys = Object.keys(counts).sort((a, b) => {
    const ia = order?.indexOf(a) ?? -1;
    const ib = order?.indexOf(b) ?? -1;
    if (ia !== -1 || ib !== -1) return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    return counts[b] - counts[a];
  });

  return <DashboardCard title={title} as="h2">
    <BreakdownTable
      caption={title}
      rows={keys.map(key => ({ key, label: labels[key] ?? key, value: counts[key].toLocaleString("en-US") }))}
      emptyMessage={empty}
    />
  </DashboardCard>;
}
