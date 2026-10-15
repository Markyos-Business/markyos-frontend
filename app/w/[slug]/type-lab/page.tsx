"use client";

import { useId, useState } from "react";
import { useParams } from "next/navigation";
import { useApp } from "@/lib/store";
import { TopBar } from "@/components/workspace/TopBar";
import { Icon } from "@/components/Icon";
import { brandFontStacks } from "@/lib/brandFonts";

const WEIGHTS = [300, 400, 500, 600, 700] as const;

export default function TypeLabPage() {
  const params = useParams<{ slug: string }>();
  const { getWorkspace, uiLang } = useApp();
  const ws = getWorkspace(params.slug);

  const [latinText, setLatinText] = useState("Brand governance for studios that ship in two directions.");
  const [latinSize, setLatinSize] = useState(40);
  const [latinLeading, setLatinLeading] = useState(1.2);
  const [latinTracking, setLatinTracking] = useState(-0.02);
  const [latinWeight, setLatinWeight] = useState<number>(600);

  const [arabicText, setArabicText] = useState("إدارة الهوية البصرية للاستوديوهات التي تعمل باتجاهين.");
  const [arabicSize, setArabicSize] = useState(36);
  const [arabicLeading, setArabicLeading] = useState(1.5);
  const [arabicWeight, setArabicWeight] = useState<number>(500);

  if (!ws) return null;
  const isAr = uiLang(ws) === "ar";
  // The sandbox has to render the face the brand actually ships, or the
  // numbers a designer settles on here don't transfer to anything.
  const fonts = brandFontStacks(ws);
  const anyUploaded = fonts.latinIsUploaded || fonts.arabicIsUploaded;

  return (
    <>
      <TopBar workspace={ws} section="Type sandbox" arSection="مختبر الخطوط" />
      <div className="flex-1 min-h-0 px-7 py-6.5 flex flex-col gap-5 overflow-auto">
        {/* Plain tag — a fully dynamic styled-jsx body compiles to nothing, so
            the sandbox was tuning the interface font while claiming to be
            tuning the brand's. See the same note in TypographyContent. */}
        <style>{fonts.css}</style>
        <div>
          <h1 className="text-[30px] font-semibold tracking-tight mb-1.5" style={{ fontFamily: "var(--font-display)" }}>
            {isAr ? "مختبر الخطوط" : "Type sandbox"}
          </h1>
          <p className="text-[14px] max-w-[62ch]" style={{ color: "var(--text-muted)" }}>
            Live-test line-height and tracking against real bilingual copy before it ships — Arabic
            baseline and Latin x-height behave differently, so tuning them side by side catches what
            a static export can&apos;t.
          </p>
        </div>

        {!anyUploaded && (
          <div
            className="rounded-xl px-4 py-3 flex items-start gap-3 text-[12.5px]"
            style={{ background: "var(--surface-1)", color: "var(--text-secondary)" }}
          >
            <Icon name="info-circle" size={15} style={{ color: "var(--warning)", flexShrink: 0, marginTop: 1 }} />
            <span>
              No brand font file is applied yet, so this is previewing the interface font. Upload a
              .woff2 on Visual identity → Brand files and apply it under Typography — these numbers
              only transfer if they were measured on the real face.
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <LangPanel
            dir="ltr"
            label="Latin"
            familyLabel={ws.typography.latinFamily}
            live={fonts.latinIsUploaded}
            fontVar={fonts.latin}
            text={latinText}
            onText={setLatinText}
            size={latinSize}
            onSize={setLatinSize}
            leading={latinLeading}
            onLeading={setLatinLeading}
            tracking={latinTracking}
            onTracking={setLatinTracking}
            weight={latinWeight}
            onWeight={setLatinWeight}
          />
          <LangPanel
            dir="rtl"
            label="Arabic"
            familyLabel={ws.typography.arabicFamily}
            live={fonts.arabicIsUploaded}
            fontVar={fonts.arabic}
            text={arabicText}
            onText={setArabicText}
            size={arabicSize}
            onSize={setArabicSize}
            leading={arabicLeading}
            onLeading={setArabicLeading}
            weight={arabicWeight}
            onWeight={setArabicWeight}
          />
        </div>

        <div className="mk-surface rounded-2xl p-6 flex flex-col gap-3" style={{ background: "var(--surface-1)" }}>
          <span className="text-[11px] font-medium uppercase" style={{ letterSpacing: ".08em", color: "var(--text-faint)" }}>
            Side by side
          </span>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div
              dir="ltr"
              style={{
                fontFamily: fonts.latin,
                fontSize: Math.min(latinSize, 32),
                lineHeight: latinLeading,
                letterSpacing: `${latinTracking}em`,
                fontWeight: latinWeight,
              }}
            >
              {latinText || "Type something above."}
            </div>
            <div
              dir="rtl"
              style={{
                fontFamily: fonts.arabic,
                fontSize: Math.min(arabicSize, 32),
                lineHeight: arabicLeading,
                fontWeight: arabicWeight,
              }}
            >
              {arabicText || "اكتب شيئًا أعلاه."}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function LangPanel({
  dir,
  label,
  familyLabel,
  live,
  fontVar,
  text,
  onText,
  size,
  onSize,
  leading,
  onLeading,
  tracking,
  onTracking,
  weight,
  onWeight,
}: {
  dir: "ltr" | "rtl";
  label: string;
  familyLabel: string;
  /** True when a real uploaded file backs this stack, false when it's the interface fallback. */
  live: boolean;
  fontVar: string;
  text: string;
  onText: (v: string) => void;
  size: number;
  onSize: (v: number) => void;
  leading: number;
  onLeading: (v: number) => void;
  tracking?: number;
  onTracking?: (v: number) => void;
  weight: number;
  onWeight: (v: number) => void;
}) {
  return (
    // A group, so the two panels' identically-named sliders ("Size",
    // "Line-height") are told apart by the script they belong to. Without it a
    // screen reader hears "Size" twice on one screen with nothing to separate
    // them.
    <div
      role="group"
      aria-label={label}
      className="mk-surface rounded-2xl p-5 flex flex-col gap-4"
      style={{ background: "var(--surface-1)" }}
    >
      <div className="flex items-center justify-between">
        <span className="font-semibold text-[13px]">{label}</span>
        <span
          className="text-[11px] px-2.5 py-1 rounded-full"
          style={{
            background: live ? "var(--accent-soft)" : "var(--surface-2)",
            // The accent is a fill; as 11px text on its own tint it lands
            // under the 7:1 bar that type this size carries.
            color: live ? "var(--accent-on-soft)" : "var(--text-faint)",
          }}
          title={live ? "Rendering the uploaded font file" : "No font file applied — showing the interface font"}
        >
          {familyLabel}
          {!live && " · fallback"}
        </span>
      </div>

      <textarea
        dir={dir}
        aria-label={`${label} specimen text`}
        value={text}
        onChange={(e) => onText(e.target.value)}
        rows={3}
        className="w-full rounded-[12px] p-4 outline-none resize-none"
        style={{
          background: "var(--surface-2)",
          color: "var(--text)",
          fontFamily: fontVar,
          fontSize: size,
          lineHeight: leading,
          letterSpacing: tracking !== undefined ? `${tracking}em` : undefined,
          fontWeight: weight,
        }}
      />

      <SliderRow label="Size" value={size} min={16} max={96} step={1} suffix="px" onChange={onSize} />
      <SliderRow label="Line-height" value={leading} min={0.9} max={2} step={0.05} suffix="" onChange={onLeading} />
      {tracking !== undefined && onTracking ? (
        <SliderRow
          label="Tracking"
          value={tracking}
          min={-0.05}
          max={0.05}
          step={0.005}
          suffix="em"
          onChange={onTracking}
        />
      ) : (
        <div className="flex items-center gap-2 text-[11px]" style={{ color: "var(--text-faint)" }}>
          <Icon name="info-circle" size={13} />
          Tracking is locked to 0 for Arabic — negative tracking breaks letter-joining.
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <span className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>
          Weight
        </span>
        <div className="flex gap-1.5">
          {WEIGHTS.map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => onWeight(w)}
              className="flex-1 h-8 rounded-md text-[12px] font-medium cursor-pointer"
              style={{
                fontFamily: "ui-monospace, Menlo, monospace",
                background: weight === w ? "var(--solid)" : "var(--surface-2)",
                color: weight === w ? "var(--solid-ink)" : "var(--text-muted)",
              }}
            >
              {w}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix: string;
  onChange: (v: number) => void;
}) {
  // Points the slider at the label already on screen rather than repeating it
  // in an aria-label, so the two can never drift apart.
  const labelId = useId();
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span id={labelId} className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>
          {label}
        </span>
        <span className="text-[11px]" style={{ fontFamily: "ui-monospace, Menlo, monospace", color: "var(--text-faint)" }}>
          {value.toFixed(step < 1 ? 2 : 0)}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        aria-labelledby={labelId}
        aria-valuetext={`${value.toFixed(step < 1 ? 2 : 0)}${suffix}`}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-[var(--accent)]"
      />
    </div>
  );
}
