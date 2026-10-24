"use client";

import { useEffect, useState } from "react";
import { Icon, useToast } from "@/components/ui";
import { BrandMark } from "@/components/ui/media";
import { useTheme } from "@/contexts/ThemeProvider";
import { useApp } from "@/contexts/AppContext";
import { extractPalette, ExtractedColor, ExtractResult } from "@/lib/extractPalette";
import { Asset, SlotKind, Workspace } from "@/types";
import { useModalDismiss } from "@/hooks/useModalDismiss";

const SLOT_LABEL: Record<SlotKind, { en: string; ar: string }> = {
  symbol: { en: "Iconmark", ar: "الرمز" },
  latin: { en: "Latin wordmark", ar: "الشعار اللاتيني" },
  arabic: { en: "Arabic wordmark", ar: "الشعار العربي" },
};

interface Source {
  key: string;
  label: string;
  url: string;
}

/**
 * Pulls a palette out of artwork the workspace already holds.
 *
 * The colours are measured, not suggested by a model: each one is genuinely
 * present in the file, and the share shown is the proportion of the mark it
 * covers. What the tool deliberately does not do is decide anything — it adds
 * nothing until the studio picks, and every name is editable first, because
 * "the biggest colour in the logo" and "the brand's primary" are not the same
 * claim and only the studio knows the second one.
 */
