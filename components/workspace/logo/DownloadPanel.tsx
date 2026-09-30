"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";
import { useToast } from "@/components/Toast";
import { SlotKind, Workspace } from "@/lib/types";
import { formatBytes } from "@/lib/utils";
import { rasterize, triggerBlobDownload } from "@/lib/rasterize";

const VARIANTS = ["Reversed", "Positive", "Mark only", "Wordmark"] as const;
const DENSITIES = ["1×", "2×", "3×"] as const;

export function DownloadPanel({
  workspace,
  onClose,
}: {
  workspace: Workspace;
  onClose: () => void;
}) {
  const { showToast } = useToast();
  const [formats, setFormats] = useState({ svg: true, png: true, webp: false });
  const [densities, setDensities] = useState<Set<string>>(new Set(["1×", "3×"]));
  const [variants, setVariants] = useState<Set<string>>(new Set(["Reversed", "Mark only"]));
  const [generating, setGenerating] = useState(false);

  const attachedKinds = (Object.keys(workspace.logo) as SlotKind[]).filter(
    (k) => workspace.logo[k].phase === "attached"
  );
  const totalKB = attachedKinds.reduce(
    (sum, k) => sum + (workspace.logo[k].fileSizeKB ?? 0),
    0
  );
  const link = `cdn.markyos.com/${workspace.slug}/logo-kit.zip`;

  const targetKinds = (() => {
    const wantMark = variants.has("Mark only");
    const wantWordmark = variants.has("Wordmark");
    if (wantMark && !wantWordmark) return attachedKinds.filter((k) => k === "symbol");
    if (wantWordmark && !wantMark) return attachedKinds.filter((k) => k !== "symbol");
    return attachedKinds;
  })();

  function toggleVariant(v: string) {
    setVariants((prev) => {
      const next = new Set(prev);
      if (next.has(v)) next.delete(v);
      else next.add(v);
      return next;
    });
  }

  function toggleDensity(d: string) {
    setDensities((prev) => {
      const next = new Set(prev);
      if (next.has(d)) next.delete(d);
      else next.add(d);
      return next;
    });
  }

  async function handleDownload() {
    if (targetKinds.length === 0) return;
    const treatments: { label: string; invert: boolean }[] = [];
    if (variants.has("Reversed")) treatments.push({ label: "reversed", invert: true });
    if (variants.has("Positive")) treatments.push({ label: "positive", invert: false });
    if (treatments.length === 0) treatments.push({ label: "reversed", invert: true });

    setGenerating(true);
    let count = 0;
    try {
      for (const k of targetKinds) {
        const slot = workspace.logo[k];
        if (!slot.url) continue;
        const baseName = (slot.fileName || k).replace(/\.(svg|png)$/i, "");

        if (formats.svg && slot.format === "svg") {
          const a = document.createElement("a");
          a.href = slot.url;
          a.download = `${baseName}.svg`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          count++;
        }

        for (const treatment of treatments) {
          for (const fmt of ["png", "webp"] as const) {
            if (!formats[fmt]) continue;
            for (const d of densities) {
              const mult = parseInt(d, 10) || 1;
              const w = (slot.width ?? 512) * mult;
              const h = (slot.height ?? 512) * mult;
              // Real client-side rasterization — Canvas 2D draws the source
              // at target size and exports a PNG/WebP blob, no server round-trip.
              const blob = await rasterize(slot.url, w, h, fmt, treatment.invert);
              triggerBlobDownload(blob, `${baseName}-${treatment.label}@${mult}x.${fmt}`);
              count++;
            }
          }
        }
      }
      if (count === 0) {
        showToast("Pick at least one format to export.", "danger");
        return;
      }
      showToast(`Generated and downloaded ${count} file${count === 1 ? "" : "s"}.`, "success");
      onClose();
    } catch {
      showToast("Couldn't generate one of the files — try again.", "danger");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50"
      style={{ background: "var(--scrim)" }}
      onClick={onClose}
    >
      {/* `end-0`, and the edge on the inline-start: this drawer slides in from
          the side the reader finishes on, which in Arabic is the left. Pinned
          physically right it came in over the sidebar. */}
      <div
        className="absolute top-0 end-0 bottom-0 w-[480px] flex flex-col"
        style={{
          background: "var(--surface-1)",
          // `border-inline-start`, not an inset box-shadow: a shadow offset is
          // physical and has no logical form, so the drawer's edge line stayed
          // on its left however the drawer was anchored.
          borderInlineStart: "1px solid var(--hairline-strong)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="shrink-0 px-7 pt-6 pb-[18px] flex items-start justify-between gap-4"
          style={{ boxShadow: "inset 0 -1px 0 var(--hairline)" }}
        >
          <div>
            <h2 className="text-[22px] font-semibold tracking-tight mb-1" style={{ fontFamily: "var(--font-display)" }}>
              Download assets
            </h2>
            <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
              Logo system · {attachedKinds.length} source file{attachedKinds.length === 1 ? "" : "s"}
            </p>
          </div>
          <button type="button" onClick={onClose} className="mk-icon-btn cursor-pointer" aria-label="Close">
            <Icon name="times" size={20} style={{ color: "var(--text-muted)" }} />
          </button>
        </div>

        <div className="flex-1 min-h-0 px-7 py-[22px] flex flex-col gap-[22px] overflow-auto">
          <div className="flex flex-col gap-2.5">
            <span className="text-[11px] font-medium uppercase" style={{ letterSpacing: ".1em", color: "var(--text-faint)" }}>
              Formats
            </span>
            <FormatRow
              label="SVG"
              meta="vector"
              checked={formats.svg}
              onToggle={() => setFormats((f) => ({ ...f, svg: !f.svg }))}
            />
            <div
              className="flex items-center gap-3 px-3.5 py-[13px] rounded-[10px]"
              style={{
                background: "var(--surface-2)",
                boxShadow: formats.png ? "inset 0 0 0 1px var(--accent-edge)" : "none",
              }}
            >
              <Checkbox checked={formats.png} onToggle={() => setFormats((f) => ({ ...f, png: !f.png }))} />
              <span className="flex-1 font-medium text-[14px]">PNG</span>
              <div className="flex gap-1.5">
                {DENSITIES.map((d) => (
                  <button
                    key={d}
                    type="button"
                    disabled={!formats.png}
                    onClick={() => toggleDensity(d)}
                    className="text-[11px] font-medium px-2.5 py-1.5 rounded-md cursor-pointer disabled:opacity-40"
                    style={{
                      fontFamily: "ui-monospace, Menlo, monospace",
                      background: densities.has(d) ? "var(--solid)" : "var(--surface-3)",
                      color: densities.has(d) ? "var(--solid-ink)" : "var(--text-muted)",
                    }}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <FormatRow
              label="WebP"
              meta="smallest"
              checked={formats.webp}
              onToggle={() => setFormats((f) => ({ ...f, webp: !f.webp }))}
            />
          </div>

          <div className="flex flex-col gap-2.5">
            <span className="text-[11px] font-medium uppercase" style={{ letterSpacing: ".1em", color: "var(--text-faint)" }}>
              Variants
            </span>
            <div className="flex gap-2 flex-wrap">
              {VARIANTS.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => toggleVariant(v)}
                  className="text-[12px] font-semibold px-3.5 py-2.5 rounded-full cursor-pointer"
                  style={{
                    background: variants.has(v) ? "var(--solid)" : "var(--surface-2)",
                    color: variants.has(v) ? "var(--solid-ink)" : "var(--text-secondary)",
                    boxShadow: variants.has(v) ? "none" : "inset 0 0 0 1px var(--hairline)",
                  }}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <span className="text-[11px] font-medium uppercase" style={{ letterSpacing: ".1em", color: "var(--text-faint)" }}>
              Direct link
            </span>
            <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-[10px]" style={{ background: "var(--surface-2)" }}>
              <Icon name="link" size={17} style={{ color: "var(--accent-text)" }} />
              <span
                className="flex-1 min-w-0 text-[12px] truncate"
                style={{ fontFamily: "ui-monospace, Menlo, monospace", color: "var(--text-secondary)" }}
              >
                {link}
              </span>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(`https://${link}`);
                    showToast("Link copied.", "success");
                  } catch {
                    showToast("Couldn't copy — copy it manually.", "danger");
                  }
                }}
                className="mk-tap text-[12px] font-semibold cursor-pointer"
                style={{ color: "var(--accent-text)" }}
              >
                Copy
              </button>
            </div>
            <span className="text-[12px]" style={{ color: "var(--text-faint)" }}>
              Link stays valid while the section is published. Regenerating replaces it.
            </span>
          </div>
        </div>

        <div
          className="shrink-0 px-7 py-5 flex items-center gap-3.5"
          style={{ boxShadow: "inset 0 1px 0 var(--hairline)" }}
        >
          <div className="flex-1">
            <div className="font-semibold text-[14px]">
              {attachedKinds.length} file{attachedKinds.length === 1 ? "" : "s"}
            </div>
            <div className="text-[12px]" style={{ fontFamily: "ui-monospace, Menlo, monospace", color: "var(--text-muted)" }}>
              {formatBytes(totalKB)}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-11 px-[22px] rounded-full text-[14px] font-semibold cursor-pointer"
            style={{ background: "var(--surface-2)", boxShadow: "inset 0 0 0 1px var(--hairline-strong)" }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={targetKinds.length === 0 || generating}
            className="h-11 px-[26px] rounded-full text-[14px] font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: "var(--solid)", color: "var(--solid-ink)" }}
          >
            {generating ? "Generating…" : "Download"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Checkbox({ checked, onToggle }: { checked: boolean; onToggle: () => void }) {
  return (
    <span
      role="checkbox"
      aria-checked={checked}
      tabIndex={0}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle();
        }
      }}
      className="w-[18px] h-[18px] rounded-[4px] grid place-items-center shrink-0 cursor-pointer"
      style={{
        background: checked ? "var(--accent)" : "transparent",
        boxShadow: checked ? "none" : "inset 0 0 0 1px var(--hairline-strong)",
      }}
    >
      {checked && <Icon name="check" size={13} style={{ color: "var(--accent-ink)" }} />}
    </span>
  );
}

function FormatRow({
  label,
  meta,
  checked,
  onToggle,
}: {
  label: string;
  meta: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex items-center gap-3 px-3.5 py-[13px] rounded-[10px] cursor-pointer text-start"
      style={{
        background: "var(--surface-2)",
        boxShadow: checked ? "inset 0 0 0 1px var(--accent-edge)" : "none",
      }}
    >
      <Checkbox checked={checked} onToggle={onToggle} />
      <span className="flex-1 font-medium text-[14px]" style={{ color: checked ? "var(--text)" : "var(--text-secondary)" }}>
        {label}
      </span>
      <span
        className="text-[12px]"
        style={{ fontFamily: "ui-monospace, Menlo, monospace", color: "var(--text-muted)" }}
      >
        {meta}
      </span>
    </button>
  );
}
