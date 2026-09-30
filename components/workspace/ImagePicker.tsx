"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { EmptyHint } from "@/components/workspace/SectionUI";
import { BrandMark } from "@/components/BrandMark";
import { useTheme } from "@/components/ThemeProvider";
import { useApp } from "@/lib/store";
import { useToast } from "@/components/Toast";
import { Asset, AssetType, Workspace } from "@/lib/types";
import { fileToDataUrl } from "@/lib/utils";
import {
  StockResult,
  StockSource,
  getUnsplashKey,
  importRemoteImage,
  pingUnsplashDownload,
  searchStock,
  setUnsplashKey,
  stockFileName,
} from "@/lib/stockImages";

const PICKABLE_TYPES: AssetType[] = ["photo", "icon", "mockup", "export", "pattern", "graphic", "illustration"];

type Tab = "library" | "upload" | "stock" | "link";

/**
 * Everything an image block needs to get an image into it, in one place:
 * the workspace's existing files, a direct upload, a free stock-library
 * search, and a pasted URL.
 *
 * Before this, a block could only point at something already uploaded on the
 * Assets page — so putting one photo on one section meant leaving the editor,
 * uploading, and coming back. Anything added here also lands in the workspace's
 * asset library, so it stays reusable rather than being trapped in this block.
 */
export function ImagePicker({
  ws,
  isAr,
  multiple,
  selectedIds,
  onChange,
}: {
  ws: Workspace;
  isAr: boolean;
  multiple: boolean;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const [tab, setTab] = useState<Tab>("library");

  /** Selects a newly-added asset — replacing for an image, appending for a gallery. */
  const select = useCallback(
    (assetId: string) => {
      onChange(multiple ? [...selectedIds, assetId] : [assetId]);
    },
    [multiple, selectedIds, onChange]
  );

  const tabs: { key: Tab; label: string; arLabel: string }[] = [
    { key: "library", label: "Library", arLabel: "المكتبة" },
    { key: "upload", label: "Upload", arLabel: "رفع" },
    { key: "stock", label: "Stock", arLabel: "صور مجانية" },
    { key: "link", label: "Link", arLabel: "رابط" },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex rounded-full p-0.5" style={{ background: "var(--surface-1)" }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className="flex-1 h-8 rounded-full text-[11px] font-semibold cursor-pointer"
            style={{
              background: tab === t.key ? "var(--surface-2)" : "transparent",
              color: tab === t.key ? "var(--text)" : "var(--text-faint)",
            }}
          >
            {isAr ? t.arLabel : t.label}
          </button>
        ))}
      </div>

      {tab === "library" && (
        <LibraryTab ws={ws} isAr={isAr} multiple={multiple} selectedIds={selectedIds} onChange={onChange} />
      )}
      {tab === "upload" && <UploadTab ws={ws} isAr={isAr} multiple={multiple} onAdded={select} />}
      {tab === "stock" && <StockTab ws={ws} isAr={isAr} onAdded={select} />}
      {tab === "link" && <LinkTab ws={ws} isAr={isAr} onAdded={select} />}
    </div>
  );
}

function Thumb({ asset }: { asset: Asset }) {
  const { resolved } = useTheme();
  return (
    <BrandMark
      src={asset.url}
      alt=""
      // These thumbnails sit in the app's own chrome, so they follow the
      // app's theme rather than the brand's.
      onDark={resolved === "dark"}
      fallbackSize={18}
      style={{ maxHeight: 34, maxWidth: "80%" }}
    />
  );
}

