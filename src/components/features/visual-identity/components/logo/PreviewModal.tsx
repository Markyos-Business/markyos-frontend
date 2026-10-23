"use client";

import { Icon } from "@/components/ui";
import { BrandMark } from "@/components/ui/media/BrandMark/BrandMark";
import { useTheme } from "@/contexts/ThemeProvider";
import { formatBytes } from "@/lib/utils";
import { useModalDismiss } from "@/hooks/useModalDismiss";

export interface PendingUpload {
  file: File;
  url: string;
  width: number;
  height: number;
  format: "svg" | "png";
  sizeKB: number;
}

export function PreviewModal({
  pending,
  onCancel,
  onAttach,
}: {
  pending: PendingUpload;
  onCancel: () => void;
  onAttach: () => void;
}) {
  const { resolved } = useTheme();
  const csPx = Math.round(pending.height * 0.5);
  const minDigital = Math.max(16, Math.round(pending.height * 0.084));

  useModalDismiss(onCancel);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-8"
      style={{ background: "var(--scrim)" }}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-[1100px] rounded-[20px] p-8 flex flex-col gap-5"
        style={{ background: "var(--canvas)", boxShadow: "0 0 0 1px var(--hairline-strong)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-end justify-between">
          <div>
            <h2
              className="text-[24px] font-semibold tracking-tight mb-1"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Check it before it lands
            </h2>
            <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
              {pending.file.name} · {Math.round(pending.width)} × {Math.round(pending.height)} · shown at true size
              on both grounds
            </p>
          </div>
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={onCancel}
              className="h-10 px-5 rounded-full text-[13px] font-semibold cursor-pointer"
              style={{ background: "var(--surface-2)", boxShadow: "inset 0 0 0 1px var(--hairline-strong)" }}
            >
              Choose another file
            </button>
            <button
              type="button"
              onClick={onAttach}
              className="h-10 px-[22px] rounded-full text-[13px] font-semibold cursor-pointer"
              style={{ background: "var(--solid)", color: "var(--solid-ink)" }}
            >
              Attach to slot
            </button>
          </div>
        </div>

        <div className="grid gap-4 grid-cols-1 lg:grid-cols-[1fr_1fr_300px]" style={{ minHeight: 280 }}>
          <div
            className="rounded-2xl relative grid place-items-center"
            style={{ background: "var(--surface-1)" }}
          >
            <BrandMark src={pending.url} alt="" onDark={resolved === "dark"} style={{ width: 260 }} />
            <span
              className="absolute start-4 top-3.5 text-[10px] font-medium uppercase"
              style={{ letterSpacing: ".12em", color: "var(--text-muted)" }}
            >
              On canvas #090909
            </span>
          </div>
          <div
            className="rounded-2xl relative grid place-items-center"
            style={{ background: "#f5f5f5" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={pending.url} alt="" style={{ width: 260 }} />
            <span
              className="absolute start-4 top-3.5 text-[10px] font-medium uppercase"
              style={{ letterSpacing: ".12em", color: "#6c6c76" }}
            >
              On light #F5F5F5
            </span>
          </div>
          <div className="flex flex-col gap-3.5">
            <div className="rounded-[14px] p-[18px] flex flex-col gap-2.5" style={{ background: "var(--surface-1)" }}>
              <span className="font-semibold text-[13px]">Read from the file</span>
              <Row label="Format" value={`${pending.format.toUpperCase()} · ${pending.format === "svg" ? "vector" : "raster"}`} />
              <Row label="Size" value={formatBytes(pending.sizeKB)} />
              <Row label="Bounding box" value={`${Math.round(pending.width)} × ${Math.round(pending.height)}`} />
              <Row label="Clearspace 0.5×" value={`${csPx} px`} accent />
              <Row label="Min digital size" value={`${minDigital} px`} />
            </div>
            {/*
              The evidence for the number above it.
              "Min digital size 24 px" is a rule the studio has to defend to a
              client, and a number on its own is not an argument. Drawn at the
              minimum, at two-thirds of it and at half of it, the row shows the
              point where the mark stops resolving — so the rule is something
              you can see rather than something you have to trust.
            */}
            <div className="rounded-[14px] p-[18px] flex flex-col gap-3" style={{ background: "var(--surface-1)" }}>
              <span className="font-semibold text-[13px]">Small sizes</span>
              <div className="flex items-end gap-4 flex-wrap">
                {[minDigital, Math.round(minDigital * 0.66), Math.round(minDigital * 0.5)].map(
                  (h, i) => (
                    <div key={h} className="flex flex-col items-center gap-1.5">
                      <BrandMark
                        src={pending.url}
                        alt=""
                        onDark={resolved === "dark"}
                        style={{ height: h, width: "auto", display: "block" }}
                      />
                      <span
                        className="text-[10px]"
                        style={{
                          fontFamily: "ui-monospace, Menlo, monospace",
                          color: i === 0 ? "var(--success)" : "var(--text-faint)",
                        }}
                      >
                        {h} px
                      </span>
                    </div>
                  )
                )}
              </div>
              <p className="text-[11.5px] leading-[1.5]" style={{ color: "var(--text-muted)" }}>
                Below {minDigital} px the counters start to close up — that&apos;s where the minimum
                comes from.
              </p>
            </div>

            {pending.format === "png" && (
              <div
                className="rounded-[10px] p-3 flex gap-2"
                style={{ background: "color-mix(in srgb, var(--warning) 12%, transparent)" }}
              >
                <Icon name="info-circle" size={16} style={{ color: "var(--warning)", flexShrink: 0, marginTop: 1 }} />
                <span className="text-[11px] leading-[1.5]" style={{ color: "var(--text-secondary)" }}>
                  PNG works, but clearspace is measured from pixels — upload SVG for exact guides.
                </span>
              </div>
            )}
            <div className="mt-auto flex items-center gap-2 text-[12px]" style={{ color: "var(--text-muted)" }}>
              <Icon name="lock" size={15} style={{ color: "var(--accent-text)" }} />
              Nothing is uploaded until you attach.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between text-[12px]">
      <span style={{ color: "var(--text-muted)" }}>{label}</span>
      <span
        style={{
          fontFamily: "ui-monospace, Menlo, monospace",
          color: accent ? "var(--accent)" : "var(--text)",
        }}
      >
        {value}
      </span>
    </div>
  );
}