export function ExtractFromLogoModal({ ws, onClose }: { ws: Workspace; onClose: () => void }) {
  const { addColor, uiLang } = useApp();
  const { showToast } = useToast();
  const { resolved } = useTheme();
  const isAr = uiLang(ws) === "ar";

  const sources: Source[] = [
    ...(Object.keys(ws.logo) as SlotKind[])
      .filter((k) => ws.logo[k].phase === "attached" && ws.logo[k].url)
      .map((k) => ({ key: `slot-${k}`, label: isAr ? SLOT_LABEL[k].ar : SLOT_LABEL[k].en, url: ws.logo[k].url as string })),
    ...ws.assets
      .filter((a: Asset) => ["photo", "mockup", "export", "graphic", "illustration", "pattern"].includes(a.type))
      .slice(0, 12)
      .map((a) => ({ key: `asset-${a.id}`, label: a.fileName, url: a.url })),
  ];

  const [sourceKey, setSourceKey] = useState<string | null>(sources[0]?.key ?? null);
  // The result carries the url it belongs to, so "what state are we in" is
  // derived from it rather than tracked in a parallel status flag that could
  // disagree with the data it describes.
  const [result, setResult] = useState<{ url: string; data: ExtractResult } | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [names, setNames] = useState<Record<string, string>>({});

  const source = sources.find((s) => s.key === sourceKey);
  const url = source?.url;

  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    void extractPalette(url).then((data) => {
      if (!cancelled) setResult({ url, data });
    });
    return () => {
      cancelled = true;
    };
  }, [url]);

  const current = result && result.url === url ? result.data : undefined;
  const status: "idle" | "reading" | "done" | "error" = !url ? "idle" : !current ? "reading" : current.ok ? "done" : "error";
  const found: ExtractedColor[] = current?.ok ? current.colors : [];

  const error = !current || current.ok
    ? ""
    : current.reason === "tainted"
      ? isAr
        ? "تعذّرت قراءة بكسلات هذا الملف لأنه مستضاف على نطاق آخر لا يسمح بذلك."
        : "This file is hosted somewhere that won't allow its pixels to be read."
      : current.reason === "empty"
        ? isAr
          ? "لا توجد بكسلات معتمة كافية لاستخراج لون منها."
          : "There aren't enough opaque pixels here to read a colour from."
        : isAr
          ? "تعذّر فتح هذا الملف."
          : "That file couldn't be opened.";

  const existing = new Set(ws.colors.map((c) => c.hex.toLowerCase()));
  // Scoped to what is actually on screen, so a tick left over from a
  // previously-read source can never be counted or silently added.
  const chosen = found.filter((c) => picked.has(c.hex) && !existing.has(c.hex.toLowerCase()));

  function commit() {
    if (chosen.length === 0) return;
    for (const c of chosen) {
      addColor(ws.id, { name: (names[c.hex] || c.name).trim() || c.name, hex: c.hex });
    }
    showToast(
      isAr ? `تمت إضافة ${chosen.length} لونًا إلى اللوحة.` : `Added ${chosen.length} colour${chosen.length === 1 ? "" : "s"} to the palette.`,
      "success"
    );
    onClose();
  }

  useModalDismiss(onClose);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-8"
      style={{ background: "var(--scrim)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[720px] max-h-full overflow-y-auto rounded-2xl p-6 flex flex-col gap-5"
        style={{ background: "var(--surface-1)", boxShadow: "var(--shadow-modal)" }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={isAr ? "استخراج الألوان من الشعار" : "Pick colours from the logo"}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[19px] font-semibold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
              {isAr ? "استخراج الألوان من الشعار" : "Pick colours from your logo"}
            </h2>
            <p className="text-[13px] mt-1" style={{ color: "var(--text-muted)" }}>
              {isAr
                ? "كل لون هنا موجود فعليًا في الملف، مع نسبة المساحة التي يغطيها."
                : "Every colour here is genuinely in the file, with the share of the mark it covers."}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label={isAr ? "إغلاق" : "Close"} className="mk-icon-btn cursor-pointer shrink-0">
            <Icon name="times" size={16} style={{ color: "var(--text-faint)" }} />
          </button>
        </div>

        {sources.length === 0 ? (
          <div className="rounded-xl p-5 text-[13px]" style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}>
            {isAr
              ? "لا يوجد شعار أو صورة في هذا المشروع بعد. ارفع شعارًا من «نظام الشعار» أولًا."
              : "There's no logo or image in this workspace yet. Upload one under Logo system first."}
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-semibold uppercase" style={{ letterSpacing: ".08em", color: "var(--text-faint)" }}>
                {isAr ? "المصدر" : "Read from"}
              </span>
              <div className="flex gap-2 flex-wrap">
                {sources.map((s) => {
                  const active = s.key === sourceKey;
                  return (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => setSourceKey(s.key)}
                      className="h-9 px-3.5 rounded-full text-[12.5px] font-medium cursor-pointer max-w-[220px] truncate"
                      style={{
                        background: active ? "var(--accent-soft)" : "var(--surface-2)",
                        color: active ? "var(--accent)" : "var(--text-muted)",
                      }}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {url && (
              <div
                className="rounded-xl h-[140px] grid place-items-center shrink-0"
                style={{ background: "var(--surface-2)" }}
              >
                <BrandMark src={url} alt="" onDark={resolved === "dark"} style={{ maxHeight: 92, maxWidth: "70%" }} />
              </div>
            )}

            {status === "reading" && (
              <span className="text-[13px]" style={{ color: "var(--text-muted)" }}>
                {isAr ? "جارٍ قراءة البكسلات…" : "Reading the pixels…"}
              </span>
            )}

            {status === "error" && (
              <div className="rounded-xl p-4 text-[13px] leading-[1.6]" style={{ background: "var(--surface-2)", color: "var(--danger)" }}>
                {error}
              </div>
            )}

            {status === "done" && (
              <div className="flex flex-col gap-2">
                {found.map((c) => {
                  const already = existing.has(c.hex.toLowerCase());
                  const on = picked.has(c.hex);
                  return (
                    <div
                      key={c.hex}
                      className="flex items-center gap-3 rounded-xl p-2.5"
                      style={{ background: "var(--surface-2)", opacity: already ? 0.55 : 1 }}
                    >
                      <button
                        type="button"
                        disabled={already}
                        onClick={() =>
                          setPicked((prev) => {
                            const next = new Set(prev);
                            if (next.has(c.hex)) next.delete(c.hex);
                            else next.add(c.hex);
                            return next;
                          })
                        }
                        aria-pressed={on}
                        aria-label={`${c.name} ${c.hex}`}
                        className="w-5 h-5 rounded-md grid place-items-center shrink-0 cursor-pointer disabled:cursor-not-allowed"
                        style={{
                          background: on ? "var(--accent)" : "var(--surface-3)",
                          boxShadow: on ? "none" : "inset 0 0 0 1px var(--hairline-strong)",
                        }}
                      >
                        {on && <Icon name="check" size={11} style={{ color: "var(--accent-ink)" }} />}
                      </button>

                      <span
                        className="w-11 h-11 rounded-lg shrink-0"
                        style={{ background: c.hex, boxShadow: "inset 0 0 0 1px var(--hairline-strong)" }}
                      />

                      <input
                        value={names[c.hex] ?? c.name}
                        onChange={(e) => setNames((p) => ({ ...p, [c.hex]: e.target.value }))}
                        disabled={already}
                        aria-label={isAr ? "اسم اللون" : "Colour name"}
                        className="flex-1 min-w-0 h-9 px-3 rounded-lg outline-none text-[13px]"
                        style={{ background: "var(--surface-1)", color: "var(--text)" }}
                      />

                      <span dir="ltr" className="text-[12px] shrink-0" style={{ fontFamily: "ui-monospace, Menlo, monospace", color: "var(--text-muted)" }}>
                        {c.hex.toUpperCase()}
                      </span>
                      <span className="text-[11.5px] shrink-0 w-[46px] text-end" style={{ color: "var(--text-faint)" }}>
                        {c.share < 0.01 ? "<1%" : `${Math.round(c.share * 100)}%`}
                      </span>
                      {already && (
                        <span className="text-[10.5px] font-semibold shrink-0" style={{ color: "var(--text-faint)" }}>
                          {isAr ? "موجود" : "IN PALETTE"}
                        </span>
                      )}
                    </div>
                  );
                })}

                <p className="text-[11.5px] leading-[1.6] mt-1" style={{ color: "var(--text-faint)" }}>
                  {isAr
                    ? "الأسماء أعلاه وصف للقيمة المقروءة، وليست أسماء الهوية — عدّلها قبل الإضافة. لا يتم تعيين أي لون كأساسي تلقائيًا."
                    : "The names above describe the measured value, not the brand's own naming — rename them before adding. Nothing is marked primary automatically."}
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="h-9 px-4 rounded-full text-[13px] font-semibold cursor-pointer"
                style={{ background: "var(--surface-2)", color: "var(--text)" }}
              >
                {isAr ? "إلغاء" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={commit}
                disabled={chosen.length === 0}
                className="h-9 px-4 rounded-full text-[13px] font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: "var(--accent)", color: "var(--accent-ink)" }}
              >
                {chosen.length === 0
                  ? isAr
                    ? "اختر لونًا"
                    : "Select colours"
                  : isAr
                    ? `أضف ${chosen.length}`
                    : `Add ${chosen.length}`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
