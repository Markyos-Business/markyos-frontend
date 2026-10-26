"use client";

import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { useTheme } from "@/contexts/ThemeProvider";
import { EditableField } from "@/components/ui";
import { BrandMark } from "@/components/ui/media";
import { navLogo } from "@/components/features/guideline-site";
import type { Workspace } from "@/types";
import { DETAIL_FIELDS, type DetailField } from "../constants";
import { BrandNameField } from "./BrandNameField";

/** The brand's name, logo, primary colour and the details that edit in place. */
export function BrandDetailsCard({ ws, isAr }: { ws: Workspace; isAr: boolean }) {
  const { setBrandDetails } = useApp();
  const { resolved } = useTheme();
  const [field, setField] = useState<DetailField | null>(null);
  const [draft, setDraft] = useState("");
  const primaryColor = ws.colors.find((c) => c.isPrimary) ?? ws.colors[0];
  // Resolved through navLogo rather than reading slots directly: that helper
  // already knows which lockup a surface should show *and* picks up the
  // brand's own reversed file.
  const logo = navLogo(ws, isAr);

  function start(f: DetailField) {
    setField(f);
    setDraft(ws[f]);
  }

  function commit() {
    if (field) setBrandDetails(ws.id, { [field]: draft.trim() });
    setField(null);
  }

  return (
    <div className="mk-surface flex flex-col gap-3.5 rounded-2xl bg-surface-1 p-5">
      <div className="flex items-center justify-between gap-3">
        <BrandNameField ws={ws} isAr={isAr} />
        <div className="flex items-center gap-2">
          {/* Plated: this snapshot is app chrome, and a coloured symbol beside a
              near-black wordmark would lose the wordmark on the dark theme. */}
          {logo.src && (
            <BrandMark src={logo.src} lightSrc={logo.lightSrc} alt="" onDark={resolved === "dark"} plate className="h-5.5 w-auto" fallbackSize={14} />
          )}
          {primaryColor && (
            <span
              // The ring separates the swatch from the card whichever way round
              // the theme is. The brand's own colour is data, so it stays inline.
              className="size-5 shrink-0 rounded-full shadow-[inset_0_0_0_1px_var(--chip-edge)]"
              style={{ background: primaryColor.hex }}
              title={primaryColor.name}
            />
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {DETAIL_FIELDS.map((f) => (
          <EditableField
            key={f.key}
            label={isAr ? f.ar : f.en}
            placeholder={f.placeholder}
            value={field === f.key ? draft : ws[f.key]}
            editing={field === f.key}
            onStart={() => start(f.key)}
            onChange={setDraft}
            onCommit={commit}
          />
        ))}
      </div>
    </div>
  );
}
