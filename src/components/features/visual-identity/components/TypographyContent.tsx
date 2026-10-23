"use client";

import { useRef, useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { useToast, Icon } from "@/components/ui";
import { Asset, Workspace } from "@/types";
import { brandFontStacks, familyFiles } from "@/components/features/guideline-site";
import { FONT_ACCEPT, fontMetaFromFileName, isFontFile } from "@/components/features/visual-identity/model/fontFile";
import { importGoogleFont, SUGGESTED_FONTS } from "@/components/features/visual-identity/services/googleFonts";
import { fileToDataUrl, formatBytes, formatRelative } from "@/lib/utils";

const WEIGHTS = ["300", "400", "500", "600", "700"];

// Fixed system rule, not workspace data: the 1.25 type-scale ratio and its
// four steps are part of how Markyos sets bilingual type, so this stays the
// same for every brand. The sample copy per row is a generic specimen —
// Display and Caption pull real values from the workspace so it's obvious
// where they come from; Heading and Body are intentionally generic pangram
// text, not product copy.
const SCALE_META = [
  { name: "Display", meta: "40 / 48 · 600", enSize: 40, arSize: 34 },
  {
    name: "Heading",
    meta: "24 / 32 · 600",
    enSize: 24,
    arSize: 22,
    en: "The five boxing wizards jump quickly",
    ar: "نص تجريبي لعرض الخط العربي بوضوح",
  },
  {
    name: "Body",
    meta: "16 / 26 · 400",
    enSize: 16,
    arSize: 16,
    en: "Pack my box with five dozen liquor jugs.",
    ar: "يحب الأطفال اللعب في الحديقة كل صباح.",
    color: "var(--text-secondary)",
  },
  { name: "Caption", meta: "13 / 20 · 400", enSize: 13, arSize: 13, color: "var(--text-muted)" },
];

export function TypographyContent({ ws }: { ws: Workspace }) {
  const { setTypography, setFontAsset, addAsset, uiLang } = useApp();
  const { showToast } = useToast();
  const [editing, setEditing] = useState<"latin" | "arabic" | null>(null);
  const [draft, setDraft] = useState("");
  const [importing, setImporting] = useState<"latin" | "arabic" | null>(null);
  const [uploading, setUploading] = useState<"latin" | "arabic" | null>(null);

  const isAr = uiLang(ws) === "ar";
  const rowDir = isAr ? "rtl" : "ltr";
  const fontAssets = ws.assets.filter((a) => a.type === "font");

  /**
   * Imports a Google family and applies it in one action.
   *
   * The files land as ordinary font assets, so from here on an imported family
   * is indistinguishable from an uploaded one — same picker, same `@font-face`,
   * and it keeps working with no network because the binaries are embedded.
   * Only the regular weight is applied; the others are pulled in with it by
   * family name, which is what makes bold render as the real bold cut.
   */
  async function handleImport(script: "latin" | "arabic", family: string) {
    setImporting(script);
    try {
      const files = await importGoogleFont(family, script);
      const ids = files.map((f) =>
        addAsset(ws.id, {
          type: "font",
          fileName: f.fileName,
          url: f.dataUrl,
          sizeKB: f.sizeKB,
          tags: ["google-fonts", f.family],
          font: { family: f.family, weight: f.weight, style: f.style, source: "google" },
        })
      );
      const regular = files.findIndex((f) => f.weight === 400);
      setFontAsset(ws.id, script, ids[regular >= 0 ? regular : 0]);
      setTypography(ws.id, script === "latin" ? { latinFamily: family } : { arabicFamily: family });
      showToast(
        `Imported ${family} — ${files.length} weight${files.length === 1 ? "" : "s"}, applied across the guideline.`,
        "success"
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Couldn't import that font.", "danger");
    } finally {
      setImporting(null);
    }
  }

  /**
   * Uploads font files and applies the family in one action.
   *
   * Uploading used to be somewhere else entirely — Brand files — and this page
   * only told you to go there and come back, which is why importing from Google
   * felt like the only route that worked. Several files at once is the normal
   * case: a family is a regular and a bold, and applying one has to bring the
   * other with it or every semibold on the guideline is a browser fake.
   */
  async function handleUploadFont(script: "latin" | "arabic", files: FileList) {
    const list = Array.from(files).filter(isFontFile);
    const rejected = files.length - list.length;
    if (list.length === 0) {
      showToast(
        isAr
          ? "هذا ليس ملف خط — ‎.woff2 أو ‎.woff أو ‎.ttf أو ‎.otf."
          : "That isn't a font file — .woff2, .woff, .ttf or .otf.",
        "danger",
      );
      return;
    }
    setUploading(script);
    try {
      const added: { id: string; weight: number; family: string }[] = [];
      for (const file of list) {
        const meta = fontMetaFromFileName(file.name);
        const url = await fileToDataUrl(file);
        const id = addAsset(ws.id, {
          type: "font",
          fileName: file.name,
          url,
          sizeKB: file.size / 1024,
          tags: [meta.family],
          font: { ...meta, source: "upload" },
        });
        added.push({ id, weight: meta.weight, family: meta.family });
      }
      // The regular is what gets applied; its siblings come along by family
      // name, which is what makes a real bold render as the real bold.
      const regular = added.find((a) => a.weight === 400) ?? added[0];
      setFontAsset(ws.id, script, regular.id);
      setTypography(ws.id, script === "latin" ? { latinFamily: regular.family } : { arabicFamily: regular.family });
      showToast(
        `Applied ${regular.family} — ${added.length} file${added.length === 1 ? "" : "s"}` +
          (rejected > 0 ? `, ${rejected} skipped (not a font).` : "."),
        "success"
      );
    } catch {
      // fileToDataUrl is the only thing here that can fail, and it fails on a
      // file the browser couldn't read — worth saying rather than swallowing.
      showToast(
        isAr ? "تعذّرت قراءة هذا الملف. جرّب تصديره من جديد." : "Couldn't read that file. Try re-exporting it.",
        "danger",
      );
    } finally {
      setUploading(null);
    }
  }

  const scale = SCALE_META.map((row) =>
    row.name === "Display"
      ? { ...row, en: ws.name, ar: "هوية باتجاهين" }
      : row.name === "Caption"
      ? { ...row, en: `Updated ${formatRelative(ws.updatedAt)}`, ar: "تم التحديث مؤخرًا" }
      : row
  );

  function startEditing(field: "latin" | "arabic") {
    setEditing(field);
    setDraft(field === "latin" ? ws.typography.latinFamily : ws.typography.arabicFamily);
  }

  function commitEditing() {
    if (!editing) return;
    const value = draft.trim();
    if (value) {
      setTypography(ws.id, editing === "latin" ? { latinFamily: value } : { arabicFamily: value });
    }
    setEditing(null);
  }

  const latinAssetId = ws.typography.latinFontAssetId;
  const arabicAssetId = ws.typography.arabicFontAssetId;
  const {
    latin: latinFamily,
    arabic: arabicFamily,
    css: fontFaceCss,
    latinIsUploaded,
    arabicIsUploaded,
  } = brandFontStacks(ws);

  /** The weights real files exist for, for whichever family is applied. */
  function appliedWeights(assetId: string | undefined): number[] | undefined {
    const asset = assetId ? ws.assets.find((a) => a.id === assetId) : undefined;
    if (!asset) return undefined;
    return familyFiles(ws, asset)
      .map((f) => f.font?.weight)
      .filter((w): w is number => typeof w === "number")
      .sort((a, b) => a - b);
  }

  return (
    <div className="flex-1 min-h-0 px-7 py-6.5 flex flex-col gap-5 overflow-auto">
      {/* A plain <style>, not styled-jsx.
          `<style jsx global>{`${css}`}</style>` with a *fully dynamic* body
          compiles to nothing here, so the @font-face rules never reached the
          document: the specimen below was set in `mk-font-<id>`, a family that
          had never been declared, and the browser quietly fell back to the
          interface font. An imported Google family looked like it worked only
          because importing also rewrites the declared family name — the file
          itself was never loading either. The guideline site has always used a
          plain tag for exactly this (see BrandFonts); this now matches it. */}
      <style>{fontFaceCss}</style>

      {/* Wraps on a narrow window — see the note in BrandFilesContent. */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div className="min-w-[16rem] flex-1">
          <h1
            className="text-[30px] font-semibold tracking-tight mb-1.5"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {isAr ? "الخطوط" : "Typography"}
          </h1>
          <p dir="auto" className="bidi-auto text-[14px]" style={{ color: "var(--text-muted)" }}>
            {isAr
              ? "كتابتان، مقياس واحد. العربية تُصفّ بمقاييسها لا بمقاييس اللاتينية منقولة إليها. أفلِت ملفات خطوطك هنا أو استورد عائلة من Google Fonts أدناه؛ وما تطبّقه هنا يسري على موقع الدليل كله بالكتابتين."
              : "Two scripts, one scale. Arabic is set natively — never a transliteration of the Latin metrics. Drop in your own font files or import a family from Google Fonts below; whatever you apply here sets the whole guideline site, in both scripts."}
          </p>
        </div>
      </div>

      <div dir={rowDir} className="grid grid-cols-1 lg:grid-cols-2 gap-4 shrink-0">
        <div className="rounded-2xl p-[22px] flex flex-col gap-3.5" style={{ background: "var(--surface-1)" }}>
          <div className="flex items-center justify-between gap-2">
            <FamilyName
              value={ws.typography.latinFamily}
              editing={editing === "latin"}
              draft={draft}
              onDraftChange={setDraft}
              onStart={() => startEditing("latin")}
              onCommit={commitEditing}
            />
            <Tag>en-US · BODY</Tag>
          </div>
          <div dir="ltr" className="font-medium" style={{ fontSize: 76, lineHeight: 1, letterSpacing: "-.03em", fontFamily: latinFamily }}>
            Aa Bb
          </div>
          <div dir="ltr" className="text-[15px]" style={{ lineHeight: 1.55, color: "var(--text-secondary)", fontFamily: latinFamily }}>
            Brand governance for studios that ship in two directions.
          </div>
          <WeightChips
            suffix={
              latinIsUploaded
                ? isAr ? "أوزان حقيقية من العائلة المطبّقة" : "real weights from the applied family"
                : isAr ? "يعود إلى خط النظام" : "falls back to system font"
            }
            weights={appliedWeights(latinAssetId)}
          />
          <FontFilePicker
            assets={fontAssets}
            activeId={latinAssetId}
            isAr={isAr}
            onApply={(id) => setFontAsset(ws.id, "latin", id)}
            onClear={() => setFontAsset(ws.id, "latin", null)}
          />
          <FontSources
            script="latin"
            isAr={isAr}
            importing={importing === "latin"}
            uploading={uploading === "latin"}
            onImport={(family) => handleImport("latin", family)}
            onUpload={(files) => handleUploadFont("latin", files)}
          />
        </div>
        <div className="rounded-2xl p-[22px] flex flex-col gap-3.5" style={{ background: "var(--surface-1)" }}>
          <div className="flex items-center justify-between gap-2">
            <FamilyName
              value={ws.typography.arabicFamily}
              editing={editing === "arabic"}
              draft={draft}
              onDraftChange={setDraft}
              onStart={() => startEditing("arabic")}
              onCommit={commitEditing}
            />
            <Tag>ar-SA · BODY</Tag>
          </div>
          <div dir="rtl" style={{ fontFamily: arabicFamily, fontSize: 76, lineHeight: 1.1, fontWeight: 500 }}>
            أبجد
          </div>
          <div
            dir="rtl"
            className="text-[15px]"
            style={{ fontFamily: arabicFamily, lineHeight: 1.7, color: "var(--text-secondary)" }}
          >
            إدارة الهوية البصرية للاستوديوهات التي تعمل باتجاهين.
          </div>
          <WeightChips
            suffix={
              arabicIsUploaded
                ? isAr ? "أوزان حقيقية من العائلة المطبّقة" : "real weights from the applied family"
                : isAr ? "يعود إلى خط النظام" : "falls back to system font"
            }
            weights={appliedWeights(arabicAssetId)}
          />
          <FontFilePicker
            assets={fontAssets}
            activeId={arabicAssetId}
            isAr={isAr}
            onApply={(id) => setFontAsset(ws.id, "arabic", id)}
            onClear={() => setFontAsset(ws.id, "arabic", null)}
          />
          <FontSources
            script="arabic"
            isAr={isAr}
            importing={importing === "arabic"}
            uploading={uploading === "arabic"}
            onImport={(family) => handleImport("arabic", family)}
            onUpload={(files) => handleUploadFont("arabic", files)}
          />
        </div>
      </div>
      <p className="text-[12px] -mt-2" style={{ color: "var(--text-faint)" }}>
        Family names are read from the file name and are this workspace&apos;s own setting — click one
        to correct it. Until a file is applied, a name alone only asks the browser for its closest
        match.
      </p>

      <div className="flex-1 min-h-0 rounded-2xl flex flex-col overflow-hidden" style={{ background: "var(--surface-1)" }}>
        <div
          className="shrink-0 flex items-center justify-between px-5 py-3.5"
          style={{ boxShadow: "inset 0 -1px 0 var(--hairline)" }}
        >
          <span className="font-semibold text-[13px]">{isAr ? "مقياس الخط" : "Type scale"}</span>
          <span className="text-[11px]" style={{ fontFamily: "ui-monospace, Menlo, monospace", color: "var(--text-faint)" }}>
            4 steps · locked to 1.25 ratio
          </span>
        </div>
        <div dir={rowDir} className="flex-1 min-h-0 flex flex-col">
          {scale.map((row, i) => (
            <div
              key={row.name}
              className="flex-1 flex items-center gap-6 px-5"
              style={i < scale.length - 1 ? { boxShadow: "inset 0 -1px 0 var(--hairline)" } : undefined}
            >
              <div className="w-[150px] shrink-0">
                <div className="font-semibold text-[13px]">{row.name}</div>
                <div className="text-[11px]" style={{ fontFamily: "ui-monospace, Menlo, monospace", color: "var(--text-faint)" }}>
                  {row.meta}
                </div>
              </div>
              <div
                dir="ltr"
                className="flex-1 min-w-0 font-semibold truncate"
                style={{
                  fontSize: row.enSize,
                  letterSpacing: "-.02em",
                  fontFamily: row.name === "Display" || row.name === "Heading" ? "var(--font-display)" : latinFamily,
                  color: row.color,
                }}
              >
                {row.en}
              </div>
              <div
                dir="rtl"
                className="flex-1 min-w-0 font-semibold truncate"
                style={{
                  fontFamily: arabicFamily,
                  fontSize: row.arSize,
                  color: row.color,
                }}
              >
                {row.ar}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * The font files available to apply, grouped into families.
 *
 * A family imported with several weights is several assets, and listing them
 * as separate buttons would ask someone to pick between "Cairo-400.woff2" and
 * "Cairo-700.woff2" when the answer is "Cairo". One entry per family applies
 * the regular and brings its other weights with it.
 */
function FontFilePicker({
  assets,
  activeId,
  onApply,
  onClear,
  isAr,
}: {
  assets: Asset[];
  activeId?: string;
  onApply: (id: string) => void;
  onClear: () => void;
  isAr: boolean;
}) {
  if (assets.length === 0) {
    return (
      <span className="text-[11px]" style={{ color: "var(--text-faint)" }}>
        {isAr ? "لا ملفات خطوط بعد — أضف واحدًا أدناه." : "No font files yet — add one below."}
      </span>
    );
  }

  const families = new Map<string, Asset[]>();
  for (const asset of assets) {
    // A file uploaded before families existed carries no metadata, so it
    // stands alone under its own filename rather than being guessed into a
    // group it might not belong to.
    const key = asset.font?.family ?? `file:${asset.id}`;
    families.set(key, [...(families.get(key) ?? []), asset]);
  }

  return (
    <div className="flex gap-1.5 flex-wrap items-center">
      {[...families.entries()].map(([key, files]) => {
        const sorted = [...files].sort((a, b) => (a.font?.weight ?? 400) - (b.font?.weight ?? 400));
        const applyTarget = sorted.find((f) => f.font?.weight === 400) ?? sorted[0];
        const active = sorted.some((f) => f.id === activeId);
        const label = files[0].font?.family ?? files[0].fileName;
        const weights = sorted.map((f) => f.font?.weight).filter(Boolean);
        const totalKB = sorted.reduce((sum, f) => sum + f.sizeKB, 0);
        return (
          <button
            key={key}
            type="button"
            onClick={() => onApply(applyTarget.id)}
            title={`${label}${weights.length > 1 ? ` · ${weights.join(", ")}` : ""} · ${formatBytes(totalKB)}`}
            className="text-[11px] px-2.5 py-1.5 rounded-md cursor-pointer truncate max-w-[190px]"
            style={{
              fontFamily: "ui-monospace, Menlo, monospace",
              background: active ? "var(--accent-soft)" : "var(--surface-2)",
              // The accent is a fill; as small text on its own tint it lands
              // under the 7:1 bar that type this size carries.
              color: active ? "var(--accent-on-soft)" : "var(--text-muted)",
            }}
          >
            {label}
            {weights.length > 1 && (
              <span style={{ opacity: 0.6 }}> · {weights.length} {isAr ? "وزن" : "wt"}</span>
            )}
          </button>
        );
      })}
      {activeId && (
        <button type="button" onClick={onClear} className="text-[11px] px-2 py-1.5 cursor-pointer" style={{ color: "var(--text-faint)" }}>
          {isAr ? "إلغاء التطبيق" : "Clear"}
        </button>
      )}
    </div>
  );
}

/**
 * The two ways a family gets here: a file you own, or one from Google.
 *
 * Both sit on the card for the script they apply to, side by side and equally
 * weighted. Before this only the Google route had a control — uploading meant
 * navigating to Brand files, uploading, navigating back, and finding the file
 * in a picker — so in practice a studio's licensed foundry font was the harder
 * of the two to use, which is backwards.
 */
function FontSources({
  script,
  importing,
  uploading,
  onImport,
  onUpload,
  isAr,
}: {
  script: "latin" | "arabic";
  importing: boolean;
  uploading: boolean;
  onImport: (family: string) => void;
  onUpload: (files: FileList) => void;
  isAr: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const busy = importing || uploading;

  return (
    <div
      className="flex flex-col gap-2.5 rounded-xl transition-colors"
      onDragOver={(e) => {
        e.preventDefault();
        if (!dragOver) setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files?.length) onUpload(e.dataTransfer.files);
      }}
      style={dragOver ? { boxShadow: "inset 0 0 0 1.5px var(--accent)", background: "var(--accent-soft)" } : undefined}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={FONT_ACCEPT}
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) onUpload(e.target.files);
          // Cleared so re-picking the same file fires onChange again.
          e.target.value = "";
        }}
      />
      <div className="flex items-center gap-3 flex-wrap">
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="mk-tap gap-1.5 text-[11.5px] font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ color: "var(--accent-text)" }}
        >
          <Icon name={uploading ? "sync" : "upload"} size={12} className={uploading ? "animate-spin-quick origin-center" : undefined} />
          {uploading
            ? isAr ? "جارٍ التطبيق…" : "Applying…"
            : dragOver
              ? isAr ? "أفلِت للتطبيق" : "Drop to apply"
              : isAr ? "ارفع ملف خط" : "Upload a font file"}
        </button>
        <span className="text-[11px]" style={{ color: "var(--text-faint)" }}>
          {dragOver ? "" : isAr ? "أو" : "or"}
        </span>
        <GoogleFontImport script={script} busy={importing} onImport={onImport} isAr={isAr} />
      </div>
      <span dir="auto" className="bidi-auto text-[10.5px] leading-[1.5]" style={{ color: "var(--text-faint)" }}>
        {isAr
          ? "‎.woff2 أو ‎.woff أو ‎.ttf أو ‎.otf — أفلِت عدة ملفات دفعة واحدة لجلب عائلة كاملة بأوزانها الحقيقية. تُحفظ الملفات مع هذه العلامة وتُطبَّق فور وصولها."
          : ".woff2, .woff, .ttf or .otf — drop several at once to bring a whole family in with its real weights. Files are stored with this brand and applied the moment they land."}
      </span>
    </div>
  );
}

/**
 * Brings a family in from Google Fonts.
 *
 * The suggestions are a shortlist, not a catalogue — browsing the real one
 * needs Google's Developer API and a key this build has no honest way to
 * hold — so any family name can be typed instead, and the shortlist is only a
 * shortcut past the typing.
 */
function GoogleFontImport({
  script,
  busy,
  onImport,
  isAr,
}: {
  script: "latin" | "arabic";
  busy: boolean;
  onImport: (family: string) => void;
  isAr: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mk-tap gap-1.5 text-[11.5px] font-semibold cursor-pointer self-start"
        style={{ color: "var(--accent-text)" }}
      >
        <Icon name="download" size={12} />
        {isAr ? "استيراد من Google Fonts" : "Import from Google Fonts"}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5">
        <input
          dir="ltr"
          autoFocus
          value={value}
          disabled={busy}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && value.trim()) onImport(value.trim());
            if (e.key === "Escape") setOpen(false);
          }}
          placeholder={script === "arabic" ? "Cairo" : "Inter"}
          className="h-8 px-2.5 rounded-md outline-none text-[12px] flex-1 min-w-0"
          style={{ background: "var(--surface-2)", color: "var(--text)" }}
        />
        <button
          type="button"
          disabled={busy || !value.trim()}
          onClick={() => onImport(value.trim())}
          className="h-8 px-3 rounded-md text-[11.5px] font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          style={{ background: "var(--accent)", color: "var(--accent-ink)" }}
        >
          {busy ? (isAr ? "جارٍ الاستيراد…" : "Importing…") : isAr ? "استيراد" : "Import"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label={isAr ? "إلغاء" : "Cancel"}
          className="h-8 w-8 grid place-items-center cursor-pointer shrink-0"
          style={{ color: "var(--text-faint)" }}
        >
          <Icon name="times" size={12} />
        </button>
      </div>
      <div className="flex gap-1.5 flex-wrap">
        {SUGGESTED_FONTS[script].map((family) => (
          <button
            key={family}
            type="button"
            disabled={busy}
            onClick={() => {
              setValue(family);
              onImport(family);
            }}
            className="text-[11px] px-2 py-1 rounded-md cursor-pointer disabled:opacity-40"
            style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}
          >
            {family}
          </button>
        ))}
      </div>
      <span className="text-[10.5px] leading-[1.5]" style={{ color: "var(--text-faint)" }}>
        Any Google Fonts family name works — these are just shortcuts. The files are downloaded and
        stored with this brand, so the guideline renders them even offline.
      </span>
    </div>
  );
}

function FamilyName({
  value,
  editing,
  draft,
  onDraftChange,
  onStart,
  onCommit,
}: {
  value: string;
  editing: boolean;
  draft: string;
  onDraftChange: (v: string) => void;
  onStart: () => void;
  onCommit: () => void;
}) {
  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        aria-label="Font family name"
        onChange={(e) => onDraftChange(e.target.value)}
        onBlur={onCommit}
        onKeyDown={(e) => {
          if (e.key === "Enter") onCommit();
        }}
        className="font-semibold text-[13px] outline-none rounded-md px-2 py-1 -mx-2 -my-1"
        style={{ background: "var(--surface-2)", boxShadow: "inset 0 0 0 1px var(--accent-edge)", color: "var(--text)" }}
      />
    );
  }
  return (
    <button
      type="button"
      onClick={onStart}
      title={`Rename ${value}`}
      className="mk-tap gap-2 cursor-pointer text-start min-w-0"
    >
      <span className="font-semibold text-[13px] truncate">{value}</span>
      <Icon name="pen" size={12} style={{ color: "var(--text-faint)", flexShrink: 0 }} />
    </button>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="text-[10px] font-medium px-2 py-[5px] rounded-full"
      style={{ letterSpacing: ".08em", background: "var(--accent-soft)", color: "var(--accent-on-soft)" }}
    >
      {children}
    </span>
  );
}

/**
 * The weights this script can actually be set in.
 *
 * With a family applied these are the weights real files exist for; anything
 * else the browser fakes by smearing the nearest one, and listing five weights
 * for a two-weight family would promise type the guideline can't set.
 */
function WeightChips({ suffix, weights }: { suffix: string; weights?: number[] }) {
  const shown = weights && weights.length > 0 ? weights.map(String) : WEIGHTS;
  return (
    <div className="flex gap-1.5 flex-wrap">
      {shown.map((w) => (
        <span
          key={w}
          className="text-[11px] px-2.5 py-1.5 rounded-md"
          style={{ fontFamily: "ui-monospace, Menlo, monospace", background: "var(--surface-2)", color: "var(--text-muted)" }}
        >
          {w}
        </span>
      ))}
      <span
        className="text-[11px] px-2.5 py-1.5 rounded-md"
        style={{ fontFamily: "ui-monospace, Menlo, monospace", background: "var(--surface-2)", color: "var(--text-faint)" }}
      >
        {suffix}
      </span>
    </div>
  );
}
