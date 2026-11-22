"use client";

import { Button, Icon, Skeleton, StatGrid } from "@/components/ui";
import { useAdminLang } from "../../hooks/shared/use-admin-lang";
import type { AdminStats, AdminUserStatus } from "../../types";

type UsersStatsProps = {
  stats: AdminStats | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  status: string;
  filtered: boolean;
  onSelect: (status: AdminUserStatus | "") => void;
};

/** Global account counts; each tile opens a fresh, matching table view. */
export function UsersStats({ stats, loading, error, onRetry, status, filtered, onSelect }: UsersStatsProps) {
  const { c } = useAdminLang();
  const o = c.overview;
  const counts = stats?.users.now;
  const cards = [
    { key: "", label: o.all, value: counts ? counts.total + counts.pending : null, note: o.allHint, icon: "users" },
    { key: "active", label: c.stats.active, value: counts?.active, note: o.activeHint, icon: "user-check" },
    { key: "waiting", label: c.stats.pending, value: counts?.pending, note: o.pendingHint, icon: "clock" },
    { key: "deactivated", label: c.stats.deactivated, value: counts?.deactivated, note: o.deactivatedHint, icon: "user-slash" },
  ] as const;
  return <section aria-label={o.title} aria-busy={loading} className="flex flex-col gap-space-4">
    <div className="flex flex-wrap items-baseline justify-between gap-ctl-row">
      <h2 className="text-body font-medium text-text">{o.title}</h2>
      <p className="text-caption text-text-muted">{o.scope}</p>
    </div>
    {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-ctl-row rounded-lg bg-danger-soft px-space-5 py-space-3 text-caption text-danger">
      <span>{stats ? o.stale : o.failed}</span><Button size="sm" variant="secondary" disabled={loading} onClick={onRetry}>{o.retry}</Button>
    </div>}
    <StatGrid>{cards.map(card => {
      const selected = card.key ? status === card.key : !filtered;
      return <button /* button-audit-ignore: a stat card that filters the user list */ key={card.key} type="button" aria-pressed={selected} disabled={!stats || loading} onClick={() => onSelect(card.key)}
        className={`mk-btn flex min-w-0 flex-col items-stretch gap-space-4 rounded-card border p-space-5 text-start disabled:cursor-wait ${selected ? "border-accent-edge bg-accent-soft" : "border-hairline-strong bg-surface-1"}`}>
        <span className="flex items-center justify-between gap-space-3 text-body text-text-muted"><span>{card.label}</span><Icon name={card.icon} size={18} /></span>
        {loading && !stats ? <Skeleton className="h-8 w-24 rounded-lg" /> : <span className="text-2xl font-medium tabular-nums text-text">{card.value?.toLocaleString("en-US") ?? "—"}</span>}
        <span className="text-caption text-text-muted">{card.note}</span>
      </button>;
    })}</StatGrid>
    {stats && <p className="flex flex-wrap gap-x-space-6 gap-y-space-2 text-caption text-text-muted">
      <span>{o.newUsers}: <strong className="font-medium tabular-nums text-text">{stats.users.new30d.toLocaleString("en-US")}</strong></span>
      <span>{o.recentActivity}: <strong className="font-medium tabular-nums text-text">{stats.users.activeLast30d.toLocaleString("en-US")}</strong></span>
    </p>}
  </section>;
}
