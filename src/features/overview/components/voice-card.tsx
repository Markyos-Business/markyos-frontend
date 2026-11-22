"use client";

import { DashboardCard } from "@/components/ui";
import type { OverviewCopy } from "../copy";
import { pick } from "../logic";
import type { OverviewData } from "../types";

/**
 * Voice this month (brand home): the content checks people chose to save
 * this calendar month — how many, their average score and the note that
 * came up most. Shown only when there is at least one; never a placeholder.
 */
export function VoiceCard({ voice, copy, isAr }: { voice: NonNullable<OverviewData["voice"]>; copy: OverviewCopy; isAr: boolean }) {
  const c = copy.voice;
  const note = voice.commonNote ? pick(voice.commonNote, isAr) : c.noNote;
  return (
    <DashboardCard title={c.title}>
      <dl className="grid grid-cols-1 gap-space-6 sm:grid-cols-3">
        <div className="flex flex-col gap-space-1">
          <dt className="text-caption text-text-muted">{c.checks}</dt>
          <dd className="text-h3 font-medium tabular-nums text-text">{voice.checks}</dd>
        </div>
        <div className="flex flex-col gap-space-1">
          <dt className="text-caption text-text-muted">{c.average}</dt>
          <dd className="text-h3 font-medium tabular-nums text-text">
            <bdi dir="ltr">{c.score(voice.averageScore)}</bdi>
          </dd>
        </div>
        <div className="flex min-w-0 flex-col gap-space-1">
          <dt className="text-caption text-text-muted">{c.common}</dt>
          <dd dir="auto" className="bidi-auto text-body font-medium text-text">{note}</dd>
        </div>
      </dl>
    </DashboardCard>
  );
}
