"use client";

import { useState } from "react";
import { Button, CopyButton, Icon, Modal, useToast } from "@/components/ui";
import { SlotKind, Workspace } from "@/types";
import { formatBytes } from "@/lib/utils";
import { rasterize, triggerBlobDownload } from "@/lib/rasterize";

const VARIANTS = ["Reversed", "Positive", "Mark only", "Wordmark"] as const;
const DENSITIES = ["1×", "2×", "3×"] as const;

/** The variants' names on screen; the keys stay English, they name the files. */
const VARIANT_AR: Record<(typeof VARIANTS)[number], string> = {
  Reversed: "معكوس",
  Positive: "موجب",
  "Mark only": "الرمز فقط",
  Wordmark: "الشعار النصي",
};

export function DownloadPanel({
  workspace,
  isAr,
  onClose,
}: {
  workspace: Workspace;
  /** The site's language: this panel opens on the client's guideline site. */
  isAr: boolean;
  onClose: () => void;
}) {
  const files = (n: number) => (isAr ? (n === 1 ? "ملف واحد" : n === 2 ? "ملفان" : `${n} ملفات`) : `${n} file${n === 1 ? "" : "s"}`);
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
        showToast(isAr ? "اختر صيغة واحدة على الأقل للتصدير." : "Pick at least one format to export.", "danger");
        return;
      }
      showToast(isAr ? `تم إنشاء ${files(count)} وتنزيلها.` : `Generated and downloaded ${files(count)}.`, "success");
      onClose();
    } catch {
      showToast(isAr ? "تعذّر إنشاء أحد الملفات. حاول مرة أخرى." : "Couldn't generate one of the files. Try again.", "danger");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <Modal
      variant="sheet"
      size="sm"
      onClose={onClose}
      closeLabel={isAr ? "إغلاق" : "Close"}
      title={isAr ? "تنزيل الملفات" : "Download assets"}
      description={
        <>
          {isAr ? "نظام الشعار" : "Logo system"} ·{" "}
          {isAr ? files(attachedKinds.length) : `${attachedKinds.length} source file${attachedKinds.length === 1 ? "" : "s"}`}
        </>
      }
      footer={
        <>
          <div className="flex-1">
            <div className="text-body font-medium text-text">{files(attachedKinds.length)}</div>
            <div dir="ltr" className="text-start font-mono text-caption text-text-muted">
              {formatBytes(totalKB)}
            </div>
          </div>
          <Button variant="outline" onClick={onClose}>
            {isAr ? "إلغاء" : "Cancel"}
          </Button>
          <Button variant="primary" onClick={handleDownload} disabled={targetKinds.length === 0 || generating}>
            {generating ? (isAr ? "جارٍ الإنشاء…" : "Generating…") : isAr ? "تنزيل" : "Download"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-[22px]">
        <div className="flex flex-col gap-2.5">
          <span className="text-[11px] font-medium uppercase" style={{ letterSpacing: ".1em", color: "var(--text-faint)" }}>
            {isAr ? "الصيغ" : "Formats"}
          </span>
          <FormatRow
            label="SVG"
            meta={isAr ? "متجه" : "vector"}
            checked={formats.svg}
            onToggle={() => setFormats((f) => ({ ...f, svg: !f.svg }))}
          />
          <div
            className="flex items-center gap-3 px-3.5 py-[13px] rounded-lg"
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
            meta={isAr ? "الأصغر حجمًا" : "smallest"}
            checked={formats.webp}
            onToggle={() => setFormats((f) => ({ ...f, webp: !f.webp }))}
          />
        </div>

        <div className="flex flex-col gap-2.5">
          <span className="text-[11px] font-medium uppercase" style={{ letterSpacing: ".1em", color: "var(--text-faint)" }}>
            {isAr ? "النسخ" : "Variants"}
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
                {isAr ? VARIANT_AR[v] : v}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <span className="text-[11px] font-medium uppercase" style={{ letterSpacing: ".1em", color: "var(--text-faint)" }}>
            {isAr ? "رابط مباشر" : "Direct link"}
          </span>
          <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-lg" style={{ background: "var(--surface-2)" }}>
            <Icon name="link" size={17} style={{ color: "var(--accent-text)" }} />
            <span
              className="flex-1 min-w-0 text-[12px] truncate"
              style={{ fontFamily: "ui-monospace, Menlo, monospace", color: "var(--text-secondary)" }}
            >
              {link}
            </span>
            <CopyButton
              variant="link"
              text={`https://${link}`}
              label={isAr ? "نسخ" : "Copy"}
              copiedLabel={isAr ? "تم النسخ" : "Copied"}
              copiedMessage={isAr ? "تم نسخ الرابط." : "Link copied."}
              failedMessage={isAr ? "تعذّر النسخ. انسخه يدويًا." : "Couldn't copy. Copy it manually."}
            />
          </div>
          <span className="text-[12px]" style={{ color: "var(--text-faint)" }}>
            {isAr
              ? "يبقى الرابط صالحًا ما دام القسم منشورًا. إعادة إنشائه تستبدله."
              : "Link stays valid while the section is published. Regenerating replaces it."}
          </span>
        </div>
      </div>
    </Modal>
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
      className="w-[18px] h-[18px] rounded-sm grid place-items-center shrink-0 cursor-pointer"
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
      className="flex items-center gap-3 px-3.5 py-[13px] rounded-lg cursor-pointer text-start"
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
