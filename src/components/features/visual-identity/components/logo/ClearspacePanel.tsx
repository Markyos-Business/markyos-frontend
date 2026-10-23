"use client";

import { Icon } from "@/components/ui";
import { useApp } from "@/contexts/AppContext";
import { LogoSlot, SlotKind, Workspace } from "@/types";
import { formatBytes } from "@/lib/utils";

const SLOT_META: Record<SlotKind, { label: string; arLabel: string }> = {
  arabic: { label: "Arabic lockup", arLabel: "الشعار العربي" },
  latin: { label: "Latin lockup", arLabel: "الشعار اللاتيني" },
  symbol: { label: "Symbol / mark", arLabel: "الرمز" },
};

export function ClearspacePanel({
  workspace,
  selected,
  onDownload,
}: {
  workspace: Workspace;
  selected: SlotKind;
  onDownload: () => void;
}) {
  const { updateLogoSlot, uiLang } = useApp();
  const slot: LogoSlot = workspace.logo[selected];
  const isAr = uiLang(workspace) === "ar";
  const attachedSlots = (Object.keys(workspace.logo) as SlotKind[]).filter(
    (k) => workspace.logo[k].phase === "attached"
  );

  if (slot.phase !== "attached") {
    return (
      <div className="w-[308px] shrink-0 flex flex-col gap-3.5">
        <div
          className="rounded-[14px] p-[18px] flex flex-col items-center gap-2 text-center"
          style={{ background: "var(--surface-1)" }}
        >
          <Icon name="info-circle" size={20} style={{ color: "var(--text-muted)" }} />
          <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>
            Attach a lockup to see its clearspace guide and minimum sizes.
          </p>
        </div>
      </div>
    );
  }

  const height = slot.height ?? 0;
  const csPx = Math.round(height * slot.clearspaceMultiplier);
  const minDigital = Math.max(16, Math.round(height * 0.084));
  const minPrintMm = Math.round(((minDigital / 72) * 25.4) * 10) / 10;

  return (
    <div className="w-[308px] shrink-0 flex flex-col gap-3.5">
      <div className="rounded-[14px] p-[18px]" style={{ background: "var(--surface-1)" }}>
        <div className="flex items-baseline justify-between mb-3.5">
          <span className="font-semibold text-[13px]">
            {isAr ? "الهامش الآمن" : "Clearspace"} — {isAr ? SLOT_META[selected].arLabel : SLOT_META[selected].label}
          </span>
          <span
            className="font-semibold text-[13px]"
            style={{ fontFamily: "ui-monospace, Menlo, monospace", color: "var(--accent-text)" }}
          >
            {slot.clearspaceMultiplier.toFixed(2).replace(/0$/, "")}×
          </span>
        </div>
        <input
          type="range"
          // The heading above says which slot and the figure beside it says the
          // value, but neither is attached to the slider, so a screen reader
          // announced "slider, 0.5" with no idea what of.
          aria-label={`${isAr ? "الهامش الآمن" : "Clearspace"} — ${isAr ? SLOT_META[selected].arLabel : SLOT_META[selected].label}`}
          aria-valuetext={`${slot.clearspaceMultiplier.toFixed(2).replace(/0$/, "")}×`}
          min={0.25}
          max={1}
          step={0.05}
          value={slot.clearspaceMultiplier}
          onChange={(e) =>
            updateLogoSlot(workspace.id, selected, {
              clearspaceMultiplier: parseFloat(e.target.value),
            })
          }
          className="w-full accent-[var(--accent)]"
        />
        <div
          className="flex justify-between mt-2 text-[11px]"
          style={{ fontFamily: "ui-monospace, Menlo, monospace", color: "var(--text-faint)" }}
        >
          <span>0.25×</span>
          <span>1×</span>
        </div>
        <p className="mt-3.5 text-[12px] leading-[1.55]" style={{ color: "var(--text-muted)" }}>
          Measured from the file&apos;s bounding box ({Math.round(height)} px tall). Guide is{" "}
          <span style={{ color: "var(--text-secondary)" }}>{csPx} px</span> at native size.
        </p>
      </div>

      <div className="rounded-[14px] p-[18px] flex flex-col gap-3" style={{ background: "var(--surface-1)" }}>
        <span className="font-semibold text-[13px]">Minimum size</span>
        <div
          className="flex items-center justify-between px-3 py-2.5 rounded-lg"
          style={{ background: "var(--surface-2)" }}
        >
          <span className="text-[12px]" style={{ color: "var(--text-muted)" }}>Digital</span>
          <span className="text-[13px] font-semibold" style={{ fontFamily: "ui-monospace, Menlo, monospace" }}>
            {minDigital} px
          </span>
        </div>
        <div
          className="flex items-center justify-between px-3 py-2.5 rounded-lg"
          style={{ background: "var(--surface-2)" }}
        >
          <span className="text-[12px]" style={{ color: "var(--text-muted)" }}>Print</span>
          <span className="text-[13px] font-semibold" style={{ fontFamily: "ui-monospace, Menlo, monospace" }}>
            {minPrintMm} mm
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px]" style={{ color: "var(--text-faint)" }}>
          <Icon name="info-circle" size={15} />
          Below this the counter in the mark closes up.
        </div>
      </div>

      <div className="rounded-[14px] p-[18px] flex flex-col gap-2.5" style={{ background: "var(--surface-1)" }}>
        <span className="font-semibold text-[13px]">Files</span>
        {attachedSlots.map((k) => {
          const s = workspace.logo[k];
          return (
            <div key={k} className="flex items-center gap-2.5">
              <Icon name="file-code" size={18} style={{ color: "var(--text-muted)" }} />
              <span className="flex-1 min-w-0 text-[12px] truncate">{s.fileName}</span>
              <span className="text-[11px]" style={{ fontFamily: "ui-monospace, Menlo, monospace", color: "var(--text-faint)" }}>
                {s.fileSizeKB ? formatBytes(s.fileSizeKB) : ""}
              </span>
            </div>
          );
        })}
        {attachedSlots.length === 0 && (
          <span className="text-[12px]" style={{ color: "var(--text-faint)" }}>No files yet.</span>
        )}
      </div>

      <div className="mt-auto flex flex-col gap-2.5">
        <button
          type="button"
          onClick={onDownload}
          disabled={attachedSlots.length === 0}
          className="h-11 rounded-full font-semibold text-[14px] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: "var(--solid)", color: "var(--solid-ink)" }}
        >
          Download assets
        </button>
      </div>
    </div>
  );
}
