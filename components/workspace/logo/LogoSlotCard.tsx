"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { BrandMark } from "@/components/BrandMark";
import { useTheme } from "@/components/ThemeProvider";
import { useApp } from "@/lib/store";
import { LogoSlot, SlotKind } from "@/lib/types";
import { fileToDataUrl, formatBytes } from "@/lib/utils";
import { validateFile } from "@/lib/logoUpload";

export function LogoSlotCard({
  workspaceId,
  kind,
  label,
  arLabel,
  tag,
  isAr,
  slot,
  onFileReady,
  selected,
  onSelect,
}: {
  workspaceId: string;
  kind: SlotKind;
  label: string;
  arLabel: string;
  tag: string;
  isAr: boolean;
  slot: LogoSlot;
  onFileReady: (kind: SlotKind, file: File) => void;
  selected: boolean;
  onSelect: (kind: SlotKind) => void;
}) {
  const { updateLogoSlot } = useApp();
  const { resolved } = useTheme();
  const inputRef = useRef<HTMLInputElement>(null);
  const lightInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [rejectMsg, setRejectMsg] = useState<string | null>(null);
  const runningRef = useRef(false);
  const rejectTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (slot.phase === "uploading" && !runningRef.current) {
      runningRef.current = true;
      let progress = slot.progress ?? 0;
      const id = window.setInterval(() => {
        progress += 8 + Math.random() * 16;
        if (progress < 90 && Math.random() < 0.045) {
          window.clearInterval(id);
          runningRef.current = false;
          updateLogoSlot(workspaceId, kind, {
            phase: "failed",
            progress: Math.round(progress),
            errorMessage: `Upload stopped at ${Math.round(progress)}%`,
          });
          return;
        }
        if (progress >= 100) {
          window.clearInterval(id);
          runningRef.current = false;
          updateLogoSlot(workspaceId, kind, {
            phase: "attached",
            progress: undefined,
            errorMessage: undefined,
          });
          return;
        }
        updateLogoSlot(workspaceId, kind, { progress: Math.round(progress) });
      }, 220);
      return () => window.clearInterval(id);
    }
    if (slot.phase !== "uploading") runningRef.current = false;
    // slot.progress is intentionally excluded: it's only read once, when a new
    // upload starts, so retriggering this effect on every tick would restart
    // the interval instead of letting it run to completion.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slot.phase, workspaceId, kind, updateLogoSlot]);

  function stage(file: File) {
    const result = validateFile(file);
    if (!result.ok) {
      setRejectMsg(result.reason);
      window.clearTimeout(rejectTimer.current);
      rejectTimer.current = window.setTimeout(() => setRejectMsg(null), 4000);
      return;
    }
    setRejectMsg(null);
    onFileReady(kind, file);
  }

  function openPicker() {
    inputRef.current?.click();
  }

  function remove(e: React.MouseEvent) {
    e.stopPropagation();
    updateLogoSlot(workspaceId, kind, {
      phase: "empty",
      fileName: undefined,
      fileSizeKB: undefined,
      format: undefined,
      url: undefined,
      width: undefined,
      height: undefined,
      progress: undefined,
      errorMessage: undefined,
      // The light version belongs to this lockup; it can't outlive it.
      lightUrl: undefined,
      lightFileName: undefined,
      lightSizeKB: undefined,
      lightFormat: undefined,
    });
  }

  /**
   * The light version attaches straight away rather than going through the
   * preview/clearspace modal: it's a colour variant of a lockup that has
   * already been measured, not a new lockup to measure.
   */
  async function stageLight(file: File) {
    const result = validateFile(file);
    if (!result.ok) {
      setRejectMsg(result.reason);
      window.clearTimeout(rejectTimer.current);
      rejectTimer.current = window.setTimeout(() => setRejectMsg(null), 4000);
      return;
    }
    setRejectMsg(null);
    const url = await fileToDataUrl(file);
    updateLogoSlot(workspaceId, kind, {
      lightUrl: url,
      lightFileName: file.name,
      lightSizeKB: file.size / 1024,
      lightFormat: file.name.split(".").pop()?.toLowerCase() === "png" ? "png" : "svg",
    });
  }

  function removeLight(e: React.MouseEvent) {
    e.stopPropagation();
    updateLogoSlot(workspaceId, kind, {
      lightUrl: undefined,
      lightFileName: undefined,
      lightSizeKB: undefined,
      lightFormat: undefined,
    });
  }

  const displayLabel = isAr ? arLabel : label;
  const isEmptyLike = slot.phase === "empty" && !rejectMsg;

  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-3 cursor-pointer transition-shadow"
      style={{
        background: kind === "symbol" && isEmptyLike ? "transparent" : "var(--surface-1)",
        boxShadow:
          kind === "symbol" && isEmptyLike
            ? "inset 0 0 0 1px var(--hairline-strong)"
            : selected
            ? "inset 0 0 0 1px var(--accent-edge)"
            : "none",
      }}
      onClick={() => slot.phase === "attached" && onSelect(kind)}
    >
      <div className="flex items-center gap-2">
        <span className="font-semibold text-[13px]">{displayLabel}</span>
        <span
          className="text-[10px] font-medium px-[7px] py-[5px] rounded-[5px]"
          style={{ background: "var(--surface-3)", color: "var(--text-muted)" }}
        >
          {tag}
        </span>
        {slot.phase === "attached" && (
          <>
            <Icon name="check-circle" size={15} style={{ color: "var(--success)" }} />
            <button
              type="button"
              onClick={remove}
              className="mk-icon-btn ms-auto cursor-pointer"
              aria-label="Remove"
            >
              <Icon name="ellipsis-h" size={16} style={{ color: "var(--text-muted)" }} />
            </button>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".svg,.png"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) stage(file);
          e.target.value = "";
        }}
      />

      {rejectMsg ? (
        <div
          className="h-[150px] rounded-[11px] flex flex-col items-center justify-center gap-2 px-4 text-center"
          style={{ background: "var(--surface-1)", boxShadow: "inset 0 0 0 1px var(--danger)" }}
          onClick={openPicker}
        >
          <Icon name="exclamation-circle" size={20} style={{ color: "var(--danger)" }} />
          <span className="text-[12px] font-medium leading-tight">{rejectMsg}</span>
          <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
            Try SVG or PNG, under 10 MB
          </span>
        </div>
      ) : slot.phase === "empty" ? (
        <div
          className="h-[150px] rounded-[11px] flex flex-col items-center justify-center gap-2 transition-colors"
          style={{
            background: dragOver ? "var(--accent-soft)" : "var(--surface-2)",
            boxShadow: dragOver
              ? "inset 0 0 0 1px var(--accent-edge)"
              : "inset 0 0 0 1px var(--hairline-strong)",
          }}
          onClick={openPicker}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files?.[0];
            if (file) stage(file);
          }}
        >
          <Icon
            name={dragOver ? "file-code" : "plus"}
            size={20}
            style={{ color: dragOver ? "var(--accent)" : "var(--text-muted)" }}
          />
          <span className="text-[12px] font-medium" style={{ color: dragOver ? "var(--text)" : "var(--text-secondary)" }}>
            {dragOver ? "Release to upload" : "Drop SVG or PNG"}
          </span>
          {!dragOver && (
            <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
              or click to browse · 10 MB max
            </span>
          )}
        </div>
      ) : slot.phase === "uploading" ? (
        <div
          className="h-[150px] rounded-[11px] flex flex-col items-center justify-center gap-3 p-3"
          style={{ background: "var(--surface-2)" }}
        >
          {slot.url && (
            <BrandMark src={slot.url} alt="" onDark={resolved === "dark"} style={{ maxWidth: 140, maxHeight: 64, opacity: 0.35 }} />
          )}
          <div className="w-full flex flex-col gap-1.5">
            <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--surface-1)" }}>
              <div
                className="h-full"
                style={{ width: `${slot.progress ?? 0}%`, background: "var(--accent)" }}
              />
            </div>
            <div
              className="flex justify-between text-[11px]"
              style={{ fontFamily: "ui-monospace, Menlo, monospace", color: "var(--text-muted)" }}
            >
              <span>Uploading to R2</span>
              <span>{slot.progress ?? 0}%</span>
            </div>
          </div>
        </div>
      ) : slot.phase === "failed" ? (
        <div
          className="h-[150px] rounded-[11px] flex flex-col items-center justify-center gap-2 px-4 text-center"
          style={{ background: "var(--surface-2)", boxShadow: "inset 0 0 0 1px var(--danger)" }}
        >
          <Icon name="undo" size={19} style={{ color: "var(--danger)" }} />
          <span className="text-[12px] font-medium">{slot.errorMessage}</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              updateLogoSlot(workspaceId, kind, { phase: "uploading", progress: 0, errorMessage: undefined });
            }}
            className="h-8 px-4 rounded-full text-[12px] font-semibold cursor-pointer"
            style={{ background: "var(--solid)", color: "var(--solid-ink)" }}
          >
            Retry
          </button>
        </div>
      ) : (
        <div
          className="h-[150px] rounded-[11px] relative grid place-items-center overflow-hidden"
          style={{ background: "var(--surface-2)" }}
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
        >
          {slot.url && (
            <BrandMark src={slot.url} alt="" onDark={resolved === "dark"} style={{ maxWidth: 140, maxHeight: 64, opacity: hovering ? 0.25 : 1 }} />
          )}
          <div
            className="absolute rounded-[3px] pointer-events-none"
            style={{
              inset: Math.round(20 + slot.clearspaceMultiplier * 20),
              border: "1px dashed var(--accent-edge)",
            }}
          />
          {hovering && (
            <div
              className="absolute inset-0 flex items-center justify-center gap-2"
              style={{ background: "var(--scrim)" }}
            >
              {/*
                These two sit on the scrim, not on the card, so they're coloured
                from the scrim's own ink rather than from the page's. On the
                light theme `--solid` is near-black and `--text` is near-black
                too, which put a black pill and black label on a dark overlay —
                both effectively invisible at the moment you're trying to
                replace or remove a lockup.
              */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openPicker();
                }}
                className="h-[34px] px-[15px] rounded-full text-[12px] font-semibold cursor-pointer"
                style={{ background: "var(--scrim-ink)", color: "#0b0b0d" }}
              >
                Replace
              </button>
              <button
                type="button"
                onClick={remove}
                className="h-[34px] px-[15px] rounded-full text-[12px] font-semibold cursor-pointer"
                style={{
                  background: "transparent",
                  color: "var(--scrim-ink)",
                  boxShadow: "inset 0 0 0 1px color-mix(in srgb, var(--scrim-ink) 45%, transparent)",
                }}
              >
                Remove
              </button>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col gap-1 text-[11px]" style={{ fontFamily: "ui-monospace, Menlo, monospace", color: "var(--text-muted)" }}>
        {slot.phase === "attached" ? (
          <>
            <span>
              {slot.fileName} · {slot.fileSizeKB ? formatBytes(slot.fileSizeKB) : ""}
            </span>
            <span style={{ color: "var(--accent-text)" }}>
              clearspace {slot.clearspaceMultiplier.toFixed(2).replace(/0$/, "")}× ={" "}
              {Math.round((slot.height ?? 0) * slot.clearspaceMultiplier)} px
            </span>
          </>
        ) : (
          <span>Used in the rail, favicon and small sizes.</span>
        )}
      </div>

      {slot.phase === "attached" && (
        <LightVersionStrip
          isAr={isAr}
          slot={slot}
          onPick={() => lightInputRef.current?.click()}
          onRemove={removeLight}
        />
      )}
      <input
        ref={lightInputRef}
        type="file"
        accept=".svg,.png"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void stageLight(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}

/**
 * Where a brand's white lockup goes.
 *
 * It sits inside the lockup's own card rather than in a fourth slot of its
 * own, because it is the same lockup in a different colour — and it previews
 * on a fixed dark ground regardless of the app's theme, since a dark ground is
 * the only place this file is ever used.
 */
function LightVersionStrip({
  isAr,
  slot,
  onPick,
  onRemove,
}: {
  isAr: boolean;
  slot: LogoSlot;
  onPick: () => void;
  onRemove: (e: React.MouseEvent) => void;
}) {
  const label = isAr ? "النسخة الفاتحة" : "Light version";
  const hint = isAr ? "للخلفيات الداكنة" : "for dark backgrounds";

  if (!slot.lightUrl) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onPick();
        }}
        className="h-[42px] rounded-[10px] flex items-center justify-center gap-2 text-[11.5px] font-medium cursor-pointer"
        style={{ boxShadow: "inset 0 0 0 1px var(--hairline-strong)", color: "var(--text-muted)" }}
        title={
          isAr
            ? "ارفع نسخة الشعار البيضاء بدلًا من ترك النظام يعكس الألوان"
            : "Upload the brand's white artwork instead of letting the app invert the colours"
        }
      >
        <Icon name="plus" size={12} />
        {isAr ? `أضف ${label} — ${hint}` : `Add ${label.toLowerCase()} — ${hint}`}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2.5 rounded-[10px] p-2" style={{ background: "var(--surface-2)" }}>
      <span
        className="w-[62px] h-[34px] rounded-[7px] grid place-items-center shrink-0 overflow-hidden"
        style={{ background: "#111114" }}
      >
        {/* Drawn raw: this file is already the reversed one, so measuring or
            inverting it would undo the studio's own choice. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={slot.lightUrl} alt="" style={{ maxWidth: 52, maxHeight: 26 }} />
      </span>
      <div className="flex flex-col min-w-0 flex-1">
        <span className="text-[11.5px] font-medium truncate">{label}</span>
        <span
          className="text-[10.5px] truncate"
          style={{ fontFamily: "ui-monospace, Menlo, monospace", color: "var(--text-faint)" }}
        >
          {slot.lightFileName}
          {slot.lightSizeKB ? ` · ${formatBytes(slot.lightSizeKB)}` : ""}
        </span>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onPick();
        }}
        className="text-[11px] font-semibold px-2.5 py-1.5 rounded-full cursor-pointer shrink-0"
        style={{ background: "var(--surface-3)", color: "var(--text-secondary)" }}
      >
        {isAr ? "استبدال" : "Replace"}
      </button>
      <button
        type="button"
        onClick={onRemove}
        aria-label={isAr ? "إزالة النسخة الفاتحة" : "Remove light version"}
        className="w-6 h-6 grid place-items-center rounded-full cursor-pointer shrink-0"
        style={{ color: "var(--text-faint)" }}
      >
        <Icon name="times" size={12} />
      </button>
    </div>
  );
}
