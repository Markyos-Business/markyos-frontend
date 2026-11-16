# Dashboard widgets

The imported dashboard family is adapted to Markyos in `src/components/ui/dashboard`. Import through the public UI barrel:

```tsx
import { Dashboard, DashboardProvider, MetricCard } from "@/components/ui";

<DashboardProvider lang="en">
  <MetricCard label="Brands" value={stats.brands.total} />
  <Dashboard.BarChartCard
    title="Signups"
    label="New accounts by day"
    data={dailyCounts}
  />
</DashboardProvider>
```

The existing basic `StatCard` remains available. The metric widget is named `MetricCard` both at the root and through `Dashboard.MetricCard`. No external icon, class-name, chart or test dependency was added.

## Available families

| Family | Components |
| --- | --- |
| Structure | DashboardHeader, DashboardCard, CardFooterStats, CardLinkButton |
| Metrics and summaries | MetricCard, MetricDelta, IconTile, ProgressCard, CountdownCard, ReminderCard |
| Charts | TimeSeriesBarChart, CategoryColumnChart, GaugeChart, GaugeLegendStats, Sparkline, ActivityHeatmap, ChartLegend |
| Lists and workflow | TaskList/TaskListItem, PeopleList/PeopleListItem, BreakdownTable, QuickActions, PipelineBar, PipelineFlow |
| Controls and feedback | CardMenu, PeriodSelect, StatusTag, WidgetStateView |

## Design and behavior contracts

- Surfaces, blue accent, text, borders, typography, radii, focus and motion use existing theme tokens. Charts use accent, indigo and info categories; categorical colors do not imply success or failure. Do not restore source-project `ub-*` classes or introduce a second icon system.
- Buttons, menus, selects, avatars, dates, progress and tags compose Markyos primitives. Menu extras and QuickActions use Markyos icon **names**. IconTile and metric icons accept a React icon component, which should render the existing Icon primitive.
- Wrap widgets in DashboardProvider with the interface language. Standard widget labels translate into English/Arabic. Feature titles, chart labels, status labels and custom actions must also be translated by the caller. Dates accept the provider locale. Timeline bars and sparklines keep chronological order left to right.
- Every chart needs a meaningful accessible label. Bars expose values on keyboard focus; heatmaps have one Tab stop with arrow-key navigation. Gauge summaries and pipeline labels provide the values independently of color.
- State is `ready`, `loading`, `empty` or `error`. Data widgets infer empty from an absent dataset. A supplied loading/error state takes priority. An all-zero series is valid data, not a fabricated positive bar. Footers disappear during non-ready card states.
- Count charts clamp negative/nonfinite values to zero; gauges clip their arc at 100%. Supply accurate labels and percentages: clipping protects rendering and does not validate business logic. Progress uses bounded counts. Countdown rejects invalid dates; `now` can fix time for previews/tests.
- StatusTag does not guess admission/payment statuses or Markyos permissions. Pass the feature's explicit translated label and semantic tone. Pipelines receive their stages/colors from feature data; they do not own the application's stage map.
- PeriodSelect is controlled. Offer only periods the data source supports and actually filter/aggregate the supplied series. The admin chart offers rolling 7/30-day views from the existing 30-day API response. The longer view groups consecutive days into 7-day buckets, with the final bucket possibly shorter; daily average uses the real number of days.
- Action callbacks are required where an action is shown. Do not place nonfunctional period filters, exports or menus in production. Use `items-start` on dashboard grids to avoid stretching a short card to a long activity feed.

## Integration and verification

The admin dashboard uses DashboardHeader, MetricCard, DashboardCard and BarChartCard/PeriodSelect with existing API counts and activity. No backend contract or subscription rule changed.

With `NEXT_PUBLIC_UI_GALLERY=1`, `/design-system/dashboard` shows the whole family using clearly labelled fixture data, language/theme controls and working interaction examples. It is linked from `/design-system` and hidden by the same production gate as other developer galleries.

Tests use the repository's Vitest setup. Numeric boundaries, state resolution, token portability and registered icons are checked in the widget test folder; isolated browser checks cover the actual gallery, keyboard heatmap, selects, menus, pipeline selection, retry and live admin period changes in both languages and responsive widths. Update the gallery and this guide when changing widget contracts.

## Canonical names and live use

Widget source files use kebab-case, matching the rest of the UI kit. The imported StatCard is now MetricCard (distinct from the basic StatCard); DeltaPill is MetricDelta; PillBarChart is TimeSeriesBarChart; WidgetStatus is WidgetStateView. Imports, types, tests and the gallery use these names directly, without aliases for the unreleased copied API.

On `/admin`, the four totals use MetricCard; signup periods use BarChartCard with TimeSeriesBarChart and CardFooterStats; follow-up rows use TaskList/TaskListItem and CardLinkButton; all three category summaries use BreakdownTable inside DashboardCard. The growth column appears only when growth data is supplied, so count-only summaries do not invent comparisons. Recent activity continues to use DashboardCard with its existing real event feed.
