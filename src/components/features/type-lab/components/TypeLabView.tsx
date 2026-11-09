"use client";

import { Icon } from "@/components/ui";
import type { TypeLabView as TypeLabViewProps } from "../hooks/useTypeLabPage";
import { LangPanel } from "./LangPanel";

/** The sandbox: the two specimens with their controls, then both side by side. */
export function TypeLabView({ isAr, fontCss, anyUploaded, latin, arabic }: TypeLabViewProps) {
  const t = (en: string, ar: string) => (isAr ? ar : en);
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-auto px-7 py-6.5">
      {/* Plain tag — a fully dynamic styled-jsx body compiles to nothing, so
          the sandbox was tuning the interface font while claiming to be
          tuning the brand's. See the same note in TypographyContent. */}
      <style>{fontCss}</style>
      <div>
        <h1 className="mb-1.5 font-display text-[30px] font-semibold tracking-tight">{isAr ? "مختبر الخطوط" : "Type sandbox"}</h1>
        <p className="max-w-[62ch] text-[14px] text-text-muted">
          {t(
            "Live-test line-height and tracking against real bilingual copy before it ships — Arabic baseline and Latin x-height behave differently, so tuning them side by side catches what a static export can't.",
            "جرّب ارتفاع السطر والتباعد على نص ثنائي اللغة حقيقي قبل الاعتماد. خط الأساس العربي وارتفاع الحروف اللاتينية يتصرفان بشكل مختلف، والضبط جنبًا إلى جنب يكشف ما لا يكشفه ملف ثابت."
          )}
        </p>
      </div>

      {!anyUploaded && (
        <div className="flex items-start gap-3 rounded-card bg-surface-1 px-4 py-3 text-[12.5px] text-text-secondary">
          <Icon name="info-circle" size={15} className="mt-px shrink-0 text-warning" />
          <span>
            {t(
              "No brand font file is applied yet, so this is previewing the interface font. Upload a .woff2 on Visual identity → Brand files and apply it under Typography — these numbers only transfer if they were measured on the real face.",
              "لم يُطبَّق ملف خط للعلامة بعد، لذلك تعرض المعاينة خط الواجهة. ارفع ملف ‎.woff2 من الهوية البصرية ← ملفات العلامة وطبّقه في الخطوط، فهذه القيم لا تصح إلا إذا قيست على الخط الحقيقي."
            )}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <LangPanel {...latin} />
        <LangPanel {...arabic} />
      </div>

      <div className="mk-surface flex flex-col gap-3 rounded-card bg-surface-1 p-6">
        <span className="text-[11px] font-medium uppercase tracking-[.08em] text-text-faint">{t("Side by side", "جنبًا إلى جنب")}</span>
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
            {latin.text || t("Type something above.", "اكتب شيئًا أعلاه.")}
          </div>
          <div dir="rtl" style={{ fontFamily: arabic.fontVar, fontSize: Math.min(arabic.size, 32), lineHeight: arabic.leading, fontWeight: arabic.weight }}>
            {arabic.text || "اكتب شيئًا أعلاه."}
          </div>
        </div>
      </div>
    </div>
  );
}
