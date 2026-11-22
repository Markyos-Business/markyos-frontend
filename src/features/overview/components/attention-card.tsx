"use client";

import Link from "next/link";
import { DashboardCard, Icon } from "@/components/ui";
import { formatRelative } from "@/lib/utils";
import type { OverviewCopy } from "../copy";
import { attentionHref } from "../logic";
import type { AttentionItem, AttentionType } from "../types";

const ICON: Record<AttentionType, string> = {
  form_answered: "inbox",
  drafts_waiting: "file-alt",
  signoff_pending: "thumbtack",
  approval_waiting: "user-check",
  link_expiring: "clock",
};

/**
 * What is waiting on the reader, most urgent first (the server sorts and
 * keeps five). Each row opens the place it's dealt with; nothing else is in
 * the row. Empty is said in one sentence.
 */
export function AttentionCard({ items, slug, copy, isAr }: { items: AttentionItem[]; slug: string; copy: OverviewCopy; isAr: boolean }) {
  return (
    <DashboardCard title={copy.attention.title}>
      {items.length === 0 ? (
        <p className="text-body text-text-muted">{copy.attention.empty}</p>
      ) : (
        <ul className="flex flex-col">
          {items.map((item, i) => (
            <li key={`${item.type}-${item.ref ?? i}`} className="shadow-rule-t first:shadow-none">
              <Link
                href={attentionHref(slug, item)}
                // button-audit-ignore: a row that opens the item, drawn as a list row
                className="mk-shaped flex min-h-widget-row items-center gap-space-5 rounded-lg px-space-2 py-space-3"
              >
                <span className="grid size-9.5 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent-on-soft">
                  <Icon name={ICON[item.type]} size={18} />
                </span>
                <span dir="auto" className="bidi-auto min-w-0 flex-1 text-body font-medium text-text">
                  {copy.attention.item[item.type]({ count: item.count ?? 0, title: item.title ?? "", by: item.by ?? "" })}
                </span>
                {item.at && (
                  <time dateTime={new Date(item.at).toISOString()} className="shrink-0 text-caption text-text-muted">
                    {formatRelative(item.at, undefined, isAr ? "ar" : "en")}
                  </time>
                )}
                <Icon name="angle-right" size={16} className="shrink-0 text-text-faint" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </DashboardCard>
  );
}
