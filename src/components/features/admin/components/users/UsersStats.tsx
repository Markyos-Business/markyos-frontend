"use client";

import { StatCard, StatGrid } from "@/components/ui";
import { useAdminLang } from "../../hooks/useAdminLang";
import type { AdminStats } from "../../types";
import { trendOf } from "../../utils/trend";

type UsersStatsProps = { stats: AdminStats | null; loading: boolean };

const KEYS = ["total", "active", "pending", "deactivated"] as const;

/** Four counts, each against a month ago. */
export function UsersStats({ stats, loading }: UsersStatsProps) {
  const { c } = useAdminLang();
  return (
    <StatGrid>
      {KEYS.map((key) => {
        const now = stats?.users.now[key] ?? 0;
        const trend = trendOf(now, stats?.users.monthAgo[key] ?? 0);
        return (
          <StatCard
            key={key}
            label={c.stats[key]}
            value={now.toLocaleString("en-US")}
            footnote={c.stats.vsLastMonth}
            trend={{ ...trend, label: c.stats.trend(trend.direction, trend.value) }}
            loading={loading && !stats}
          />
        );
      })}
    </StatGrid>
  );
}
