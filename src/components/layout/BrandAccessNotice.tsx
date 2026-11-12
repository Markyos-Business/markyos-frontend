"use client";

import type { Workspace } from "@/types";
import { Button, EmptyState } from "@/components/ui";
import { publishedGuidelineHref } from "@/lib/data/brandNavigation";
import { PageShell } from "./PageShell";

/** A known brand member followed an internal-team URL, not a missing brand. */
export function BrandAccessNotice({ workspace, isAr }: { workspace: Workspace; isAr: boolean }) {
  const reviewHref = publishedGuidelineHref(workspace);
  return (
    <PageShell workspace={workspace} section="Client review" arSection="مراجعة العميل">
      <div className="flex flex-col gap-space-6" data-client-access-notice="">
        <h1 className="text-h1 font-medium text-text">{isAr ? "مراجعة العميل" : "Client review"}</h1>
        <EmptyState
          icon="lock"
          title={isAr ? "هذه صفحة داخلية لفريق العلامة." : "This is an internal team page."}
          description={isAr
            ? "يراجع العملاء استبيانات الاستكشاف وتقارير التحليل عبر روابط مشاركة يرسلها مالك العلامة. اطلب منه الرابط، أو عُد إلى محتوى العلامة المتاح لك."
            : "Clients review discovery forms and analysis through shared links from the brand owner. Ask the owner for a link, or return to the brand content available to you."}
          action={
            <div className="flex flex-wrap justify-center gap-space-3">
              {reviewHref && <Button href={reviewHref} variant="solid">{isAr ? "مراجعة الدليل" : "Review guideline"}</Button>}
              <Button href={`/w/${workspace.slug}/overview`} variant="outline">{isAr ? "العودة إلى نظرة عامة" : "Back to overview"}</Button>
            </div>
          }
        />
      </div>
    </PageShell>
  );
}
