"use client";

import { useState } from "react";
import { useAppActions } from "@/contexts/AppContext";
import { FormGrid, InputField, RichTextField } from "@/components/ui";
import type { Workspace } from "@/types";
import { settingsCopy } from "../../copy";

type DetailKey = "industry" | "tagline" | "taglineAr" | "foundedYear";

/**
 * The brand's details and the guideline's overview text (moved from the
 * Overview page, 22 Nov 2026). Each detail saves on blur or Enter, like the
 * brand name above; Escape puts the saved value back.
 */
export function BrandDetails({ ws, isAr }: { ws: Workspace; isAr: boolean }) {
  const c = settingsCopy(isAr).details;
  const { setOverview } = useAppActions();
  return (
    <div className="flex flex-col gap-field-stack">
      <FormGrid>
        <DetailInput ws={ws} field="industry" label={c.industry} placeholder={c.industryHint} />
        <DetailInput ws={ws} field="foundedYear" label={c.founded} placeholder={c.foundedHint} dir="ltr" />
        <DetailInput ws={ws} field="tagline" label={c.tagline} placeholder={c.taglineHint} dir="ltr" />
        <DetailInput ws={ws} field="taglineAr" label={c.taglineAr} placeholder={c.taglineArHint} dir="rtl" />
      </FormGrid>
      <RichTextField
        label={c.overview}
        info={c.overviewInfo}
        value={ws.overviewHtml}
        onChange={(html) => setOverview(ws.id, html)}
        placeholder={c.overviewHint}
        minHeight={160}
      />
    </div>
  );
}

function DetailInput({ ws, field, label, placeholder, dir = "auto" }: { ws: Workspace; field: DetailKey; label: string; placeholder: string; dir?: "auto" | "ltr" | "rtl" }) {
  const { setBrandDetails } = useAppActions();
  const saved = ws[field] ?? "";
  const [draft, setDraft] = useState(saved);
  return (
    <InputField
      label={label}
      value={draft}
      dir={dir}
      placeholder={placeholder}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        const next = draft.trim();
        if (next !== saved) setBrandDetails(ws.id, { [field]: next });
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
        if (e.key === "Escape") setDraft(saved);
      }}
    />
  );
}