function LibraryTab({
  ws,
  isAr,
  multiple,
  selectedIds,
  onChange,
}: {
  ws: Workspace;
  isAr: boolean;
  multiple: boolean;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const assets = ws.assets.filter((a) => PICKABLE_TYPES.includes(a.type));

  if (assets.length === 0) {
    return (
      <EmptyHint>
        {isAr
          ? "لا توجد صور بعد — استخدم تبويب «رفع» أو «صور مجانية»."
          : "No images yet — use the Upload or Stock tab."}
      </EmptyHint>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {assets.map((a) => {
        const active = selectedIds.includes(a.id);
        return (
          <button
            key={a.id}
            type="button"
            title={a.fileName}
            onClick={() => {
              if (!multiple) onChange([a.id]);
              else onChange(active ? selectedIds.filter((x) => x !== a.id) : [...selectedIds, a.id]);
            }}
            className="rounded-lg overflow-hidden h-[56px] grid place-items-center cursor-pointer"
            style={{
              background: "var(--surface-1)",
              boxShadow: active ? "inset 0 0 0 2px var(--accent)" : "inset 0 0 0 1px transparent",
            }}
          >
            <Thumb asset={a} />
          </button>
        );
      })}
    </div>
  );
}

function UploadTab({
  ws,
  isAr,
  multiple,
  onAdded,
}: {
  ws: Workspace;
  isAr: boolean;
  multiple: boolean;
  onAdded: (assetId: string) => void;
}) {
  const { addAsset } = useApp();
  const { showToast } = useToast();
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const images = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (images.length === 0) {
      showToast(isAr ? "اختر ملف صورة." : "Pick an image file.", "danger");
      return;
    }
    setBusy(true);
    try {
      // Only the last one can be shown by a single-image block, so the others
      // would be uploaded and then silently dropped. Taking one keeps what the
      // asset library ends up holding honest about what was asked for.
      const chosen = multiple ? images : images.slice(0, 1);
      for (const file of chosen) {
        const url = await fileToDataUrl(file);
        const id = addAsset(ws.id, {
          type: "photo",
          fileName: file.name,
          url,
          sizeKB: file.size / 1024,
          tags: [],
        });
        onAdded(id);
      }
      showToast(
        isAr
          ? `تمت إضافة ${chosen.length} صورة إلى المكتبة.`
          : `Added ${chosen.length} image${chosen.length === 1 ? "" : "s"} to the library.`,
        "success"
      );
    } catch {
      showToast(isAr ? "تعذّرت قراءة الملف." : "Couldn't read that file.", "danger");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        hidden
        onChange={(e) => void handleFiles(e.target.files)}
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        className="h-[92px] rounded-xl grid place-items-center gap-1.5 cursor-pointer disabled:cursor-wait"
        style={{ border: "1px dashed var(--hairline-strong)", color: "var(--text-muted)" }}
      >
        <Icon name="upload" size={18} style={{ color: "var(--accent-text)" }} />
        <span className="text-[12px] font-medium">
          {busy ? (isAr ? "جارٍ الرفع…" : "Uploading…") : isAr ? "اختر صورة من جهازك" : "Choose an image"}
        </span>
      </button>
      <span className="text-[11px]" style={{ color: "var(--text-faint)" }}>
        {isAr
          ? "تُحفظ الصورة في مكتبة أصول المشروع، فيمكن إعادة استخدامها في أقسام أخرى."
          : "Saved to this workspace's asset library, so you can reuse it in other sections."}
      </span>
    </div>
  );
}

function LinkTab({ ws, isAr, onAdded }: { ws: Workspace; isAr: boolean; onAdded: (assetId: string) => void }) {
  const { addAsset } = useApp();
  const { showToast } = useToast();
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);

  async function add() {
    const trimmed = url.trim();
    if (!trimmed) return;
    let host: string;
    try {
      host = new URL(trimmed).hostname;
    } catch {
      showToast(isAr ? "هذا ليس رابطًا صالحًا." : "That isn't a valid URL.", "danger");
      return;
    }
    setBusy(true);
    const imported = await importRemoteImage(trimmed);
    setBusy(false);
    if (!imported.embedded && !/^https?:/i.test(trimmed)) {
      showToast(isAr ? "تعذّر تحميل الصورة." : "Couldn't load that image.", "danger");
      return;
    }
    const id = addAsset(ws.id, {
      type: "photo",
      fileName: stockFileName(decodeURIComponent(trimmed.split("/").pop() || "image").split("?")[0], host),
      url: imported.url,
      sizeKB: imported.sizeKB,
      tags: [],
      credit: { source: host, author: host, sourceUrl: trimmed, license: isAr ? "غير محدد" : "Not specified" },
    });
    onAdded(id);
    setUrl("");
    showToast(
      imported.embedded
        ? isAr
          ? "تمت إضافة الصورة إلى المكتبة."
          : "Image copied into the library."
        : isAr
          ? "أُضيفت الصورة كرابط خارجي — سيظهر المحتوى ما دام الموقع يستضيفه."
          : "Added as an external link — it renders while that host keeps serving it.",
      imported.embedded ? "success" : "default"
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        dir="ltr"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") void add();
        }}
        placeholder="https://…/photo.jpg"
        className="h-9 px-3 rounded-lg outline-none text-[12.5px]"
        style={{ background: "var(--surface-1)", color: "var(--text)" }}
      />
      <button
        type="button"
        disabled={busy || !url.trim()}
        onClick={() => void add()}
        className="h-9 rounded-full text-[12px] font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ background: "var(--surface-2)", color: "var(--text)" }}
      >
        {busy ? (isAr ? "جارٍ الجلب…" : "Fetching…") : isAr ? "إضافة الصورة" : "Add image"}
      </button>
      <span className="text-[11px]" style={{ color: "var(--text-faint)" }}>
        {isAr
          ? "الصق رابطًا مباشرًا لصورة من أي موقع. تأكد من أن الترخيص يسمح بالاستخدام التجاري."
          : "Paste a direct image link from any site. Check that its license allows commercial use."}
      </span>
    </div>
  );
}

