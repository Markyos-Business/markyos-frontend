import Link from "next/link";
import { Icon } from "@/components/ui";
import { formatRelative } from "@/lib/utils";
import type { BuilderPageState } from "../hooks/useBuilderPage";
import { ReviewChip } from "./ReviewPanel";

/**
 * Ship, bottom-end corner, floating over the canvas.
 *
 * Publishing is what you do at the end of a session, not during one, so it is
 * out of the way of the work and still the most prominent control on screen.
 * `pointer-events-none` on the rail and `auto` on the cluster: the rail spans
 * the canvas so the cluster can sit in its corner without swallowing clicks.
 */
export function ShipCluster({ ws, isAr, hasUnpublished, review, revealFlow, previewHref, onPublish }: BuilderPageState) {
  const upToDate = !!ws.publishedAt && !hasUnpublished;
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-end p-4">
      {/* `--surface-2` and an *inset* ring: in the light theme surface-0 and
          surface-1 are both white, so the cluster needs its own fill, and an
          inset edge is the convention the surfaces sweep measures. */}
      <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-surface-2 p-1.5 ps-3.5 shadow-[inset_0_0_0_1px_var(--hairline-strong),var(--shadow-pop)]">
        <span className={`text-[11px] whitespace-nowrap ${hasUnpublished ? "text-warning" : "text-text-faint"}`}>
          {!ws.publishedAt
            ? isAr
              ? "غير منشور"
              : "Not published"
            : hasUnpublished
              ? isAr
                ? "تغييرات غير منشورة"
                : "Unpublished changes"
              : isAr
                ? `نُشر ${formatRelative(ws.publishedAt)}`
                : `Published ${formatRelative(ws.publishedAt)}`}
        </span>
        <ReviewChip report={review} isAr={isAr} onSelect={revealFlow} />
        {/* Raw rather than kit Buttons: the kit's disabled fill is surface-2,
            the cluster's own ground, so a disabled Publish lost its shape. */}
        <Link
          href={`${previewHref}?preview=1`}
          target="_blank"
          title={isAr ? "افتح الموقع في تبويب جديد" : "Open the site in a new tab"}
          className="flex h-9 cursor-pointer items-center gap-1.5 rounded-full bg-surface-2 px-3.5 text-[12px] font-semibold text-text"
        >
          <Icon name="eye" size={13} />
          {isAr ? "معاينة" : "Preview"}
        </Link>
        <button
          type="button"
          onClick={onPublish}
          disabled={upToDate}
          // A blocked action that does not say what is blocking it sends
          // someone hunting for a permission they already have.
          title={
            upToDate
              ? isAr
                ? "لا توجد تغييرات منذ آخر نشر."
                : "Nothing has changed since the last publish."
              : isAr
                ? "انشر التغييرات ليراها العميل."
                : "Push these changes to the client's site."
          }
          className="h-9 cursor-pointer rounded-full bg-solid px-4 text-[12px] font-semibold text-solid-ink disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isAr ? "نشر" : "Publish"}
        </button>
      </div>
    </div>
  );
}
