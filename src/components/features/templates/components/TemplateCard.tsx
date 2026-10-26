"use client";

import { Button } from "@/components/ui";
import type { Template } from "../constants";

/** One template: its palette, what it's for, its type pairing, and the way to start from it. */
export function TemplateCard({ template: t, onApply }: { template: Template; onApply: (t: Template) => void }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl bg-surface-1">
      <div className="grid grid-cols-4">
        {t.colors.map((c) => (
          // The template's own palette: content, so the hex is data.
          <div key={c.name} className="h-[64px]" style={{ background: c.hex }} title={c.name} />
        ))}
      </div>
      <div className="flex flex-1 flex-col gap-2.5 p-5">
        <h2 className="font-display text-[16px] font-semibold">{t.name}</h2>
        <p className="flex-1 text-[13px] text-text-muted">{t.tagline}</p>
        <div className="flex gap-2 text-[11px] text-text-faint">
          <span className="rounded-full bg-surface-2 px-2 py-1">{t.latinFamily}</span>
          <span className="rounded-full bg-surface-2 px-2 py-1">{t.arabicFamily}</span>
        </div>
        {/* Named for the template it starts: four buttons all reading "Use
            this template" are four identical choices to a screen reader. */}
        <Button variant="solid" size="sm" block onClick={() => onApply(t)} aria-label={`Use the ${t.name} template`} className="mt-1">
          Use this template
        </Button>
      </div>
    </div>
  );
}
