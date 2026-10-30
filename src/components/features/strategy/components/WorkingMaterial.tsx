"use client";

import { Tag } from "@/components/ui";
import type { Lang, Workspace } from "@/types";
import { OBJECTIVE_KINDS, PRIORITIES } from "../constants";

/**
 * Objectives and positioning options in read mode: the working material behind
 * the strategy. Shown here only, never on the published guideline site.
 */
export function WorkingMaterial({ ws, lang }: { ws: Workspace; lang: Lang }) {
  const isAr = lang === "ar";
  const { objectives, positioningOptions } = ws.strategy;
  const pick = <T extends string | undefined>(en: T, ar: T) => ((isAr ? ar : en) || en || ar || "") as string;
  if (objectives.length === 0 && positioningOptions.length === 0) return null;

  return (
    <section className="flex flex-col gap-space-8 shadow-rule-t pt-space-8">
      <span className="text-overline uppercase text-text-faint">{isAr ? "مواد العمل" : "Working material"}</span>

      {objectives.length > 0 && (
        <div className="flex flex-col gap-space-5">
          <h2 className="text-h3 font-medium">{isAr ? "الأهداف" : "Objectives"}</h2>
          {OBJECTIVE_KINDS.map((group) => {
            const items = objectives.filter((o) => o.kind === group.value);
            if (!items.length) return null;
            return (
              <div key={group.value} className="flex flex-col gap-space-3">
                <h3 className="text-caption font-medium text-text-muted">{isAr ? group.arLabel : group.label}</h3>
                <ul className="flex flex-col gap-space-3">
                  {items.map((o) => {
                    const p = PRIORITIES.find((x) => x.value === o.priority);
                    return (
                      <li key={o.id} className="flex items-start justify-between gap-space-4">
                        <span dir="auto" className="text-body">
                          {pick(o.text, o.textAr)}
                        </span>
                        {p && <Tag tone={p.tone}>{isAr ? p.arLabel : p.label}</Tag>}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      )}

      {positioningOptions.length > 0 && (
        <div className="flex flex-col gap-space-5">
          <h2 className="text-h3 font-medium">{isAr ? "خيارات التموضع" : "Positioning options"}</h2>
          {positioningOptions.map((o) => {
            const notes = (isAr ? o.notesAr : o.notes) ?? [];
            return (
              <article key={o.id} className="flex flex-col gap-space-2">
                <h3 dir="auto" className="text-h5 font-medium">
                  {pick(o.name, o.nameAr)}
                </h3>
                {pick(o.idea, o.ideaAr) && (
                  <p dir="auto" className="text-body text-text-muted">
                    {pick(o.idea, o.ideaAr)}
                  </p>
                )}
                {pick(o.positioning, o.positioningAr) && (
                  <p dir="auto" className="text-body">
                    {pick(o.positioning, o.positioningAr)}
                  </p>
                )}
                {notes.length > 0 && (
                  <ul className="list-disc ps-space-6 text-caption text-text-muted">
                    {notes.map((n, i) => (
                      <li key={i} dir="auto">
                        {n}
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
