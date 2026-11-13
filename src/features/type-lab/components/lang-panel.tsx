"use client";

import { SliderField, TextareaField } from "@/components/ui";
import { Icon } from "@/components/ui";
import type { LangPanelState } from "../hooks/use-type-lab-page";
import { WeightPicker } from "./weight-picker";

/** One script's specimen and its controls. */
export function LangPanel(p: LangPanelState) {
  const tracking = "tracking" in p ? p.tracking : undefined;
  const t = (en: string, ar: string) => (p.isAr ? ar : en);
  return (
    // A group, so the two panels' identically-named sliders ("Size",
    // "Line-height") are told apart by the script they belong to.
    <div role="group" aria-label={p.label} className="mk-surface flex flex-col gap-4 rounded-card bg-surface-1 p-5">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-semibold">{p.label}</span>
        <span
          // The accent is a fill; as 11px text on its own tint it lands under
          // the 7:1 bar that type this size carries.
          className={`rounded-full px-2.5 py-1 text-[11px] ${p.live ? "bg-accent-soft text-accent-on-soft" : "bg-surface-2 text-text-faint"}`}
          title={p.live ? t("Rendering the uploaded font file", "يعرض ملف الخط المرفوع") : t("No font file applied — showing the interface font", "لا ملف خط مطبّق، يُعرض خط الواجهة")}
        >
          {p.familyLabel}
          {!p.live && ` · ${t("fallback", "بديل")}`}
        </span>
      </div>

      <TextareaField
        dir={p.dir}
        aria-label={p.isAr ? `نص عينة ${p.label}` : `${p.label} specimen text`}
        value={p.text}
        onChange={(e) => p.onText(e.target.value)}
        rows={3}
        resizable={false}
        // The specimen's own settings: live values, so inline.
        style={{
          fontFamily: p.fontVar,
          fontSize: p.size,
          lineHeight: p.leading,
          letterSpacing: tracking !== undefined ? `${tracking}em` : undefined,
          fontWeight: p.weight,
        }}
      />

      <SliderField label={t("Size", "الحجم")} value={p.size} min={16} max={96} step={1} valueText={`${p.size}px`} onChange={p.onSize} />
      <SliderField label={t("Line-height", "ارتفاع السطر")} value={p.leading} min={0.9} max={2} step={0.05} onChange={p.onLeading} />
      {"onTracking" in p ? (
        <SliderField label={t("Tracking", "التباعد")} value={p.tracking} min={-0.05} max={0.05} step={0.005} valueText={`${p.tracking.toFixed(3)}em`} onChange={p.onTracking} />
      ) : (
        <div className="flex items-center gap-2 text-[11px] text-text-faint">
          <Icon name="info-circle" size={13} />
          {t("Tracking is locked to 0 for Arabic — negative tracking breaks letter-joining.", "التباعد مثبّت على 0 للعربية، فالتباعد السالب يكسر اتصال الحروف.")}
        </div>
      )}

      <WeightPicker weight={p.weight} onWeight={p.onWeight} label={t("Weight", "الوزن")} />
    </div>
  );
}
