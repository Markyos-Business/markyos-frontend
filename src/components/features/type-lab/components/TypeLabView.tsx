"use client";

import { Icon } from "@/components/ui";
import type { TypeLabView as TypeLabViewProps } from "../hooks/useTypeLabPage";
import { LangPanel } from "./LangPanel";

/** The sandbox: the two specimens with their controls, then both side by side. */
export function TypeLabView({ isAr, fontCss, anyUploaded, latin, arabic }: TypeLabViewProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-auto px-7 py-6.5">
      {/* Plain tag — a fully dynamic styled-jsx body compiles to nothing, so
          the sandbox was tuning the interface font while claiming to be
          tuning the brand's. See the same note in TypographyContent. */}
      <style>{fontCss}</style>
      <div>
        <h1 className="mb-1.5 font-display text-[30px] font-semibold tracking-tight">{isAr ? "مختبر الخطوط" : "Type sandbox"}</h1>
        <p className="max-w-[62ch] text-[14px] text-text-muted">
          Live-test line-height and tracking against real bilingual copy before it ships — Arabic
          baseline and Latin x-height behave differently, so tuning them side by side catches what
          a static export can&apos;t.
        </p>
      </div>

      {!anyUploaded && (
        <div className="flex items-start gap-3 rounded-xl bg-surface-1 px-4 py-3 text-[12.5px] text-text-secondary">
          <Icon name="info-circle" size={15} className="mt-px shrink-0 text-warning" />
          <span>
            No brand font file is applied yet, so this is previewing the interface font. Upload a
            .woff2 on Visual identity → Brand files and apply it under Typography — these numbers
            only transfer if they were measured on the real face.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <LangPanel {...latin} />
        <LangPanel {...arabic} />
      </div>

      <div className="mk-surface flex flex-col gap-3 rounded-2xl bg-surface-1 p-6">
        <span className="text-[11px] font-medium uppercase tracking-[.08em] text-text-faint">Side by side</span>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div
            dir="ltr"
            style={{
              fontFamily: latin.fontVar,
              fontSize: Math.min(latin.size, 32),
              lineHeight: latin.leading,
              letterSpacing: `${latin.tracking}em`,
              fontWeight: latin.weight,
            }}
          >
            {latin.text || "Type something above."}
          </div>
          <div dir="rtl" style={{ fontFamily: arabic.fontVar, fontSize: Math.min(arabic.size, 32), lineHeight: arabic.leading, fontWeight: arabic.weight }}>
            {arabic.text || "اكتب شيئًا أعلاه."}
          </div>
        </div>
      </div>
    </div>
  );
}
