"use client";

import { useState } from "react";
import { ChartCard, EmptyState } from "@/components/ui";
import type { StyleGuideCopy } from "../../constants";
import { Demo, GuideSection, StateTabs } from "./GuideParts";
import type { DemoState } from "./GuideParts";

const VALUES = [
  [42, 18],
  [55, 24],
  [61, 22],
  [48, 30],
  [72, 35],
  [86, 41],
];

const ChartsSection = ({ c }: { c: StyleGuideCopy }) => {
  const [state, setState] = useState<DemoState>("ready");
  const data = c.chart.months.map((label, i) => ({ label, values: VALUES[i] }));
  const shared = {
    series: c.chart.series,
    data: state === "empty" ? [] : data,
    loading: state === "loading",
    error: state === "error" ? c.chartError : null,
    onRetry: () => setState("ready"),
    empty: <EmptyState icon="chart-bar" title={c.chartEmpty} description={c.emptyBody} />,
  };

  return (
    <GuideSection id="charts" title={c.sections.charts}>
      <StateTabs c={c} value={state} onChange={setState} label={c.sections.charts} />
      <div className="grid gap-5 lg:grid-cols-2">
        <Demo name="ChartCard · bar">
          <ChartCard {...shared} kind="bar" title={c.chart.title} label={c.chart.title} />
        </Demo>
        <Demo name="ChartCard · line">
          <ChartCard {...shared} kind="line" title={c.chart.title} label={c.chart.title} />
        </Demo>
      </div>
      <Demo name="ChartCard · area">
        <ChartCard {...shared} kind="area" title={c.chart.title} label={c.chart.title} height={260} />
      </Demo>
    </GuideSection>
  );
};

export { ChartsSection };
