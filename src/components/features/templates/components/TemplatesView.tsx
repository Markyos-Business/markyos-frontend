"use client";

import type { Template } from "../constants";
import { TemplateCard } from "./TemplateCard";

/** The marketplace: what it is, and the templates as cards. */
export function TemplatesView({ templates, onApply }: { templates: Template[]; onApply: (t: Template) => void }) {
  return (
    <div className="mx-auto flex w-full max-w-[1000px] flex-1 flex-col gap-6 px-8 py-8">
      <div>
        <h1 className="mb-1.5 font-display text-[30px] font-semibold tracking-tight">Template marketplace</h1>
        <p className="max-w-[62ch] text-[14px] text-text-muted">
          Fork a starting system instead of a blank workspace. Each one seeds real colors, a font
          pairing and an overview draft you edit from there.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {templates.map((t) => (
          <TemplateCard key={t.id} template={t} onApply={onApply} />
        ))}
      </div>
    </div>
  );
}
