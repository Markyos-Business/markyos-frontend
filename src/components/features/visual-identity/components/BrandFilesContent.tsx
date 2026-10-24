"use client";

import { useMemo, useRef, useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { useModalDismiss } from "@/hooks/useModalDismiss";
import { useToast, useDialog, Icon } from "@/components/ui";
import { AssetThumb } from "@/components/ui/media/AssetThumb/AssetThumb";
import { EmptyHint } from "@/components/ui/composites/SectionUI/SectionUI";
import { Asset, AssetStatus, AssetType, SlotKind, Workspace } from "@/types";
import { fileToDataUrl, formatBytes, formatRelative } from "@/lib/utils";
import { fontMetaFromFileName, isFontFile } from "@/components/features/visual-identity/model/fontFile";
import { BulkBar, downloadFiles } from "./BulkBar";

const TYPE_META: Record<AssetType | "logo", { label: string; arLabel: string; icon: string }> = {
  logo: { label: "Logo", arLabel: "شعار", icon: "shapes" },
  photo: { label: "Photo", arLabel: "صورة", icon: "palette" },
  icon: { label: "Icon", arLabel: "أيقونة", icon: "shapes" },
  pattern: { label: "Pattern", arLabel: "نمط", icon: "shapes" },
  graphic: { label: "Graphic", arLabel: "رسم", icon: "shapes" },
  illustration: { label: "Illustration", arLabel: "رسم توضيحي", icon: "palette" },
  pdf: { label: "PDF", arLabel: "PDF", icon: "file-alt" },
  font: { label: "Font", arLabel: "خط", icon: "font" },
  mockup: { label: "Mockup", arLabel: "نموذج", icon: "file-code" },
  export: { label: "Export", arLabel: "تصدير", icon: "download" },
};

const IMAGE_TYPES = new Set<AssetType | "logo">(["photo", "icon", "export", "logo", "pattern", "graphic", "illustration"]);

/** Every type a file can be re-filed as — "logo" isn't one, it's a fixed slot. */
const EDITABLE_TYPES: AssetType[] = [
  "photo",
  "icon",
  "pattern",
  "graphic",
  "illustration",
  "mockup",
  "font",
  "pdf",
  "export",
];

function inferType(file: File): AssetType {
  const name = file.name.toLowerCase();
  if (file.type === "application/pdf" || name.endsWith(".pdf")) return "pdf";
  if (isFontFile(file)) return "font";
  if (name.includes("icon")) return "icon";
  if (file.type.startsWith("image/")) return "photo";
  return "export";
}

/**
 * Only approved files reach a published guideline, an export or a public
 * route — `publishGuideline` filters the snapshot on exactly this field. The
 * colours follow that meaning: exploration is a warning because it is the one
 * state that must never be handed to a client by accident.
 */
const STATUS_META: Record<AssetStatus, { label: string; arLabel: string; tone: "success" | "warning" | "neutral" }> = {
  approved: { label: "Approved", arLabel: "معتمد", tone: "success" },
  exploration: { label: "Exploration", arLabel: "استكشاف", tone: "warning" },
  archived: { label: "Archived", arLabel: "مؤرشف", tone: "neutral" },
};

type SortKey = "newest" | "oldest" | "name" | "largest";

const SORT_META: Record<SortKey, { label: string; arLabel: string }> = {
  newest: { label: "Newest", arLabel: "الأحدث" },
  oldest: { label: "Oldest", arLabel: "الأقدم" },
  name: { label: "Name", arLabel: "الاسم" },
  largest: { label: "Largest", arLabel: "الأكبر حجمًا" },
};

const SORTERS: Record<SortKey, (a: Row, b: Row) => number> = {
  newest: (a, b) => b.uploadedAt - a.uploadedAt,
  oldest: (a, b) => a.uploadedAt - b.uploadedAt,
  // Numeric so `logo-2.svg` sorts before `logo-10.svg`, and locale-aware so an
  // Arabic filename sorts by its own alphabet rather than by code point.
  name: (a, b) => a.fileName.localeCompare(b.fileName, undefined, { numeric: true, sensitivity: "base" }),
  largest: (a, b) => b.sizeKB - a.sizeKB,
};

interface Row {
  key: string;
  source: "manager" | "logo";
  type: AssetType | "logo";
  fileName: string;
  url?: string;
  sizeKB: number;
  tags: string[];
  uploadedAt: number;
  asset?: Asset;
}

export function BrandFilesContent({ ws, onManageLogo }: { ws: Workspace; onManageLogo: () => void }) {
  const { addAsset, removeAsset, setAssetTags, uiLang } = useApp();
  const { showToast } = useToast();
  const { confirm } = useDialog();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<AssetType | "logo" | "all">("all");
  const [statusFilter, setStatusFilter] = useState<AssetStatus | "all">("all");
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [detail, setDetail] = useState<Asset | null>(null);
  const [sort, setSort] = useState<SortKey>("newest");
  // Counts the nested dragenter/dragleave pairs the browser fires as the
  // pointer crosses child elements — a plain boolean flickers off the moment
  // the cursor moves over a card inside the drop zone.
  const [dragDepth, setDragDepth] = useState(0);

  const rows: Row[] = useMemo(() => {
    const logoRows: Row[] = (Object.keys(ws.logo) as SlotKind[])
      .filter((k) => ws.logo[k].phase === "attached")
      .map((k) => ({
        key: `logo-${k}`,
        source: "logo",
        type: "logo",
        fileName: ws.logo[k].fileName || k,
        url: ws.logo[k].url,
        sizeKB: ws.logo[k].fileSizeKB ?? 0,
        tags: [k],
        uploadedAt: ws.updatedAt,
      }));
    const managerRows: Row[] = ws.assets.map((a) => ({
      key: a.id,
      source: "manager",
      type: a.type,
      fileName: a.fileName,
      url: a.url,
      sizeKB: a.sizeKB,
      tags: a.tags,
      uploadedAt: a.uploadedAt,
      asset: a,
    }));
    return [...logoRows, ...managerRows].sort((a, b) => b.uploadedAt - a.uploadedAt);
  }, [ws]);

  const allTags = useMemo(() => [...new Set(rows.flatMap((r) => r.tags))].sort(), [rows]);

  /**
   * How many files each type and each status would give you.
   *
   * Counted against every filter *except the one being counted*, which is what
   * a facet count means: "Logo 2" answers "what happens if I press this",
   * not "how many logos exist in some other state".
   *
   * These exist because the row offered twelve type filters and two status
   * filters whatever the workspace held, and this workspace holds three kinds
   * of file. Eleven of those chips could only ever produce "No assets match" —
   * a control whose entire function is to empty the screen. Hick's Law charges
   * for every one of them, and each dead one also costs the trust that the
   * others are worth pressing.
   */
  const facets = useMemo(() => {
    const matchesText = (r: Row) => {
      const q = query.trim().toLowerCase();
      if (!q) return true;
      return r.fileName.toLowerCase().includes(q) || r.tags.some((t) => t.toLowerCase().includes(q));
    };
    const matchesTag = (r: Row) => !tagFilter || r.tags.includes(tagFilter);
    const matchesStatus = (r: Row) =>
      statusFilter === "all" || (!!r.asset && r.asset.status === statusFilter);
    const matchesType = (r: Row) => typeFilter === "all" || r.type === typeFilter;

    const byType = new Map<string, number>();
    const byStatus = new Map<string, number>();
    for (const r of rows) {
      if (matchesText(r) && matchesTag(r) && matchesStatus(r)) {
        byType.set(r.type, (byType.get(r.type) ?? 0) + 1);
      }
      if (matchesText(r) && matchesTag(r) && matchesType(r) && r.asset) {
        byStatus.set(r.asset.status, (byStatus.get(r.asset.status) ?? 0) + 1);
      }
    }
    return { byType, byStatus };
  }, [rows, query, tagFilter, statusFilter, typeFilter]);

  const filtered = rows
    .filter((r) => {
      if (typeFilter !== "all" && r.type !== typeFilter) return false;
      // The three fixed logo slots are not Assets and carry no status, so a
      // status filter simply doesn't apply to them — hiding them under
      // "Exploration" would imply the brand's own lockup might be provisional.
      if (statusFilter !== "all" && (!r.asset || r.asset.status !== statusFilter)) return false;
      if (tagFilter && !r.tags.includes(tagFilter)) return false;
      const q = query.trim().toLowerCase();
      // Tags are searched as well as filenames: people name a file
      // `export-final-2.png` and then tag it "hero", and the tag is the part
      // they remember.
      if (q && !r.fileName.toLowerCase().includes(q) && !r.tags.some((t) => t.toLowerCase().includes(q))) return false;
      return true;
    })
    .sort(SORTERS[sort]);

  const isAr = uiLang(ws) === "ar";

  function toggleSelect(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function handleUpload(files: FileList) {
    // Snapshot the list up front — the input's onChange resets e.target.value
    // right after calling this, which also clears this same live FileList
    // object while we're still mid-await, so re-reading `files.length` later
    // would report 0 even though the upload itself already succeeded.
    const list = Array.from(files);
    for (const file of list) {
      const url = await fileToDataUrl(file);
      const type = inferType(file);
      addAsset(ws.id, {
        type,
        fileName: file.name,
        url,
        sizeKB: file.size / 1024,
        tags: [],
        // Without this, every weight of a family uploaded as its own unrelated
        // entry and `font-weight: 600` was faked by the browser instead of
        // reaching the semibold file. See lib/fontFile.ts on why the name is
        // the source and why the studio can correct it.
        ...(type === "font"
          ? { font: { ...fontMetaFromFileName(file.name), source: "upload" as const } }
          : {}),
      });
    }
    showToast(
      isAr ? `تم رفع ${list.length} ملفًا.` : `${list.length} asset${list.length === 1 ? "" : "s"} uploaded.`,
      "success",
    );
  }

  function bulkDownload() {
    const n = downloadFiles(filtered.filter((r) => selected.has(r.key)));
    showToast(isAr ? `نُزّل ${n} ملفًا.` : `Downloaded ${n} file${n === 1 ? "" : "s"}.`, "success");
    setSelected(new Set());
  }

  async function bulkDelete() {
    // The three logo slots are managed on the Logo tab and aren't Assets
    // Manager rows, so they're skipped rather than silently failing to delete.
    const targets = filtered.filter((r) => selected.has(r.key) && r.source === "manager" && r.asset);
    const skipped = filtered.filter((r) => selected.has(r.key) && r.source !== "manager").length;
    const ok = await confirm({
      title: isAr
        ? `حذف ${targets.length} ملفًا؟`
        : `Delete ${targets.length} file${targets.length === 1 ? "" : "s"}?`,
      body: isAr
        ? "تُحذف من هذه العلامة نهائيًا — لا تراجع ولا سلة محذوفات."
        : "They're removed from this brand for good — there's no undo and no trash.",
      consequences: [
        ...targets.slice(0, 6).map((r) => r.asset!.fileName),
        ...(targets.length > 6
          ? [isAr ? `و${targets.length - 6} ملفًا أخرى` : `and ${targets.length - 6} more`]
          : []),
        ...(skipped > 0
          ? [
              isAr
                ? `${skipped} من خانات الشعار ضمن التحديد ستبقى — تُدار من تبويب الشعار`
                : `${skipped} logo slot${skipped === 1 ? "" : "s"} in the selection will be kept — manage those on the Logo system tab`,
            ]
          : []),
      ],
      confirmLabel: isAr ? "حذف" : "Delete",
      tone: "danger",
      isAr,
    });
    if (!ok) return;
    for (const r of targets) removeAsset(ws.id, r.asset!.id);
    showToast(
      isAr ? `حُذف ${targets.length} ملفًا.` : `Deleted ${targets.length} file${targets.length === 1 ? "" : "s"}.`,
      "success",
    );
    setSelected(new Set());
  }

  return (
    <div
      className="flex-1 min-h-0 px-7 py-6.5 flex flex-col gap-5 overflow-auto relative"
      // Dropping files anywhere on the page uploads them. The button stays,
      // because drag-and-drop is undiscoverable on its own and impossible with
      // a keyboard.
      onDragEnter={(e) => {
        if (!e.dataTransfer.types.includes("Files")) return;
        e.preventDefault();
        setDragDepth((d) => d + 1);
      }}
      onDragOver={(e) => {
        if (!e.dataTransfer.types.includes("Files")) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
      }}
      onDragLeave={() => setDragDepth((d) => Math.max(0, d - 1))}
      onDrop={(e) => {
        if (!e.dataTransfer.files?.length) return;
        e.preventDefault();
        setDragDepth(0);
        handleUpload(e.dataTransfer.files);
      }}
    >
      {dragDepth > 0 && (
        <div
          className="absolute inset-4 z-20 rounded-2xl grid place-items-center pointer-events-none animate-fade-in"
          style={{ background: "var(--accent-soft)", boxShadow: "inset 0 0 0 2px var(--accent)" }}
        >
          <span className="flex items-center gap-2.5 text-[14px] font-semibold" style={{ color: "var(--accent-text)" }}>
            <Icon name="upload" size={16} />
            {isAr ? "أفلِت للرفع" : "Drop to upload"}
          </span>
        </div>
      )}
      {/* Wraps on a narrow window. Fixed side by side, the paragraph was
          squeezed to about 150px on a phone — three words a line — while the
          Upload button sat beside it holding the rest. */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div className="min-w-[16rem] flex-1">
          <h1 className="text-[30px] font-semibold tracking-tight mb-1.5" style={{ fontFamily: "var(--font-display)" }}>
            {isAr ? "ملفات الهوية" : "Brand files"}
          </h1>
          <p dir="auto" className="bidi-auto text-[14px] max-w-[62ch]" style={{ color: "var(--text-muted)" }}>
            {isAr
              ? "كل ملف تملكه مساحة العمل هذه، في مكان واحد. كل تبويب آخر في الهوية البصرية — الشعار، الخطوط، الأنماط، الرسومات، الرسوم التوضيحية، الأيقونات — يشير إلى هذه الملفات بالمعرّف بدلًا من الاحتفاظ برفع خاص به."
              : "Every file this workspace owns, in one place. Every other Visual identity tab — Logo, Typography, Patterns, Graphics, Illustrations, Icons — references these by id rather than holding its own upload."}
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) handleUpload(e.target.files);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="h-9 px-4 rounded-full text-[13px] font-semibold cursor-pointer shrink-0"
          style={{ background: "var(--solid)", color: "var(--solid-ink)" }}
        >
          {isAr ? "رفع ملف" : "Upload asset"}
        </button>
      </div>

      <div className="flex items-center gap-2.5 flex-wrap">
        <label className="flex items-center gap-2 h-9 px-3.5 rounded-full min-w-[200px]" style={{ background: "var(--surface-1)" }}>
          <Icon name="search" size={14} style={{ color: "var(--text-muted)" }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={isAr ? "ابحث في الأسماء والوسوم" : "Search names and tags"}
            className="bg-transparent outline-none text-[12px] flex-1"
            style={{ color: "var(--text)" }}
          />
        </label>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          aria-label={isAr ? "ترتيب الملفات" : "Sort files"}
          className="h-9 px-3 rounded-full text-[12px] font-medium outline-none cursor-pointer shrink-0"
          style={{ background: "var(--surface-1)", color: "var(--text-muted)" }}
        >
          {(Object.keys(SORT_META) as SortKey[]).map((k) => (
            <option key={k} value={k}>
              {isAr ? SORT_META[k].arLabel : SORT_META[k].label}
            </option>
          ))}
        </select>
        <Chip label={isAr ? "الكل" : "All"} count={rows.length} active={typeFilter === "all"} onClick={() => setTypeFilter("all")} />
        {/* Only the types this workspace actually has — plus whichever one is
            selected, so pressing a chip can never make it vanish under the
            pointer. */}
        {(Object.keys(TYPE_META) as (AssetType | "logo")[])
          .filter((t) => (facets.byType.get(t) ?? 0) > 0 || typeFilter === t)
          .map((t) => (
            <Chip
              key={t}
              label={isAr ? TYPE_META[t].arLabel : TYPE_META[t].label}
              count={facets.byType.get(t) ?? 0}
              active={typeFilter === t}
              onClick={() => setTypeFilter(typeFilter === t ? "all" : t)}
            />
          ))}
        {(Object.keys(STATUS_META) as AssetStatus[]).some((s) => (facets.byStatus.get(s) ?? 0) > 0 || statusFilter === s) && (
          <span className="w-px h-5" style={{ background: "var(--hairline-strong)" }} />
        )}
        {(Object.keys(STATUS_META) as AssetStatus[])
          .filter((s) => (facets.byStatus.get(s) ?? 0) > 0 || statusFilter === s)
          .map((s) => (
            <Chip
              key={s}
              label={isAr ? STATUS_META[s].arLabel : STATUS_META[s].label}
              count={facets.byStatus.get(s) ?? 0}
              active={statusFilter === s}
              onClick={() => setStatusFilter(statusFilter === s ? "all" : s)}
            />
          ))}
        {allTags.length > 0 && (
          <>
            <span className="w-px h-5" style={{ background: "var(--hairline-strong)" }} />
            {allTags.map((tag) => (
              <Chip key={tag} label={`#${tag}`} active={tagFilter === tag} onClick={() => setTagFilter(tagFilter === tag ? null : tag)} />
            ))}
          </>
        )}
      </div>

      {selected.size > 0 && (
        <BulkBar
          count={selected.size}
          total={filtered.length}
          isAr={isAr}
          onSelectAll={() => setSelected(new Set(filtered.map((r) => r.key)))}
          onClear={() => setSelected(new Set())}
          onDownload={bulkDownload}
          onDelete={() => void bulkDelete()}
        />
      )}

      {/*
       * Two different empty screens, which used to share one sentence.
       *
       * "No assets match. Upload something, or clear the filters." was shown to
       * a workspace with nothing in it at all — where there are no filters to
       * clear, and being told to clear them sends somebody hunting for a
       * control that is not there. A message has to diagnose the state it is
       * actually in; the one below says which of the two this is, and the
       * filtered one carries the way out rather than describing it.
       */}
      {filtered.length === 0 && rows.length === 0 ? (
        <EmptyHint>
          {isAr
            ? "لا شيء هنا بعد. ارفع ملفات الشعار والخطوط والصور وملفات التصدير التي تملكها هذه العلامة — كل تبويب آخر في الهوية البصرية يقرأ من هنا."
            : "Nothing here yet. Upload the logo files, fonts, photography and exports this brand owns — every other Visual identity tab reads from this one."}
        </EmptyHint>
      ) : filtered.length === 0 ? (
        <div className="flex items-center gap-3 flex-wrap">
          <EmptyHint>{isAr ? "لا ملف يطابق هذه المرشحات." : "No file matches these filters."}</EmptyHint>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setTypeFilter("all");
              setStatusFilter("all");
              setTagFilter(null);
            }}
            className="mk-tap shrink-0 rounded-full px-3.5 h-8 text-[12px] font-semibold cursor-pointer"
            style={{ background: "var(--surface-2)", color: "var(--text)" }}
          >
            {isAr ? "امسح المرشحات" : "Clear filters"}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {filtered.map((r) => (
            <div
              key={r.key}
              className="rounded-2xl overflow-hidden"
              /*
               * Surface step *and* hairline, which is the separation rule this
               * design system states. On the light theme the step alone is
               * #ffffff on #eeeef2 — a difference you have to look for — so a
               * grid of files read as one pale slab with no edges, and the
               * thumbnail well inside it was invisible against its own card.
               */
              style={{ background: "var(--surface-1)", boxShadow: "inset 0 0 0 1px var(--hairline-strong)" }}
            >
              <div
                className="h-[110px] relative grid place-items-center"
                style={{ background: "var(--surface-2)", boxShadow: "inset 0 -1px 0 var(--hairline)" }}
              >
                {IMAGE_TYPES.has(r.type) && r.url ? (
                  // Measured against `--surface-2` — the well it is actually
                  // drawn in — rather than against "is the theme dark". Those
                  // are different grounds, and the thumbnail is the only way to
                  // tell two files apart here.
                  <AssetThumb
                    src={r.url}
                    alt=""
                    ground="--surface-2"
                    adapt={r.type !== "photo"}
                    style={{ maxHeight: 64, maxWidth: "80%" }}
                  />
                ) : (
                  <Icon name={TYPE_META[r.type].icon} size={26} style={{ color: "var(--text-faint)" }} />
                )}
                {/* The box stays 18px; the button around it is 28, so the
                    target is comfortable without the tick growing into the
                    thumbnail it sits on. */}
                <button
                  type="button"
                  onClick={() => toggleSelect(r.key)}
                  aria-label={`Select ${r.fileName}`}
                  aria-pressed={selected.has(r.key)}
                  className="absolute top-[5px] start-[5px] w-[28px] h-[28px] grid place-items-center cursor-pointer"
                >
                  <span
                    className="w-[18px] h-[18px] rounded-[5px] grid place-items-center"
                    style={{
                      background: selected.has(r.key) ? "var(--accent)" : "var(--scrim)",
                      boxShadow: selected.has(r.key)
                        ? "none"
                        : "inset 0 0 0 1px color-mix(in srgb, var(--scrim-ink) 55%, transparent)",
                    }}
                  >
                    {selected.has(r.key) && <Icon name="check" size={12} style={{ color: "var(--accent-ink)" }} />}
                  </span>
                </button>
                {/* Approved is the norm and needs no badge; the two states that
                    change what happens to a file on publish do. Marked
                    aria-hidden because the same word is announced as part of
                    the details button's label below, and hearing it twice per
                    card makes a grid of files tedious to listen through. */}
                {r.asset && r.asset.status !== "approved" && (
                  <span
                    aria-hidden="true"
                    className="absolute top-[7px] end-[7px] text-[9px] font-semibold px-1.5 py-[3px] rounded"
                    style={{
                      background: r.asset.status === "exploration" ? "var(--warning)" : "var(--surface-3)",
                      color: r.asset.status === "exploration" ? "var(--status-ink)" : "var(--text-muted)",
                    }}
                  >
                    {isAr ? STATUS_META[r.asset.status].arLabel : STATUS_META[r.asset.status].label}
                  </span>
                )}
              </div>
              <div className="p-3 flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-[12px] font-medium truncate">{r.fileName}</span>
                  {r.source === "manager" && r.asset && (
                    <button
                      type="button"
                      onClick={() => setDetail(r.asset!)}
                      aria-label={
                        isAr
                          ? `تفاصيل ${r.fileName} — ${STATUS_META[r.asset.status].arLabel}`
                          : `Details for ${r.fileName} — ${STATUS_META[r.asset.status].label}`
                      }
                      className="mk-icon-btn cursor-pointer shrink-0"
                    >
                      <Icon name="ellipsis-h" size={13} style={{ color: "var(--text-faint)" }} />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[9px] font-semibold px-1.5 py-[3px] rounded" style={{ background: "var(--surface-2)", color: "var(--text-faint)" }}>
                    {TYPE_META[r.type].label.toUpperCase()}
                  </span>
                  <span className="text-[10px]" style={{ fontFamily: "ui-monospace, Menlo, monospace", color: "var(--text-faint)" }}>
                    {formatBytes(r.sizeKB)}
                  </span>
                </div>
                {r.source === "logo" && (
                  <button type="button" onClick={onManageLogo} className="mk-tap text-[10px] text-start cursor-pointer" style={{ color: "var(--accent-text)" }}>
                    {isAr ? "الإدارة من تبويب الشعار" : "Manage on Logo system"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {detail && (
        <AssetDetailModal
          workspaceId={ws.id}
          asset={detail}
          isAr={isAr}
          onClose={() => setDetail(null)}
          onDelete={() => {
            removeAsset(ws.id, detail.id);
            setDetail(null);
            showToast(isAr ? "حُذف الملف." : "Asset deleted.");
          }}
          onTagsChange={(tags) => {
            setAssetTags(ws.id, detail.id, tags);
            setDetail({ ...detail, tags });
          }}
          onTypeChange={(type) => setDetail({ ...detail, type })}
          onStatusChange={(status) => setDetail({ ...detail, status })}
        />
      )}
    </div>
  );
}

/**
 * A filter, with what it will give you.
 *
 * The count is the whole point: a chip that says "Pattern" is a question, and
 * a chip that says "Pattern 4" is an answer. `aria-pressed` because these are
 * toggles, which a screen reader could not otherwise tell from links.
 */
function Chip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="h-8 px-3 rounded-full text-[11px] font-semibold cursor-pointer shrink-0 flex items-center gap-1.5"
      style={{ background: active ? "var(--accent-soft)" : "var(--surface-1)", color: active ? "var(--accent-on-soft)" : "var(--text-muted)" }}
    >
      {/* Resolved against its own first strong character, so a tag chip's
          leading `#` — a neutral — stays on the tag rather than flipping to
          the far end inside an Arabic page. */}
      <span dir="auto" className="bidi-auto">{label}</span>
      {count !== undefined && (
        <span
          className="tabular-nums font-medium"
          style={{ fontFamily: "ui-monospace, Menlo, monospace", opacity: 0.65 }}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function AssetDetailModal({
  workspaceId,
  asset,
  onClose,
  onDelete,
  onTagsChange,
  onTypeChange,
  onStatusChange,
  isAr,
}: {
  workspaceId: string;
  asset: Asset;
  onClose: () => void;
  onDelete: () => void;
  onTagsChange: (tags: string[]) => void;
  onTypeChange: (type: AssetType) => void;
  onStatusChange: (status: AssetStatus) => void;
  isAr: boolean;
}) {
  const { addAssetVersion, restoreAssetVersion, setAssetStatus, setAssetType, renameAsset } = useApp();
  const { showToast } = useToast();
  const [tagInput, setTagInput] = useState("");
  const [name, setName] = useState(asset.fileName);
  const versionInputRef = useRef<HTMLInputElement>(null);
  useModalDismiss(onClose);

  function addTag() {
    const tag = tagInput.trim();
    if (!tag || asset.tags.includes(tag)) return;
    onTagsChange([...asset.tags, tag]);
    setTagInput("");
  }

  function commitName() {
    const next = name.trim();
    if (!next || next === asset.fileName) {
      setName(asset.fileName);
      return;
    }
    renameAsset(workspaceId, asset.id, next);
    showToast(isAr ? "أُعيدت التسمية." : "Renamed.", "success");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-8" style={{ background: "var(--scrim)" }} onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={isAr ? `تفاصيل ${asset.fileName}` : `Details for ${asset.fileName}`}
        className="w-full max-w-[440px] rounded-2xl p-6 flex flex-col gap-4 animate-pop max-h-[86vh] overflow-y-auto"
        style={{ background: "var(--canvas)", boxShadow: "0 0 0 1px var(--hairline-strong)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2">
          <input
            value={name}
            dir="auto"
            aria-label={isAr ? "اسم الملف" : "File name"}
            onChange={(e) => setName(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
              if (e.key === "Escape") setName(asset.fileName);
            }}
            className="bidi-auto flex-1 min-w-0 text-[16px] font-semibold outline-none rounded-md px-2 py-1 -mx-2"
            style={{ background: "transparent", color: "var(--text)" }}
          />
          <button type="button" onClick={onClose} aria-label={isAr ? "إغلاق" : "Close"} className="mk-icon-btn cursor-pointer shrink-0">
            <Icon name="times" size={18} style={{ color: "var(--text-muted)" }} />
          </button>
        </div>

        {/* Status decides whether this file can leave the studio at all.
            Publishing copies only approved assets into the snapshot that
            `/v/<slug>` serves, so moving something to Exploration removes it
            from the client's guideline at the next publish — which is the
            point, and worth saying plainly rather than leaving to be
            discovered. */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-medium uppercase" style={{ letterSpacing: ".08em", color: "var(--text-faint)" }}>
            {isAr ? "الحالة" : "Status"}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(STATUS_META) as AssetStatus[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  if (s === asset.status) return;
                  setAssetStatus(workspaceId, asset.id, s);
                  onStatusChange(s);
                  showToast(
                    s === "approved"
                      ? isAr
                        ? "معتمد — يمكن نشر هذا الملف."
                        : "Approved — this file can be published."
                      : isAr
                        ? `نُقل إلى ${STATUS_META[s].arLabel} — لن يُنشر.`
                        : `Moved to ${STATUS_META[s].label.toLowerCase()} — it won't be published.`,
                    s === "approved" ? "success" : undefined,
                  );
                }}
                aria-pressed={asset.status === s}
                className="text-[11px] px-2.5 py-1.5 rounded-md cursor-pointer"
                style={{
                  background: asset.status === s ? "var(--accent-soft)" : "var(--surface-2)",
                  color: asset.status === s ? "var(--accent-on-soft)" : "var(--text-muted)",
                }}
              >
                {isAr ? STATUS_META[s].arLabel : STATUS_META[s].label}
              </button>
            ))}
          </div>
          <span dir="auto" className="bidi-auto text-[11px]" style={{ color: "var(--text-faint)" }}>
            {asset.status === "approved"
              ? isAr
                ? "يُدرَج عند نشر هذا الدليل."
                : "Included when this guideline is published."
              : isAr
                ? "يُستثنى من الدليل المنشور ومن ملفات التصدير وروابط المشاركة."
                : "Left out of the published guideline, exports and share links."}
          </span>
        </div>

        {/* The type decides which Visual identity tab and which guideline
            section this file appears in, so a wrong guess from the uploader
            has to be correctable — otherwise a pattern filed as "export" is
            invisible everywhere it matters. */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-medium uppercase" style={{ letterSpacing: ".08em", color: "var(--text-faint)" }}>
            {isAr ? "النوع" : "Type"}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {EDITABLE_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  if (t === asset.type) return;
                  setAssetType(workspaceId, asset.id, t);
                  onTypeChange(t);
                  showToast(
                    isAr ? `صُنّف كـ${TYPE_META[t].arLabel}.` : `Filed as ${TYPE_META[t].label}.`,
                    "success",
                  );
                }}
                className="text-[11px] px-2.5 py-1.5 rounded-md cursor-pointer flex items-center gap-1.5"
                style={{
                  background: asset.type === t ? "var(--accent-soft)" : "var(--surface-2)",
                  // `--accent-on-soft`, not `--accent`: the accent is a fill,
                  // and as 11px text on its own tint it measured 5.72:1 dark
                  // and 4.58:1 light, under the 7:1 bar this size carries.
                  color: asset.type === t ? "var(--accent-on-soft)" : "var(--text-muted)",
                }}
              >
                <Icon name={TYPE_META[t].icon} size={11} />
                {isAr ? TYPE_META[t].arLabel : TYPE_META[t].label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-medium uppercase" style={{ letterSpacing: ".08em", color: "var(--text-faint)" }}>{isAr ? "الوسوم" : "Tags"}</span>
          <div className="flex flex-wrap gap-1.5">
            {asset.tags.map((t) => (
              <span key={t} className="text-[11px] px-2 py-1 rounded-full flex items-center gap-1" style={{ background: "var(--surface-2)", color: "var(--text-secondary)" }}>
                {/* `dir="auto"` keeps the hash on the tag. It is a neutral
                    character, so inside an Arabic page it takes the paragraph's
                    direction and lands on the wrong end — "#export" painting as
                    "export#". Resolved against the tag's own first strong
                    character instead, a Latin tag stays a Latin token and an
                    Arabic one reads right-to-left as it should. */}
                <span dir="auto" className="bidi-auto">#{t}</span>
                <button type="button" onClick={() => onTagsChange(asset.tags.filter((x) => x !== t))} className="mk-icon-btn mk-danger-hover cursor-pointer" aria-label={isAr ? `أزل ${t}` : `Remove ${t}`}>
                  <Icon name="times" size={9} />
                </button>
              </span>
            ))}
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
              placeholder={isAr ? "أضف وسمًا…" : "add a tag…"}
              aria-label={isAr ? "أضف وسمًا" : "Add a tag"}
              className="text-[11px] px-2 py-1 rounded-full outline-none w-[100px]"
              style={{ background: "var(--surface-2)", color: "var(--text)" }}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase" style={{ letterSpacing: ".08em", color: "var(--text-faint)" }}>{isAr ? "سجل الإصدارات" : "Version history"}</span>
            <input
              ref={versionInputRef}
              type="file"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const url = await fileToDataUrl(file);
                  addAssetVersion(workspaceId, asset.id, { url, fileName: file.name, sizeKB: file.size / 1024 });
                  showToast(isAr ? "رُفع إصدار جديد." : "New version uploaded.", "success");
                  onClose();
                }
                e.target.value = "";
              }}
            />
            <button type="button" onClick={() => versionInputRef.current?.click()} className="mk-tap text-[11px] font-semibold cursor-pointer" style={{ color: "var(--accent-text)" }}>
              {isAr ? "رفع إصدار جديد" : "Upload new version"}
            </button>
          </div>
          {asset.versions.length === 0 ? (
            <span className="text-[12px]" style={{ color: "var(--text-faint)" }}>
              {isAr ? "الإصدار الحالي فقط — لا سجل بعد." : "Current version only — no history yet."}
            </span>
          ) : (
            <div className="flex flex-col gap-1.5">
              {asset.versions.map((v) => (
                <div key={v.id} className="flex items-center justify-between text-[12px] rounded-lg px-2.5 py-2" style={{ background: "var(--surface-2)" }}>
                  <span className="truncate" style={{ color: "var(--text-secondary)" }}>{v.fileName}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span style={{ color: "var(--text-faint)" }}>{formatRelative(v.createdAt)}</span>
                    <button
                      type="button"
                      onClick={() => {
                        restoreAssetVersion(workspaceId, asset.id, v.id);
                        showToast(isAr ? "استُعيد الإصدار." : "Version restored.", "success");
                        onClose();
                      }}
                      className="font-semibold cursor-pointer"
                      style={{ color: "var(--accent-text)" }}
                    >
                      {isAr ? "استعادة" : "Restore"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <button type="button" onClick={onDelete} className="h-10 rounded-full text-[13px] font-semibold cursor-pointer mt-1" style={{ color: "var(--danger)" }}>
          {isAr ? "حذف الملف" : "Delete asset"}
        </button>
      </div>
    </div>
  );
}
