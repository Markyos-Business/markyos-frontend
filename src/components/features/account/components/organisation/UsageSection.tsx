"use client";

import { Section, StatTile } from "@/components/ui";
import type { AccountPageState } from "../../hooks/useAccountPage";

/** What the account's brands hold, in numbers, and how full each brand is. */
export function UsageSection({ stats, richness }: AccountPageState["usage"]) {
  return (
    <Section title="Usage analytics" icon="chart-line">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-4">
        <StatTile value={stats.workspaces} label="Workspaces" />
        <StatTile value={stats.shared} label="Shared with clients" />
        <StatTile value={stats.colors} label="Colors defined" />
        <StatTile value={stats.logos} label="Logo files" />
        <StatTile value={stats.signOffs} label="Sign-off notes" />
        <StatTile value={stats.approvals} label="Change proposals" />
      </div>
      <div className="flex flex-col gap-space-3">
        <span className="text-caption text-text-muted">Content richness by brand</span>
        {richness.map((w) => (
          <div key={w.id} className="flex items-center gap-space-4">
            <span className="text-caption font-medium w-35 truncate shrink-0">{w.name}</span>
            {/* The spec's progress bar: a 6px track on the neutral tint. */}
            <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-ink-soft">
              <div className="h-full rounded-full bg-accent" style={{ width: `${w.share * 100}%` }} />
            </div>
            <span className="text-caption font-medium tabular-nums w-6 text-end text-text-muted">{w.value}</span>
          </div>
        ))}
      </div>
    </Section>
  );
}
