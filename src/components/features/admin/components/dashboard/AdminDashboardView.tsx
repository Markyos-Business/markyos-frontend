"use client";

import { AlertBanner, Button, PageHeader, StatTile } from "@/components/ui";
import { ACCOUNT_TYPE_LABELS, PLAN_LABELS, STAGE_LABELS, STAGE_ORDER } from "../../constants";
import { useAdminStats } from "../../hooks/useAdminStats";
import { Breakdown } from "./Breakdown";
import { SignupsChart } from "./SignupsChart";

export function AdminDashboardView() {
  const { data, error, loading, reload } = useAdminStats();

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Everyone on Markyos, and what they're building."
        actions={
          <Button variant="outline" size="sm" onClick={reload} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </Button>
        }
      />

      <AlertBanner message={error} />

      {data && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
            <StatTile value={data.users.total} label="Accounts" />
            <StatTile value={data.users.pending} label="Waiting to join" />
            <StatTile value={data.users.activeLast30d} label="Active in 30 days" />
            <StatTile value={data.users.new7d} label="New this week" />
            <StatTile value={data.brands.total} label="Brands" />
            <StatTile value={data.brands.shared} label="Brands with a team" />
            <StatTile value={data.members.people} label="People on teams" />
          </div>

          <SignupsChart signups={data.signups} />

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <Breakdown title="Accounts by type" counts={data.users.byType} labels={ACCOUNT_TYPE_LABELS} order={["studio", "freelancer", "company", "none"]} />
            <Breakdown title="Brands by stage" counts={data.brands.byStage} labels={STAGE_LABELS} order={STAGE_ORDER} />
            <Breakdown title="Brands by plan" counts={data.brands.byPlan} labels={PLAN_LABELS} />
          </div>

          <p className="text-caption text-text-faint">
            {data.users.active} of {data.users.total} accounts are active · {data.users.admins} admin
            {data.users.admins === 1 ? "" : "s"} · {data.users.new30d} joined in the last 30 days
          </p>
        </>
      )}
    </>
  );
}
