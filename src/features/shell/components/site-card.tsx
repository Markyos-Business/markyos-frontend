"use client";

import Link from "next/link";
import { Icon } from "@/components/ui";

/**
 * The brand's public guideline site, at the top of the sidebar: whether it is
 * live, where it lives, and a way there. A draft points at the editor instead,
 * because a link to a page that isn't out yet is a dead end.
 */
export function SiteCard({ slug, live, isAr }: { slug: string; live: boolean; isAr: boolean }) {
  const href = live ? `/v/${slug}` : `/w/${slug}/builder`;
  const status = live ? (isAr ? "منشور" : "Live") : isAr ? "لم يُنشر بعد" : "Not published yet";
  return (
    <Link
      href={href}
      target={live ? "_blank" : undefined}
      rel={live ? "noopener noreferrer" : undefined}
      className="mk-tap flex w-full items-center gap-space-4 rounded-card bg-surface-1 p-space-4 shadow-edge"
    >
      <span className="relative grid size-9 shrink-0 place-items-center rounded-lg bg-surface-2 text-text-muted">
        <Icon name="globe" size={18} />
        {/* Live or not, at a glance; the line below says it in words. */}
        <span aria-hidden className={`absolute -top-0.5 -end-0.5 size-2.5 rounded-full shadow-ring-status ${live ? "bg-success" : "bg-text-faint"}`} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-body font-medium text-text">{isAr ? "موقع الدليل" : "Guideline site"}</span>
        <span className="truncate text-caption text-text-muted">
          {live ? <bdi dir="ltr">/v/{slug}</bdi> : status}
        </span>
      </span>
      <Icon name={live ? "external-link-alt" : "angle-right"} size={16} className="shrink-0 text-text-muted" />
      <span className="sr-only">{status}</span>
    </Link>
  );
}
