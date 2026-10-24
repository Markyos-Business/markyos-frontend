"use client";

import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { Icon } from "@/components/ui";
import { BrandMark } from "@/components/ui/media";
import { LogoSlotCard } from "@/components/features/visual-identity/components/logo/LogoSlotCard";
import { ClearspacePanel } from "@/components/features/visual-identity/components/logo/ClearspacePanel";
import { PreviewModal, PendingUpload } from "@/components/features/visual-identity/components/logo/PreviewModal";
import { DownloadPanel } from "@/components/features/guideline-site";
import { loadImageDimensions } from "@/components/features/visual-identity/model/logoUpload";
import { SlotKind, Workspace } from "@/types";
import { fileToDataUrl } from "@/lib/utils";

const SLOT_ORDER: { kind: SlotKind; label: string; arLabel: string; tag: string }[] = [
  { kind: "arabic", label: "Arabic lockup", arLabel: "الشعار العربي", tag: "ar-SA" },
  { kind: "latin", label: "Latin lockup", arLabel: "الشعار اللاتيني", tag: "en-US" },
  { kind: "symbol", label: "Symbol / mark", arLabel: "الرمز", tag: "shared" },
];

export function LogoSystemContent({ ws }: { ws: Workspace }) {
  const { updateLogoSlot, setLogoUsageNotes, setLogoColorIds, uiLang } = useApp();
  const [selectedKind, setSelectedKind] = useState<SlotKind>("latin");
  const [pending, setPending] = useState<(PendingUpload & { kind: SlotKind }) | null>(null);
  const [showDownload, setShowDownload] = useState(false);
  const [notesDraft, setNotesDraft] = useState<string | null>(null);

  const isAr = uiLang(ws) === "ar";

  async function handleFileReady(kind: SlotKind, file: File) {
    const url = await fileToDataUrl(file);
    const { width, height } = await loadImageDimensions(url);
    const ext = file.name.split(".").pop()?.toLowerCase();
    const format = ext === "png" ? "png" : "svg";
    setPending({ kind, file, url, width, height, format, sizeKB: file.size / 1024 });
  }

  function handleAttach() {
    if (!pending) return;
    updateLogoSlot(ws.id, pending.kind, {
      phase: "uploading",
      progress: 0,
      fileName: pending.file.name,
      fileSizeKB: pending.sizeKB,
      format: pending.format,
      url: pending.url,
      width: pending.width,
      height: pending.height,
      clearspaceMultiplier: 0.5,
      errorMessage: undefined,
    });
    setSelectedKind(pending.kind);
    setPending(null);
  }

  function toggleLogoColor(id: string) {
    const next = ws.logoColorIds.includes(id) ? ws.logoColorIds.filter((x) => x !== id) : [...ws.logoColorIds, id];
    setLogoColorIds(ws.id, next);
  }

  const showcaseSlot =
    ws.logo.latin.phase === "attached"
      ? ws.logo.latin
      : ws.logo.arabic.phase === "attached"
      ? ws.logo.arabic
      : ws.logo.symbol.phase === "attached"
      ? ws.logo.symbol
      : null;

  return (
    <div className="flex-1 min-h-0 px-7 py-6.5 flex flex-col gap-5 overflow-auto">
      {/* Wraps on a narrow window — see the note in BrandFilesContent. */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div className="min-w-[16rem] flex-1">
          <h1
            className="text-[30px] font-semibold tracking-tight mb-1.5"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {isAr ? "الشعار" : "Logo system"}
          </h1>
          <p dir="auto" className="bidi-auto text-[14px]" style={{ color: "var(--text-muted)" }}>
            {isAr
              ? "ثلاث خانات. الشعار العربي واللاتيني قفلان منفصلان، والرمز مشترك بينهما. ولكل خانة نسخة فاتحة خاصة بها للخلفيات الداكنة."
              : "Three slots. Arabic and Latin are separate lockups — the mark is shared. Each one can carry its own light version for dark backgrounds."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowDownload(true)}
          className="h-9 px-[18px] rounded-full text-[13px] font-semibold cursor-pointer"
          style={{ background: "var(--solid)", color: "var(--solid-ink)" }}
        >
          {isAr ? "تنزيل الملفات" : "Download assets"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 shrink-0">
        {SLOT_ORDER.map((meta) => (
          <LogoSlotCard
            key={meta.kind}
            workspaceId={ws.id}
            kind={meta.kind}
            label={meta.label}
            arLabel={meta.arLabel}
            tag={meta.tag}
            isAr={isAr}
            slot={ws.logo[meta.kind]}
            onFileReady={handleFileReady}
            selected={selectedKind === meta.kind}
            onSelect={setSelectedKind}
          />
        ))}
      </div>

      {/*
        Sized by its content, not by the space left over.

        This row was `flex-1 min-h-[280px]`, which in a scrolling flex column
        means flex-basis 0 with a 280px floor — so the row was free to shrink
        below the height of the clearspace column inside it, and that column's
        lower cards spilled out and painted over the Usage guidelines card
        beneath. The page already scrolls, so filling the leftover height was
        never the right goal; `shrink-0` lets the row be as tall as it needs
        while the 280px floor keeps the empty state from collapsing.
      */}
      <div className="shrink-0 min-h-[280px] flex gap-4">
        <div
          className="flex-1 rounded-2xl p-5 flex flex-col gap-3.5"
          style={{ background: "var(--surface-1)" }}
        >
          <div className="flex items-center justify-between">
            <span className="font-semibold text-[13px]">Both lockups, side by side</span>
            <span
              className="text-[11px]"
              style={{ fontFamily: "ui-monospace, Menlo, monospace", color: "var(--text-muted)" }}
            >
              {isAr ? "الحجم الأصلي · 1:1" : "true size · 1:1"}
            </span>
          </div>
          {showcaseSlot?.url ? (
            /*
              Two fixed grounds rather than the app's theme, because the point
              of the pair is to show the mark on dark *and* on light at once.
              The dark cell draws the uploaded light version when there is one,
              so what's on screen is the file that will actually ship.
            */
            <div className="flex-1 grid grid-cols-2 gap-3">
              <div className="rounded-[11px] grid place-items-center relative" style={{ background: "#111114" }}>
                <BrandMark
                  src={showcaseSlot.url}
                  lightSrc={showcaseSlot.lightUrl}
                  alt=""
                  onDark
                  style={{ width: 170 }}
                />
                {/*
                  Fixed colours, for the same reason as the tile beside it: this
                  ground is #111114 whatever theme the app is in, so a theme
                  token is the wrong tool. `--text-faint` here read at 2.05:1 on
                  the light theme, where that token is near-black — the caption
                  simply vanished into the dark tile.
                */}
                <span
                  className="absolute bottom-2 text-[10px]"
                  style={{ color: showcaseSlot.lightUrl ? "#7ce7ac" : "#b4b4bb" }}
                >
                  {showcaseSlot.lightUrl
                    ? isAr ? "النسخة الفاتحة" : "light version"
                    : isAr ? "معكوس تلقائيًا" : "auto-reversed"}
                </span>
              </div>
              <div className="rounded-[11px] grid place-items-center relative" style={{ background: "#f5f5f5" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={showcaseSlot.url} alt="" style={{ width: 170 }} />
                {/*
                  Not a theme token, and not `rgba(0,0,0,.4)` either.
                  These two tiles are fixed grounds on purpose — a dark one and
                  a light one — so a studio can see its mark on both whatever
                  theme the app is in. A token solved against the app's own
                  surfaces means nothing here. The old 40% black came out at
                  2.82:1 on this #f5f5f5, the worst ratio on the page; this is
                  solved against that exact ground at 7:1, the bar this
                  interface holds 10px type to.
                */}
                <span className="absolute bottom-2 text-[10px]" style={{ color: "#4f4f55" }}>
                  {isAr ? "كما رُفع" : "as uploaded"}
                </span>
              </div>
            </div>
          ) : (
            <div
              className="flex-1 rounded-[11px] grid place-items-center text-[13px]"
              style={{ background: "var(--surface-2)", color: "var(--text-faint)" }}
            >
              {isAr ? "أرفق شعارًا لمعاينته هنا." : "Attach a lockup to preview it here."}
            </div>
          )}
          <span dir="auto" className="bidi-auto text-[12px]" style={{ color: "var(--text-muted)" }}>
            {showcaseSlot?.lightUrl
              ? isAr
                ? "الداكن أولًا: هو الأرضية التي يفتح عليها العميل الدليل افتراضيًا."
                : "Dark first: it is the canvas the client viewer uses by default."
              : isAr
                ? "بدون نسخة فاتحة يعكس التطبيق الشعارات أحادية اللون بنفسه — ارفع نسخة من البطاقة أعلاه لتتحكم في النتيجة."
                : "Without a light version the app reverses single-tone marks itself — upload one on the card above to control it."}
          </span>
        </div>

        <div className="w-[280px] shrink-0 rounded-2xl p-5 flex flex-col gap-3" style={{ background: "var(--surface-1)" }}>
          <span className="font-semibold text-[13px]">{isAr ? "قائمة الخانات" : "Slot checklist"}</span>
          {SLOT_ORDER.map(({ kind, label, arLabel }) => {
            const filled = ws.logo[kind].phase === "attached";
            const name = isAr ? arLabel : label;
            return (
              <div key={kind} className="flex items-center gap-2.5 text-[13px]">
                <Icon
                  name={filled ? "check-circle" : "info-circle"}
                  size={17}
                  style={{ color: filled ? "var(--success)" : "var(--warning)" }}
                />
                <span dir="auto" className="bidi-auto" style={{ color: filled ? "var(--text)" : "var(--text-muted)" }}>
                  {filled ? name : isAr ? `${name} — ناقص` : `${name} missing`}
                </span>
              </div>
            );
          })}
          <span dir="auto" className="bidi-auto mt-auto text-[12px]" style={{ color: "var(--text-muted)" }}>
            {ws.logo.symbol.phase === "attached"
              ? isAr
                ? "يُنشر القسم بمجرد امتلاء كل خانة تحتاجها."
                : "The section publishes once every slot you need is filled."
              : isAr
                ? "يُنشر القسم بدون الرمز، لكن عارض العميل يعود إلى الشعار اللاتيني في الترويسة."
                : "The section publishes without the symbol, but the client viewer falls back to the Latin lockup in the header."}
          </span>
        </div>

        <ClearspacePanel
          workspace={ws}
          selected={selectedKind}
          onDownload={() => setShowDownload(true)}
        />
      </div>

      <div className="rounded-2xl p-5 flex flex-col gap-4" style={{ background: "var(--surface-1)" }}>
        <div className="flex flex-col gap-1.5">
          <span className="font-semibold text-[13px]">{isAr ? "إرشادات الاستخدام" : "Usage guidelines"}</span>
          <span dir="auto" className="bidi-auto text-[12px]" style={{ color: "var(--text-faint)" }}>
            {isAr
              ? "كيف ومتى يُستخدم هذا الشعار — يظهر للعميل على موقع الدليل بجانب الشعار نفسه."
              : "How and when to use this logo — surfaced on the client-facing guideline site next to the mark."}
          </span>
        </div>
        {notesDraft !== null ? (
          <textarea
            autoFocus
            rows={3}
            value={notesDraft}
            onChange={(e) => setNotesDraft(e.target.value)}
            onBlur={() => {
              setLogoUsageNotes(ws.id, notesDraft.trim());
              setNotesDraft(null);
            }}
            className="rounded-lg p-3 outline-none text-[14px] resize-none"
            style={{ background: "var(--surface-2)", color: "var(--text)", boxShadow: "inset 0 0 0 1px var(--accent-edge)" }}
          />
        ) : (
          <button
            type="button"
            onClick={() => setNotesDraft(ws.logoUsageNotes)}
            className="text-start rounded-lg px-3 py-2.5 text-[14px] cursor-pointer"
            style={{ background: "var(--surface-2)", color: ws.logoUsageNotes ? "var(--text)" : "var(--text-faint)" }}
          >
            {ws.logoUsageNotes ||
              (isAr
                ? "متى يُستخدم كل شعار، وعلى أي خلفيات، وما الذي يجب تجنّبه…"
                : "When to use which lockup, on which backgrounds, what to avoid…")}
          </button>
        )}

        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-medium uppercase" style={{ letterSpacing: ".08em", color: "var(--text-faint)" }}>
            {isAr ? "ألوان الشعار الأساسية" : "Main logo colors"}
          </span>
          {ws.colors.length === 0 ? (
            <span className="text-[12px]" style={{ color: "var(--text-faint)" }}>
              {isAr ? "أضف الألوان من تبويب الألوان أولًا." : "Add colors on the Color tab first."}
            </span>
          ) : (
            <div className="flex gap-1.5 flex-wrap">
              {ws.colors.map((c) => {
                const active = ws.logoColorIds.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleLogoColor(c.id)}
                    className="h-8 ps-2 pe-3 rounded-full text-[11px] font-semibold cursor-pointer flex items-center gap-2"
                    style={{ background: active ? "var(--accent-soft)" : "var(--surface-2)", color: active ? "var(--accent-on-soft)" : "var(--text-muted)" }}
                  >
                    <span className="w-4 h-4 rounded-full shrink-0" style={{ background: c.hex, boxShadow: "inset 0 0 0 1px var(--chip-edge)" }} />
                    {c.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {pending && (
        <PreviewModal
          pending={pending}
          onCancel={() => setPending(null)}
          onAttach={handleAttach}
        />
      )}
      {showDownload && <DownloadPanel workspace={ws} onClose={() => setShowDownload(false)} />}
    </div>
  );
}
