import Link from "next/link";
import { Dashboard, Icon } from "@/components/ui";
import { brandSetup } from "@/lib/data/brandSetup";
import type { Workspace } from "@/types";

/** Saved setup data drives the shared progress widget and its checklist. */
export function BrandInsightsCard({ ws, isAr }: { ws: Workspace; isAr: boolean }) {
  const steps = brandSetup(ws);
  const completed = steps.filter(step => step.done).length;
  const t = (en: string, ar: string) => isAr ? ar : en;
  const next = steps.find(step => !step.done);
  // Finished: the bar says so, and the five ticked rows stop taking half the screen.
  if (!next) {
    return <Dashboard.ProgressCard title={t("Brand setup", "إعداد العلامة")} done={completed} total={steps.length}>
      <p className="text-body text-text-muted">{t("Every step is done. Keep the guideline current from the editor.", "اكتملت كل الخطوات. حدّث الدليل من المحرر عند الحاجة.")}</p>
    </Dashboard.ProgressCard>;
  }
  const open = steps.filter(step => !step.done);
  // Only what's left is a row; the finished steps fold into one line, so a
  // nearly set-up brand isn't a list of ticks taller than everything beside it.
  return <Dashboard.ProgressCard title={t("Set up your brand", "أكمل إعداد علامتك")} done={completed} total={steps.length}>
    <Dashboard.TaskList label={t("Steps left", "الخطوات المتبقية")} count={open.length}>
      {open.map(step => <Dashboard.TaskListItem key={step.key} title={
        <Link href={step.href} className="mk-tap flex min-h-10 items-center gap-space-3 rounded-lg px-space-2 hover:bg-surface-2">
          <Icon name="minus-circle" size={18} className="shrink-0 text-text-muted" />
          <span className="min-w-0 flex-1">{isAr ? step.arLabel : step.label}</span>
          {/* Each open step is a way in, and the next one says so. */}
          <span className="flex items-center gap-space-2 text-caption text-accent-text">
            {step.key === next.key && t("Next", "التالي")}
            <Icon name="angle-right" size={16} />
          </span>
        </Link>
      } />)}
    </Dashboard.TaskList>
    {completed > 0 && (
      <p className="mt-space-3 flex items-start gap-space-3 px-space-2 text-caption text-text-muted">
        <Icon name="check-circle" size={16} className="mt-px shrink-0 text-success" />
        <span>{t("Done: ", "مكتمل: ")}{steps.filter(step => step.done).map(step => isAr ? step.arLabel : step.label).join(isAr ? "، " : ", ")}</span>
      </p>
    )}
    {/* A template is a way to start, so it's offered only before anything is set up. */}
    {completed === 0 && <Link href="/templates" className="mk-linkbtn mt-space-4 text-body text-accent-text">{t("Or start with a template", "أو ابدأ من قالب")}</Link>}
  </Dashboard.ProgressCard>;
}