function StockTab({ ws, isAr, onAdded }: { ws: Workspace; isAr: boolean; onAdded: (assetId: string) => void }) {
  const { addAsset } = useApp();
  const { showToast } = useToast();
  const [source, setSource] = useState<StockSource>("openverse");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StockResult[]>([]);
  const [status, setStatus] = useState<"idle" | "searching" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const [keyDraft, setKeyDraft] = useState("");
  const [hasKey, setHasKey] = useState(false);
  const [importing, setImporting] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // A one-time read of an external store (localStorage), which is the case
    // this rule exists to make an exception for: the key was saved by a past
    // session, so there is nothing to derive it from during render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasKey(!!getUnsplashKey());
  }, []);

  useEffect(() => () => abortRef.current?.abort(), []);

  /** A source switch invalidates the results on screen — leaving Openverse
   *  photos visible under an "Unsplash" tab would misattribute them. */
  function switchSource(next: StockSource) {
    if (next === source) return;
    abortRef.current?.abort();
    setSource(next);
    setResults([]);
    setStatus("idle");
    setError("");
  }

  async function run() {
    const q = query.trim();
    if (!q) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setStatus("searching");
    setError("");
    try {
      const found = await searchStock(source, q, controller.signal);
      setResults(found);
      setStatus("done");
    } catch (e) {
      if (controller.signal.aborted) return;
      setResults([]);
      setStatus("error");
      setError(e instanceof Error ? e.message : "Search failed.");
    }
  }

  async function take(r: StockResult) {
    setImporting(r.id);
    const imported = await importRemoteImage(r.fullUrl);
    pingUnsplashDownload(r);
    const id = addAsset(ws.id, {
      type: "photo",
      fileName: stockFileName(r.title, r.credit.source),
      url: imported.url,
      sizeKB: imported.sizeKB,
      tags: [r.credit.source.toLowerCase()],
      credit: r.credit,
    });
    onAdded(id);
    setImporting(null);
    showToast(
      isAr ? `تمت الإضافة — الحقوق: ${r.credit.author}` : `Added — credit: ${r.credit.author} (${r.credit.license})`,
      "success"
    );
  }

  const needsKey = source === "unsplash" && !hasKey;

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex rounded-full p-0.5" style={{ background: "var(--surface-1)" }}>
        {(["openverse", "unsplash"] as StockSource[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => switchSource(s)}
            className="flex-1 h-7 rounded-full text-[11px] font-semibold cursor-pointer capitalize"
            style={{
              background: source === s ? "var(--surface-2)" : "transparent",
              color: source === s ? "var(--text)" : "var(--text-faint)",
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {needsKey ? (
        <div className="flex flex-col gap-2">
          <span className="text-[11px] leading-[1.6]" style={{ color: "var(--text-faint)" }}>
            {isAr
              ? "يحتاج بحث Unsplash إلى مفتاح وصول مجاني خاص بك. أنشئه من unsplash.com/developers والصقه هنا — يُحفظ في هذا المتصفح فقط."
              : "Unsplash search needs your own free access key. Create one at unsplash.com/developers and paste it here — it's stored in this browser only."}
          </span>
          <input
            dir="ltr"
            value={keyDraft}
            onChange={(e) => setKeyDraft(e.target.value)}
            placeholder="Access Key"
            className="h-9 px-3 rounded-lg outline-none text-[12.5px]"
            style={{ background: "var(--surface-1)", color: "var(--text)" }}
          />
          <button
            type="button"
            disabled={!keyDraft.trim()}
            onClick={() => {
              setUnsplashKey(keyDraft);
              setHasKey(true);
              setKeyDraft("");
            }}
            className="h-9 rounded-full text-[12px] font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: "var(--surface-2)", color: "var(--text)" }}
          >
            {isAr ? "حفظ المفتاح" : "Save key"}
          </button>
        </div>
      ) : (
        <>
          <label className="flex items-center gap-2 h-9 px-3 rounded-full" style={{ background: "var(--surface-1)" }}>
            <Icon name="search" size={13} style={{ color: "var(--text-faint)" }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void run();
              }}
              placeholder={isAr ? "ابحث عن صور…" : "Search photos…"}
              className="bg-transparent outline-none text-[12px] flex-1 min-w-0"
              style={{ color: "var(--text)" }}
            />
          </label>

          {status === "searching" && (
            <span className="text-[11.5px]" style={{ color: "var(--text-faint)" }}>
              {isAr ? "جارٍ البحث…" : "Searching…"}
            </span>
          )}
          {status === "error" && (
            <span className="text-[11.5px]" style={{ color: "var(--danger)" }}>
              {error}
            </span>
          )}
          {status === "done" && results.length === 0 && (
            <EmptyHint>{isAr ? "لا توجد نتائج." : `No results for “${query.trim()}”.`}</EmptyHint>
          )}

          {results.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {results.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  disabled={!!importing}
                  title={`${r.title} — ${r.credit.author} (${r.credit.license})`}
                  onClick={() => void take(r)}
                  className="rounded-lg overflow-hidden h-[72px] cursor-pointer relative disabled:cursor-wait"
                  style={{ background: "var(--surface-1)" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={r.thumbUrl} alt={r.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  {importing === r.id && (
                    <span
                      className="absolute inset-0 grid place-items-center text-[10px] font-semibold"
                      style={{ background: "rgba(0,0,0,.6)", color: "#fff" }}
                    >
                      {isAr ? "جارٍ الإضافة…" : "Adding…"}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          <span className="text-[11px] leading-[1.6]" style={{ color: "var(--text-faint)" }}>
            {source === "openverse"
              ? isAr
                ? "نتائج Openverse مُفلترة على التراخيص التي تسمح بالاستخدام والتعديل التجاري. معظمها يشترط ذكر المصدر، ويُحفظ اسم المصوّر مع الصورة ويظهر أسفلها."
                : "Openverse results are filtered to licenses that allow commercial use and modification. Most still require attribution — the photographer's credit is stored with the image and shown beneath it."
              : isAr
                ? "ترخيص Unsplash يسمح بالاستخدام التجاري دون اشتراط ذكر المصدر، ومع ذلك يُحفظ اسم المصوّر."
                : "The Unsplash license allows commercial use with no attribution required; the photographer's credit is stored anyway."}
          </span>
        </>
      )}
    </div>
  );
}
