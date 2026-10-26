"use client";

import { Icon } from "@/components/ui";
import type { LangPanelState } from "../hooks/useTypeLabPage";
import { SliderRow } from "./SliderRow";
import { WeightPicker } from "./WeightPicker";

/** One script's specimen and its controls. */
export function LangPanel(p: LangPanelState) {
  const tracking = "tracking" in p ? p.tracking : undefined;
  return (
    // A group, so the two panels' identically-named sliders ("Size",
    // "Line-height") are told apart by the script they belong to.
    <div role="group" aria-label={p.label} className="mk-surface flex flex-col gap-4 rounded-2xl bg-surface-1 p-5">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-semibold">{p.label}</span>
        <span
          // The accent is a fill; as 11px text on its own tint it lands under
          // the 7:1 bar that type this size carries.
          className={`rounded-full px-2.5 py-1 text-[11px] ${p.live ? "bg-accent-soft text-accent-on-soft" : "bg-surface-2 text-text-faint"}`}
          title={p.live ? "Rendering the uploaded font file" : "No font file applied — showing the interface font"}
        >
          {p.familyLabel}
          {!p.live && " · fallback"}
        </span>
      </div>

      <textarea
        dir={p.dir}
        aria-label={`${p.label} specimen text`}
        value={p.text}
        onChange={(e) => p.onText(e.target.value)}
        rows={3}
        className="w-full resize-none rounded-[12px] bg-surface-2 p-4 text-text outline-none"
        // The specimen's own settings: live values, so inline.
        style={{
          fontFamily: p.fontVar,
          fontSize: p.size,
          lineHeight: p.leading,
          letterSpacing: tracking !== undefined ? `${tracking}em` : undefined,
          fontWeight: p.weight,
        }}
      />

      <SliderRow label="Size" value={p.size} min={16} max={96} step={1} suffix="px" onChange={p.onSize} />
      <SliderRow label="Line-height" value={p.leading} min={0.9} max={2} step={0.05} suffix="" onChange={p.onLeading} />
      {"onTracking" in p ? (
        <SliderRow label="Tracking" value={p.tracking} min={-0.05} max={0.05} step={0.005} suffix="em" onChange={p.onTracking} />
      ) : (
        <div className="flex items-center gap-2 text-[11px] text-text-faint">
          <Icon name="info-circle" size={13} />
          Tracking is locked to 0 for Arabic — negative tracking breaks letter-joining.
        </div>
      )}

      <WeightPicker weight={p.weight} onWeight={p.onWeight} />
    </div>
  );
}
