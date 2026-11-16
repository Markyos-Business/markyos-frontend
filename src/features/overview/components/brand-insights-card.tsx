import Link from "next/link";
import { Dashboard, Icon } from "@/components/ui";
import { brandSetup } from "@/lib/data/brandSetup";
import type { Workspace } from "@/types";

/** Saved setup data drives the shared progress widget and its checklist. */
export function BrandInsightsCard({ ws, isAr }: { ws: Workspace; isAr: boolean }) {
  const steps = brandSetup(ws);
  const completed = steps.filter(step => step.done).length;
  const t = (en: string, ar: string) => isAr ? ar : en;
  return <Dashboard.ProgressCard title={t("Set up your brand", "أكمل إعداد علامتك")} done={completed} total={steps.length}>
    <Dashboard.TaskList label={t("Brand setup checklist", "قائمة إعداد العلامة")} count={steps.length}>
      {steps.map(step => <Dashboard.TaskListItem key={step.key} title={
        <Link href={step.href} className="mk-tap flex min-h-10 items-center gap-space-3 rounded-lg px-space-2 hover:bg-surface-2">
          <Icon name={step.done ? "check-circle" : "minus-circle"} size={18} className={step.done ? "shrink-0 text-success" : "shrink-0 text-text-muted"} />
          <span className="min-w-0 flex-1">{isAr ? step.arLabel : step.label}</span>
          {step.done && <span className="text-caption text-success">{t("Done", "مكتمل")}</span>}
        </Link>
      } />)}
    </Dashboard.TaskList>
    {completed < steps.length && <Link href="/templates" className="mk-linkbtn mt-space-4 text-body text-accent-text">{t("Or start with a template", "أو ابدأ من قالب")}</Link>}
  </Dashboard.ProgressCard>;
}
