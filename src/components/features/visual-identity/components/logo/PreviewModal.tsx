"use client";

import { Icon } from "@/components/ui";
import { BrandMark } from "@/components/ui/media";
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
  isAr,
  onCancel,
  onAttach,
}: {
  pending: PendingUpload;
  isAr: boolean;
  onCancel: () => void;
  onAttach: () => void;
}) {
  const { resolved } = useTheme();
  const csPx = Math.round(pending.height * 0.5);
  const minDigital = Math.max(16, Math.round(pending.height * 0.084));

  useModalDismiss(onCancel);

  return (
    <div
      className="fixed inset-0 z-modal flex items-center justify-center p-8 animate-fade-in-base"
      style={{ background: "var(--scrim)" }}
      onClick={onCancel}
    >
      <div
        className="animate-dialog-in w-full max-w-[1100px] rounded-card p-8 flex flex-col gap-5"
        style={{ background: "var(--canvas)", boxShadow: "0 0 0 1px var(--hairline-strong)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-end justify-between">
          <div>
            <h2
              className="text-[24px] font-semibold tracking-tight mb-1"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {isAr ? "راجِعه قبل إرفاقه" : "Check it before it lands"}
            </h2>
            <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
              {pending.file.name} · <span dir="ltr">{Math.round(pending.width)} × {Math.round(pending.height)}</span> ·{" "}
              {isAr ? "معروض بحجمه الحقيقي على الخلفيتين" : "shown at true size on both grounds"}
            </p>
          </div>
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={onCancel}
              className="h-10 px-5 rounded-lg text-[13px] font-semibold cursor-pointer"
              style={{ background: "var(--surface-2)", boxShadow: "inset 0 0 0 1px var(--hairline-strong)" }}
            >
              {isAr ? "اختر ملفًا آخر" : "Choose another file"}
            </button>
            <button
              type="button"
              onClick={onAttach}
              className="h-10 px-[22px] rounded-lg text-[13px] font-semibold cursor-pointer"
              style={{ background: "var(--solid)", color: "var(--solid-ink)" }}
            >
              {isAr ? "أرفقه بالخانة" : "Attach to slot"}
            </button>
          </div>
        </div>

        <div className="grid gap-4 grid-cols-1 lg:grid-cols-[1fr_1fr_300px]" style={{ minHeight: 280 }}>
          <div
            className="rounded-card relative grid place-items-center"
            style={{ background: "var(--surface-1)" }}
          >
            <BrandMark src={pending.url} alt="" onDark={resolved === "dark"} style={{ width: 260 }} />
            <span
              className="absolute start-4 top-3.5 text-[10px] font-medium uppercase"
              style={{ letterSpacing: ".12em", color: "var(--text-muted)" }}
            >
              {isAr ? "على الخلفية الداكنة" : "On canvas"} <span dir="ltr">#090909</span>
            </span>
          </div>
          <div
            className="rounded-card relative grid place-items-center"
            style={{ background: "#f5f5f5" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={pending.url} alt="" style={{ width: 260 }} />
            <span
              className="absolute start-4 top-3.5 text-[10px] font-medium uppercase"
              style={{ letterSpacing: ".12em", color: "#6c6c76" }}
            >
              {isAr ? "على الخلفية الفاتحة" : "On light"} <span dir="ltr">#F5F5F5</span>
            </span>
          </div>
          <div className="flex flex-col gap-3.5">
            <div className="rounded-card p-[18px] flex flex-col gap-2.5" style={{ background: "var(--surface-1)" }}>
              <span className="font-semibold text-[13px]">{isAr ? "مقروء من الملف" : "Read from the file"}</span>
              <Row label={isAr ? "الصيغة" : "Format"} value={`${pending.format.toUpperCase()} · ${pending.format === "svg" ? (isAr ? "متجه" : "vector") : isAr ? "نقطي" : "raster"}`} />
              <Row label={isAr ? "الحجم" : "Size"} value={formatBytes(pending.sizeKB)} />
              <Row label={isAr ? "الأبعاد" : "Bounding box"} value={`${Math.round(pending.width)} × ${Math.round(pending.height)}`} />
              <Row label={isAr ? "الهامش الآمن ‎0.5×" : "Clearspace 0.5×"} value={`${csPx} px`} accent />
              <Row label={isAr ? "أصغر حجم رقمي" : "Min digital size"} value={`${minDigital} px`} />
            </div>
            {/*
              The evidence for the number above it.
              "Min digital size 24 px" is a rule the studio has to defend to a
              client, and a number on its own is not an argument. Drawn at the
              minimum, at two-thirds of it and at half of it, the row shows the
              point where the mark stops resolving — so the rule is something
              you can see rather than something you have to trust.
            */}
            <div className="rounded-card p-[18px] flex flex-col gap-3" style={{ background: "var(--surface-1)" }}>
              <span className="font-semibold text-[13px]">{isAr ? "الأحجام الصغيرة" : "Small sizes"}</span>
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
                {isAr
                  ? `تحت ${minDigital} px تبدأ الفراغات الداخلية بالانغلاق، ومن هنا جاء الحد الأدنى.`
                  : `Below ${minDigital} px the counters start to close up. That's where the minimum comes from.`}
              </p>
            </div>

            {pending.format === "png" && (
              <div
                className="rounded-lg p-3 flex gap-2"
                style={{ background: "color-mix(in srgb, var(--warning) 12%, transparent)" }}
              >
                <Icon name="info-circle" size={16} style={{ color: "var(--warning)", flexShrink: 0, marginTop: 1 }} />
                <span className="text-[11px] leading-[1.5]" style={{ color: "var(--text-secondary)" }}>
                  {isAr
                    ? "صيغة PNG تعمل، لكن الهامش الآمن يُقاس بالبكسل. ارفع SVG لأدلة دقيقة."
                    : "PNG works, but clearspace is measured from pixels. Upload SVG for exact guides."}
                </span>
              </div>
            )}
            <div className="mt-auto flex items-center gap-2 text-[12px]" style={{ color: "var(--text-muted)" }}>
              <Icon name="lock" size={15} style={{ color: "var(--accent-text)" }} />
              {isAr ? "لا يُرفع شيء قبل أن ترفقه." : "Nothing is uploaded until you attach."}
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
