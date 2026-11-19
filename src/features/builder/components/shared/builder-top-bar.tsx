"use client";

import Link from "next/link";
import { ActionsDropdown, Badge, Button, Icon, IconButton, useToast } from "@/components/ui";
import type { BuilderPageState } from "../../hooks/use-builder-page";
import { ViewSwitcher } from "../canvas/view-switcher";
import { ReviewChip } from "../review/review-panel";

/**
 * The editor's one bar, across the whole window: the way out and where you
 * are (with the site's status), the view in the middle, and shipping at the
 * end — review, view the live site, copy its link, publish.
 *
 * It replaces the floating cluster that sat over the canvas: shipping is
 * still the most prominent control, but it no longer covers the page being
 * designed.
 */
export function BuilderTopBar(b: BuilderPageState) {
  const { ws, isAr, hasUnpublished, review, revealFinding, previewHref, onPublish, onUnpublish } = b;
  const { showToast } = useToast();
  const live = !!ws.publishedAt;
  const upToDate = live && !hasUnpublished;
  const back = isAr ? `العودة إلى ${ws.name}` : `Back to ${ws.name}`;
  const status = !live
    ? { tone: "neutral" as const, text: isAr ? "غير منشور" : "Not published" }
    : hasUnpublished
      ? { tone: "warning" as const, text: isAr ? "تغييرات غير منشورة" : "Unpublished changes" }
      : { tone: "success" as const, text: isAr ? "منشور" : "Published" };

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/v/${ws.slug}`);
      showToast(isAr ? "نُسخ رابط الدليل." : "Guideline link copied.", "success");
    } catch {
      showToast(isAr ? "تعذّر النسخ. انسخ الرابط من شريط العنوان بعد فتح الموقع." : "Couldn't copy. Open the site and copy the link from the address bar.", "danger");
    }
  }

  return (
    <header className="mk-no-hover grid h-14 shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-space-4 bg-surface-1 px-space-5 shadow-rule-b">
      {/* The way out, and what you're editing: the studio's own navigation is not on this route. */}
      <div className="flex min-w-0 items-center gap-space-3">
        <Link href={`/w/${ws.slug}/overview`} aria-label={back} title={back} className="grid size-8 shrink-0 place-items-center rounded-lg text-text-muted">
          <Icon name="arrow-left" size={18} />
        </Link>
        <h1 className="min-w-0">
          <span className="sr-only">{isAr ? "محرر الدليل: " : "Guideline editor: "}</span>
          <span dir="auto" className="block truncate text-body font-medium text-text [text-align:match-parent]">{ws.name}</span>
        </h1>
        <Badge tone={status.tone} dot>{status.text}</Badge>
      </div>

      <ViewSwitcher breakpoint={b.breakpoint} onBreakpoint={b.onBreakpoint} lang={b.canvasLang} onLang={b.onPreviewLang} isAr={isAr} />

      <div className="flex min-w-0 items-center justify-end gap-space-3">
        <ReviewChip report={review} isAr={isAr} onSelect={revealFinding} />
        <span className="flex items-center rounded-lg shadow-edge">
          <Link
            href={`${previewHref}?preview=1`}
            target="_blank"
            title={isAr ? "افتح الموقع في تبويب جديد" : "Open the site in a new tab"}
            className="flex h-8 items-center gap-space-2 px-space-4 text-caption font-medium text-text"
          >
            {isAr ? "عرض" : "View"}
            <Icon name="external-link-alt" size={16} className="text-text-muted" />
          </Link>
          <span aria-hidden className="h-5 w-px bg-hairline-strong" />
          <IconButton icon="copy" label={isAr ? "نسخ رابط الدليل" : "Copy the guideline link"} onClick={() => void copyLink()} disabled={!live} className="size-8" />
        </span>
        {live && (
          <ActionsDropdown
            iconOnly
            label={isAr ? "المزيد" : "More"}
            items={[{ label: isAr ? "إيقاف الموقع" : "Take offline", icon: "eye-slash", tone: "danger", onSelect: onUnpublish }]}
          />
        )}
        <Button
          variant="primary"
          size="sm"
          onClick={onPublish}
          disabled={upToDate}
          // A blocked action that does not say what is blocking it sends someone hunting for a permission they already have.
          title={upToDate ? (isAr ? "لا توجد تغييرات منذ آخر نشر." : "Nothing has changed since the last publish.") : undefined}
        >
          {live ? (isAr ? "تحديث" : "Update") : isAr ? "نشر" : "Publish"}
        </Button>
      </div>
    </header>
  );
}
