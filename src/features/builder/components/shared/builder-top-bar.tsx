"use client";

import { ActionsDropdown, Badge, Button, ButtonGroup, IconButton, LinkButton, useToast } from "@/components/ui";
import type { BuilderPageState } from "../../hooks/use-builder-page";
import { ViewSwitcher } from "../canvas/view-switcher";
import { ReviewChip } from "../review/review-panel";
import { canGoLive, isLive, publishedButNotLive } from "@/lib/data/publication";
import { builderCopy } from "../../copy";

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
  // Under 1024px the bar is one row that never wraps: the status keeps only
  // its dot, the review chip its count, and View/Copy move into More. The view
  // switcher stays: the builder isn't shown under 768px, and from there up it
  // fits (review, 21 Nov 2026).
  const narrow = b.compact;
  // The server's word (`live`), not just "a publish happened": a published
  // brand without a paid plan isn't shown on its link (review, 21 Nov 2026).
  const live = isLive(ws);
  const notLive = publishedButNotLive(ws);
  const allowed = canGoLive(ws);
  const words = builderCopy(isAr).publication;
  const upToDate = live && !hasUnpublished;
  const back = isAr ? `العودة إلى ${ws.name}` : `Back to ${ws.name}`;
  const status = notLive
    ? { tone: "warning" as const, text: words.status.notLive, hint: words.status.notLiveHint }
    : !live
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
    <header className={`mk-no-hover h-14 shrink-0 flex-nowrap items-center gap-space-4 overflow-hidden bg-surface-1 px-space-5 shadow-rule-b ${narrow ? "flex" : "grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]"}`}>
      {/* The way out, and what you're editing: the studio's own navigation is not on this route. */}
      <div className="flex min-w-0 flex-1 items-center gap-space-3">
        <IconButton href={`/w/${ws.slug}/overview`} icon="arrow-left" size="sm" label={back} />
        <h1 className="min-w-0">
          <span className="sr-only">{isAr ? "محرر الدليل: " : "Guideline editor: "}</span>
          <span dir="auto" className="block truncate text-body font-medium text-text [text-align:match-parent]">{ws.name}</span>
        </h1>
        {narrow ? (
          <span title={status.text} className="shrink-0"><Badge tone={status.tone} dot><span className="sr-only">{status.text}</span></Badge></span>
        ) : (
          <span title={"hint" in status ? status.hint : undefined}><Badge tone={status.tone} dot>{status.text}</Badge></span>
        )}
      </div>

      <ViewSwitcher breakpoint={b.breakpoint} onBreakpoint={b.onBreakpoint} lang={b.canvasLang} onLang={b.onPreviewLang} isAr={isAr} />

      <div className="flex min-w-0 shrink-0 items-center justify-end gap-ctl-row">
        <ReviewChip report={review} isAr={isAr} onSelect={revealFinding} compact={narrow} upToDate={upToDate} />
        {/* View and copy-the-link as one kit button group (review item 3): it was a hand-drawn pair. */}
        {!narrow && (
          <ButtonGroup label={isAr ? "الموقع" : "The site"}>
            <LinkButton variant="secondary" size="sm" external href={`${previewHref}?preview=1`} title={isAr ? "افتح الموقع في تبويب جديد" : "Open the site in a new tab"}>
              {isAr ? "عرض" : "View"}
            </LinkButton>
            <IconButton variant="secondary" size="sm" icon="copy" iconSize={16} label={isAr ? "نسخ رابط الدليل" : "Copy the guideline link"} onClick={() => void copyLink()} disabledReason={live ? undefined : isAr ? "انشر الموقع أولًا." : "Publish the site first."} />
          </ButtonGroup>
        )}
        {(live || narrow) && (
          <ActionsDropdown
            iconOnly
            size="sm"
            label={isAr ? "المزيد" : "More"}
            items={[
              ...(narrow
                ? [
                    { label: isAr ? "عرض الموقع" : "View the site", icon: "external-link-alt", onSelect: () => window.open(`${previewHref}?preview=1`, "_blank", "noopener") },
                    ...(live ? [{ label: isAr ? "نسخ رابط الدليل" : "Copy the guideline link", icon: "copy", onSelect: () => void copyLink() }] : []),
                  ]
                : []),
              ...(live ? [{ label: isAr ? "إيقاف الموقع" : "Take offline", icon: "eye-slash", tone: "danger" as const, onSelect: onUnpublish }] : []),
            ]}
          />
        )}
        {!allowed ? (
          <Button variant="primary" size="sm" onClick={onPublish} title={words.upgradeHint}>
            {words.upgrade}
          </Button>
        ) : (
        <Button
          variant="primary"
          size="sm"
          onClick={onPublish}
          // Says why it is disabled in the kit's tooltip: a `title` never shows on a disabled button, so it looked broken.
          disabledReason={upToDate ? (isAr ? "لا توجد تغييرات منذ آخر نشر." : "Nothing has changed since the last publish.") : undefined}
        >
          {live ? (isAr ? "تحديث" : "Update") : isAr ? "نشر" : "Publish"}
        </Button>
        )}
      </div>
    </header>
  );
}
