"use client";

import { useRef, useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { useToast, useDialog, Icon } from "@/components/ui";
import { AssetThumb } from "@/components/ui/media";
import { EmptyHint } from "@/components/ui/composites/SectionUI";
import { AssetType, Workspace } from "@/types";
import { fileToDataUrl, formatBytes } from "@/lib/utils";
import { BulkBar, SelectBox, downloadFiles } from "./BulkBar";

/** One reusable upload/manage grid, reused for Patterns, Graphics,
 *  Illustrations, and Icons — each tab is just this component pinned to its
 *  own AssetType, filtering the same Workspace.assets array Brand files uses. */
export function AssetTypeGrid({
  ws,
  type,
  title,
  arTitle,
  hint,
}: {
  ws: Workspace;
  type: AssetType;
  title: string;
  arTitle: string;
  hint: string;
}) {
  const { addAsset, removeAsset, uiLang } = useApp();
  const { showToast } = useToast();
  const { confirm } = useDialog();
  const inputRef = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const isAr = uiLang(ws) === "ar";
  const items = ws.assets.filter((a) => a.type === type);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function bulkDownload() {
    const n = downloadFiles(items.filter((a) => selected.has(a.id)));
    showToast(isAr ? `تم تحميل ${n} ملفًا.` : `Downloaded ${n} file${n === 1 ? "" : "s"}.`, "success");
    setSelected(new Set());
  }

  async function bulkDelete() {
    const targets = items.filter((a) => selected.has(a.id));
    // Deleting several files at once can't be undone, so it's confirmed first.
    const ok = await confirm({
      title: isAr
        ? `حذف ${targets.length} ملفًا؟`
        : `Delete ${targets.length} file${targets.length === 1 ? "" : "s"}?`,
      body: isAr
        ? "تُحذف الملفات نهائيًا ولا يمكن استرجاعها."
        : "They're removed from this brand for good — there's no undo and no trash.",
      // The files are listed by name so this isn't a confirmation of a number:
      // a selection made two scrolls ago is worth reading back before it goes.
      consequences: [
        ...targets.slice(0, 6).map((a) => a.fileName),
        ...(targets.length > 6
          ? [isAr ? `و${targets.length - 6} ملفًا أخرى` : `and ${targets.length - 6} more`]
          : []),
      ],
      confirmLabel: isAr ? "حذف" : "Delete",
      tone: "danger",
      isAr,
    });
    if (!ok) return;
    for (const a of targets) removeAsset(ws.id, a.id);
    showToast(isAr ? `تم حذف ${targets.length} ملفًا.` : `Deleted ${targets.length} file${targets.length === 1 ? "" : "s"}.`, "success");
    setSelected(new Set());
  }

  async function handleUpload(files: FileList) {
    // Snapshot the list up front — the input's onChange resets e.target.value
    // right after calling this, which also clears this same live FileList
    // object while we're still mid-await, so re-reading `files.length` later
    // would report 0 even though the upload itself already succeeded.
    const list = Array.from(files);
    for (const file of list) {
      const url = await fileToDataUrl(file);
      addAsset(ws.id, { type, fileName: file.name, url, sizeKB: file.size / 1024, tags: [] });
    }
    showToast(`${list.length} file${list.length === 1 ? "" : "s"} uploaded.`, "success");
  }

  return (
    <div className="flex-1 min-h-0 px-7 py-6.5 flex flex-col gap-5 overflow-auto">
      {/* Wraps on a narrow window — see the note in BrandFilesContent. */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div className="min-w-[16rem] flex-1">
          <h1 className="text-[30px] font-semibold tracking-tight mb-1.5" style={{ fontFamily: "var(--font-display)" }}>
            {isAr ? arTitle : title}
          </h1>
          <p className="text-[14px] max-w-[62ch]" style={{ color: "var(--text-muted)" }}>
            {hint}
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*"
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
          {isAr ? "رفع ملف" : "Upload"}
        </button>
      </div>

      {selected.size > 0 && (
        <BulkBar
          count={selected.size}
          total={items.length}
          isAr={isAr}
          onSelectAll={() => setSelected(new Set(items.map((a) => a.id)))}
          onClear={() => setSelected(new Set())}
          onDownload={bulkDownload}
          onDelete={() => void bulkDelete()}
        />
      )}

      {items.length === 0 ? (
        <EmptyHint>{isAr ? "لا ملفات هنا بعد." : "Nothing here yet — upload one to get started."}</EmptyHint>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {items.map((a) => (
            <div
              key={a.id}
              onClick={() => toggle(a.id)}
              className="rounded-2xl overflow-hidden cursor-pointer"
              style={{
                background: "var(--surface-1)",
                // Surface step plus hairline — the same separation rule the
                // Brand files grid follows, for the same reason: on the light
                // theme the step alone is barely a step.
                boxShadow: selected.has(a.id)
                  ? "inset 0 0 0 2px var(--accent)"
                  : "inset 0 0 0 1px var(--hairline-strong)",
              }}
            >
              <div
                className="h-[100px] relative grid place-items-center"
                style={{ background: "var(--surface-2)", boxShadow: "inset 0 -1px 0 var(--hairline)" }}
              >
                {/* Measured against the well it sits in, not drawn on it and
                    hoped for. Patterns, graphics, illustrations and icons are
                    overwhelmingly single-colour files on transparency, and a
                    white one on the light theme's `--surface-2` is an empty
                    tile. It carries its own broken-file fallback, which is why
                    this grid no longer tracks one. See components/AssetThumb.tsx. */}
                <AssetThumb
                  src={a.url}
                  alt=""
                  ground="--surface-2"
                  adapt={type !== "photo"}
                  style={{ maxHeight: 56, maxWidth: "80%" }}
                />
                <span className="absolute top-2 start-2">
                  <SelectBox
                    checked={selected.has(a.id)}
                    onToggle={() => toggle(a.id)}
                    label={`Select ${a.fileName}`}
                  />
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeAsset(ws.id, a.id);
                  }}
                  aria-label={`Remove ${a.fileName}`}
                  className="absolute top-[3px] end-[3px] w-[28px] h-[28px] grid place-items-center cursor-pointer"
                >
                  {/* The 18px chip stays 18px; only the target around it grows.
                      A scrim over artwork, so it stays dark in both themes —
                      the thumbnail underneath is the brand's, not the app's.
                      The ring reads against the scrim, not against the page, so
                      it is drawn from the scrim's own ink token rather than a
                      white that happens to work in one theme. */}
                  <span
                    className="w-[18px] h-[18px] rounded-[5px] grid place-items-center"
                    style={{
                      background: "var(--scrim)",
                      boxShadow: "inset 0 0 0 1px color-mix(in srgb, var(--scrim-ink) 55%, transparent)",
                    }}
                  >
                    <Icon name="times" size={11} style={{ color: "var(--scrim-ink)" }} />
                  </span>
                </button>
              </div>
              <div className="p-2.5 flex flex-col gap-0.5">
                <span className="text-[11px] font-medium truncate">{a.fileName}</span>
                <span className="text-[10px] flex items-center gap-1.5" style={{ color: "var(--text-faint)" }}>
                  <span style={{ fontFamily: "ui-monospace, Menlo, monospace" }}>{formatBytes(a.sizeKB)}</span>
                  {/* Only the states that change what happens on publish are
                      called out; approved is the norm and needs no label. The
                      status itself is edited in Brand files, which is the one
                      screen that shows every file a brand owns. */}
                  {a.status !== "approved" && (
                    <span
                      className="px-1.5 py-[2px] rounded font-semibold"
                      style={{
                        background: a.status === "exploration" ? "var(--warning)" : "var(--surface-3)",
                        color: a.status === "exploration" ? "var(--status-ink)" : "var(--text-muted)",
                      }}
                    >
                      {a.status === "exploration" ? "Exploration" : "Archived"}
                    </span>
                  )}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
