"use client";

import { Icon } from "@/components/Icon";

/**
 * Shared selection bar for the asset surfaces. Brand files and each of the
 * Patterns/Graphics/Illustrations/Icons grids all manage the same Workspace
 * assets, so they get the same select-all / download / delete affordances
 * rather than each growing its own slightly different version.
 */
export function BulkBar({
  count,
  total,
  isAr,
  onSelectAll,
  onClear,
  onDownload,
  onDelete,
}: {
  count: number;
  total: number;
  isAr: boolean;
  onSelectAll: () => void;
  onClear: () => void;
  onDownload: () => void;
  onDelete: () => void;
}) {
  const allSelected = count > 0 && count === total;
  return (
    <div
      className="rounded-xl px-4 h-11 flex items-center gap-4 shrink-0"
      style={{ background: "var(--accent-soft)", boxShadow: "inset 0 0 0 1px var(--accent-ring)" }}
    >
      <span className="text-[12px] font-semibold" style={{ color: "var(--accent-text)" }}>
        {isAr ? `${count} محدد` : `${count} selected`}
      </span>
      <button
        type="button"
        onClick={allSelected ? onClear : onSelectAll}
        className="text-[12px] font-medium cursor-pointer"
        style={{ color: "var(--text-secondary)" }}
      >
        {allSelected ? (isAr ? "إلغاء التحديد" : "Deselect all") : isAr ? `تحديد الكل (${total})` : `Select all (${total})`}
      </button>
      <span className="ms-auto flex items-center gap-3.5">
        <button
          type="button"
          onClick={onDownload}
          className="text-[12px] font-semibold cursor-pointer flex items-center gap-1.5"
          style={{ color: "var(--accent-text)" }}
        >
          <Icon name="download" size={12} />
          {isAr ? "تحميل" : "Download"}
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="text-[12px] font-semibold cursor-pointer flex items-center gap-1.5"
          style={{ color: "var(--danger)" }}
        >
          <Icon name="times" size={12} />
          {isAr ? "حذف" : "Delete"}
        </button>
        <button
          type="button"
          onClick={onClear}
          aria-label={isAr ? "إلغاء التحديد" : "Clear selection"}
          className="mk-icon-btn cursor-pointer"
        >
          <Icon name="times" size={13} style={{ color: "var(--text-faint)" }} />
        </button>
      </span>
    </div>
  );
}

/** Triggers a real browser download for each file, in order. */
export function downloadFiles(files: { url?: string; fileName: string }[]): number {
  const targets = files.filter((f) => !!f.url);
  for (const f of targets) {
    const a = document.createElement("a");
    a.href = f.url!;
    a.download = f.fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
  return targets.length;
}

/** A checkbox that sits over an asset thumbnail. */
export function SelectBox({ checked, onToggle, label }: { checked: boolean; onToggle: () => void; label: string }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      // The tick stays 18px and the target around it is 28. Growing the chip
      // itself would put a bigger box over artwork that the thumbnail exists
      // to show.
      className="w-[28px] h-[28px] -m-[5px] grid place-items-center cursor-pointer"
    >
      <span
        className="w-[18px] h-[18px] rounded-[5px] grid place-items-center"
        style={{
          background: checked ? "var(--accent)" : "var(--scrim)",
          boxShadow: checked ? "none" : "inset 0 0 0 1px color-mix(in srgb, var(--scrim-ink) 55%, transparent)",
        }}
      >
        {checked && <Icon name="check" size={12} style={{ color: "var(--accent-ink)" }} />}
      </span>
    </button>
  );
}
