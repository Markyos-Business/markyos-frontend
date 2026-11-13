import Link from "next/link";
import { Icon } from "@/components/ui";
import { brandSetup } from "@/lib/data/brandSetup";
import type { Workspace } from "@/types";

/** One actionable first-run path, derived from the same data as brand cards. */
export function BrandInsightsCard({ ws, isAr }: { ws: Workspace; isAr: boolean }) {
  const steps = brandSetup(ws);
  const completed = steps.filter(step => step.done).length;
  return (
    <section aria-label={isAr ? "إعداد العلامة" : "Brand setup"} className="mk-surface flex flex-col gap-space-4 rounded-card bg-surface-1 p-space-6">
      <div className="flex flex-wrap items-center justify-between gap-space-3">
        <h2 className="text-h5 font-medium">{isAr ? "أكمل إعداد علامتك" : "Set up your brand"}</h2>
        <span className="text-caption tabular-nums text-text-muted">{isAr ? `${completed} من ${steps.length} مكتمل` : `${completed} of ${steps.length} done`}</span>
      </div>
      <ol className="flex flex-col gap-space-1">
        {steps.map(step => <li key={step.key}>
          <Link href={step.href} className="mk-tap flex min-h-10 items-center gap-space-3 rounded-lg px-space-3 text-body hover:bg-surface-2">
            <Icon name={step.done ? "check-circle" : "minus-circle"} size={18} className={step.done ? "text-success" : "text-text-muted"} />
            <span className="flex-1">{isAr ? step.arLabel : step.label}</span>
            {step.done && <span className="text-caption text-success">{isAr ? "مكتمل" : "Done"}</span>}
          </Link>
        </li>)}
      </ol>
      {completed < steps.length && <Link href="/templates" className="mk-linkbtn text-body text-accent-text">{isAr ? "أو ابدأ من قالب" : "Or start with a template"}</Link>}
    </section>
  );
}
