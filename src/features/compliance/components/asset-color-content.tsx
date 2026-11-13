"use client";

import { useRef, useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { useToast, Icon, EmptyHint, EmptyState, Button } from "@/components/ui";
import { DominantColor, colorDistance, extractDominantColors } from "../utils/color-extract";
import { formatRelative } from "@/lib/utils";
import { ColorSwatch, Workspace } from "@/types";

const MATCH_THRESHOLD = 45;

export function AssetColorContent({ ws }: { ws: Workspace }) {
  const { addComplianceCheck, uiLang } = useApp();
  const { showToast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<DominantColor[] | null>(null);

  const isAr = uiLang(ws) === "ar";
  const t = (en: string, ar: string) => (isAr ? ar : en);

  function nearestSwatch(hex: string) {
    let best: ColorSwatch | null = null;
    let bestDist = Infinity;
    for (const c of ws.colors) {
      const d = colorDistance(hex, c.hex);
      if (d !== null && d < bestDist) {
        bestDist = d;
        best = c;
      }
    }
    return { swatch: best, distance: bestDist };
  }

  async function handleFile(file: File) {
    if (ws.colors.length === 0) return;
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setFileName(file.name);
    setResult(null);
    setAnalyzing(true);
    try {
      const colors = await extractDominantColors(url);
      setResult(colors);
      const matchedIds = new Set<string>();
      const flagged: string[] = [];
      for (const c of colors) {
        const { swatch, distance } = nearestSwatch(c.hex);
        if (swatch && distance <= MATCH_THRESHOLD) matchedIds.add(swatch.id);
        else flagged.push(c.hex);
      }
      addComplianceCheck(ws.id, { fileName: file.name, matchedSwatchIds: [...matchedIds], flaggedColors: flagged });
    } catch {
      showToast(t("Couldn't read that image — try a PNG or JPG.", "تعذّرت قراءة الصورة، جرّب PNG أو JPG."), "danger");
    } finally {
      setAnalyzing(false);
    }
  }

  if (ws.colors.length === 0) return (
    // The same frame as the checker below, so the empty page doesn't shift.
    <div className="flex-1 min-h-0 px-7 py-6.5 flex flex-col gap-5 overflow-auto max-w-[820px]">
      <h1 className="text-h3 font-medium">{t("Asset colors", "ألوان الأصول")}</h1>
      <EmptyState icon="palette" title={t("Add your brand colours first", "أضف ألوان علامتك أولًا")}
        description={t("The checker needs your palette before it can compare an image.", "يحتاج الفاحص إلى ألوان علامتك قبل مقارنة صورة بها.")}
        action={<Button href={`/w/${ws.slug}/visual-identity?tab=color`}>{t("Add colours", "أضف الألوان")}</Button>} />
    </div>
  );

  return (
    <div className="flex-1 min-h-0 px-7 py-6.5 flex flex-col gap-5 overflow-auto max-w-[820px]">
      <div>
        <h1 className="text-[30px] font-semibold tracking-tight mb-1.5" style={{ fontFamily: "var(--font-display)" }}>
          {isAr ? "ألوان الأصول" : "Asset colors"}
        </h1>
        <p className="text-[14px] max-w-[62ch]" style={{ color: "var(--text-muted)" }}>
          {t(
            "Upload a finished asset and check its dominant colors against this workspace's approved palette — catches drift before it ships, not after.",
            "ارفع أصلًا جاهزًا وافحص ألوانه الغالبة مقابل الألوان المعتمدة لهذه المساحة، لتكتشف الانحراف قبل النشر لا بعده."
          )}
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />

      <div role="button" tabIndex={0} aria-label={t("Choose an asset image", "اختر صورة للأصل")}
        onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); inputRef.current?.click(); } }}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files?.[0];
          if (file) handleFile(file);
        }}
        className="rounded-card p-6 flex items-center gap-5 cursor-pointer"
        style={{ background: "var(--surface-1)", boxShadow: "inset 0 0 0 1px var(--hairline-strong)" }}
      >
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt="" style={{ width: 90, height: 90, objectFit: "cover", borderRadius: 12 }} />
        ) : (
          <div
            className="mk-surface w-[90px] h-[90px] rounded-card grid place-items-center shrink-0"
            style={{ background: "var(--surface-2)" }}
          >
            <Icon name="upload" size={24} style={{ color: "var(--text-muted)" }} />
          </div>
        )}
        <div>
          <div className="font-semibold text-[14px] mb-1">{fileName || t("Drop an image, or click to browse", "أفلت صورة، أو انقر للاختيار")}</div>
          <div className="text-[12px]" style={{ color: "var(--text-faint)" }}>
            {t("Runs entirely in your browser — colors are sampled from the pixels, nothing is uploaded anywhere.", "يعمل بالكامل في متصفحك؛ تؤخذ الألوان من البكسلات ولا يُرفع شيء إلى أي مكان.")}
          </div>
        </div>
      </div>

      {analyzing && (
        <div className="flex items-center gap-2.5 text-[13px]" style={{ color: "var(--text-muted)" }}>
          <Icon name="circle-notch" size={16} className="animate-spin" style={{ color: "var(--accent-text)" }} />
          {t("Sampling pixels…", "جارٍ أخذ عينات البكسلات…")}
        </div>
      )}

      {result && !analyzing && (
        <div className="rounded-card p-5 flex flex-col gap-3.5" style={{ background: "var(--surface-1)" }}>
          <span className="font-semibold text-[13px]">{t("Dominant colors found", "الألوان الغالبة")}</span>
          <div className="flex flex-col gap-2">
            {result.map((c) => {
              const { swatch, distance } = nearestSwatch(c.hex);
              const matched = swatch && distance <= MATCH_THRESHOLD;
              return (
                <div key={c.hex} className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-md shrink-0"
                    style={{ background: c.hex, boxShadow: "inset 0 0 0 1px var(--hairline-strong)" }}
                  />
                  <span
                    dir="ltr"
                    className="text-[12px] w-[70px] shrink-0"
                    style={{ fontFamily: "ui-monospace, Menlo, monospace", color: "var(--text-muted)" }}
                  >
                    {c.hex.toUpperCase()}
                  </span>
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--surface-2)" }}>
                    <div className="h-full" style={{ width: `${Math.round(c.weight * 100)}%`, background: "var(--surface-3)" }} />
                  </div>
                  {matched ? (
                    <span
                      className="text-[11px] font-semibold px-2.5 py-1 rounded-md shrink-0"
                      style={{ background: "var(--success-soft)", color: "var(--success)" }}
                    >
                      {isAr ? `يطابق ${swatch!.name}` : `Matches ${swatch!.name}`}
                    </span>
                  ) : (
                    <span
                      className="text-[11px] font-semibold px-2.5 py-1 rounded-md shrink-0"
                      style={{ background: "var(--danger-soft)", color: "var(--danger)" }}
                    >
                      {t("Off-palette", "خارج الألوان المعتمدة")}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        <h2 className="text-[11px] font-medium uppercase" style={{ letterSpacing: isAr ? "normal" : ".08em", color: "var(--text-faint)" }}>
          {t("Past checks", "الفحوص السابقة")}
        </h2>
        {ws.complianceChecks.length === 0 ? (
          <EmptyHint>{t("No checks run yet.", "لم يُجرَ أي فحص بعد.")}</EmptyHint>
        ) : (
          <div className="flex flex-col gap-1.5">
            {ws.complianceChecks.map((c) => (
              <div key={c.id} className="flex items-center gap-3 flex-wrap text-[12px] px-1 py-1">
                <span className="flex-1 min-w-[10rem]" style={{ color: "var(--text-secondary)" }}>
                  {c.fileName}
                </span>
                {/*
                 * The colours that were flagged, not just how many.
                 *
                 * The row used to say "1 flagged" and stop, so the only way to
                 * find out *which* colour had drifted was to upload the file
                 * again and re-run the check — a history that records the
                 * answer and then withholds it. The numbers were already
                 * stored; only the pixels were missing.
                 */}
                {c.flaggedColors.length > 0 && (
                  <span className="flex items-center gap-1 shrink-0">
                    {c.flaggedColors.slice(0, 6).map((hex) => (
                      <span
                        key={hex}
                        title={`${t("Off-palette", "خارج الألوان المعتمدة")}: ${hex.toUpperCase()}`}
                        className="w-4 h-4 rounded-sm"
                        style={{ background: hex, boxShadow: "inset 0 0 0 1px var(--hairline-strong)" }}
                      />
                    ))}
                  </span>
                )}
                <span className="shrink-0 ms-auto" style={{ color: "var(--text-faint)" }}>
                  {formatRelative(c.createdAt)} · {c.matchedSwatchIds.length} {t("matched", "مطابق")} · {c.flaggedColors.length} {t("flagged", "مُعلَّم")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
