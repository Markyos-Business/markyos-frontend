"use client";

import Link from "next/link";
import type { Workspace } from "@/types";
import { Button, EmptyState, Icon, MarkyosLogo } from "@/components/ui";
import { publishedGuidelineHref } from "@/lib/data/brandNavigation";

/**
 * What a client sees when they open a brand they review.
 *
 * The server sends a client only the brand's name and whether it is published,
 * never the studio's working document, so every studio page here was empty:
 * a setup checklist, an editor toolbar, "Saved just now", strategy "not written
 * yet". Their real view is the published guideline, so this page says so and
 * takes them there, or says it isn't published yet.
 */
export function ClientBrandHome({ workspace, isAr }: { workspace: Workspace; isAr: boolean }) {
  const reviewHref = publishedGuidelineHref(workspace);
  return (
    <main dir={isAr ? "rtl" : "ltr"} className="flex min-h-screen flex-col gap-space-11 bg-canvas px-space-6 py-space-8 sm:px-space-10">
      <div className="flex items-center justify-between gap-space-5">
        <Link href="/brands" className="mk-tap flex items-center gap-space-3 text-body text-text-muted">
          <Icon name="arrow-left" size={18} />
          {isAr ? "العلامات المشاركة معك" : "Brands shared with you"}
        </Link>
        <MarkyosLogo variant="wordmark" className="h-3.5" isAr={isAr} />
      </div>
      <div className="mx-auto flex w-full max-w-120 flex-1 flex-col justify-center gap-space-5">
        <h1 dir="auto" className="text-center text-h2 font-medium text-text">{workspace.name}</h1>
        <EmptyState
          icon={reviewHref ? "eye" : "clock"}
          title={reviewHref ? (isAr ? "دليل العلامة جاهز للمراجعة" : "The brand guideline is ready to review") : isAr ? "لم يُنشر الدليل بعد" : "The guideline isn't published yet"}
          description={reviewHref
            ? isAr ? "افتحه لقراءته وترك ملاحظاتك على كل قسم." : "Open it to read it and leave notes on each section."
            : isAr ? "سيصلك إشعار عندما ينشره فريق العلامة." : "You'll get a notification when the brand team publishes it."}
          action={reviewHref ? (
            <Button variant="primary" href={reviewHref} icon={<Icon name="eye" size={18} />}>
              {isAr ? "مراجعة الدليل" : "Review the guideline"}
            </Button>
          ) : undefined}
        />
      </div>
    </main>
  );
}
