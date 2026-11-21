"use client";

import { saveFile } from "@/lib/download";
import { Button, Icon, IconButton } from "@/components/ui";

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
      className="rounded-card px-4 h-11 flex items-center gap-ctl-row shrink-0"
      style={{ background: "var(--accent-soft)", boxShadow: "inset 0 0 0 1px var(--accent-ring)" }}
    >
      <span className="text-[12px] font-semibold" style={{ color: "var(--accent-text)" }}>
        {isAr ? `${count} محدد` : `${count} selected`}
      </span>
      <Button variant="ghost" size="sm" onClick={allSelected ? onClear : onSelectAll}>
        {allSelected ? (isAr ? "إلغاء التحديد" : "Deselect all") : isAr ? `تحديد الكل (${total})` : `Select all (${total})`}
      </Button>
      <span className="ms-auto flex items-center gap-ctl-row">
        <Button variant="secondary" size="sm" icon={<Icon name="download" size={16} />} onClick={onDownload}>
          {isAr ? "تحميل" : "Download"}
        </Button>
        <Button variant="danger" size="sm" icon={<Icon name="times" size={16} />} onClick={onDelete}>
          {isAr ? "حذف" : "Delete"}
        </Button>
        <IconButton icon="times" iconSize={16} size="sm" onClick={onClear} label={isAr ? "إلغاء التحديد" : "Clear selection"} />
      </span>
    </div>
  );
}

/** Triggers a real browser download for each file, in order. */
export function downloadFiles(files: { url?: string; fileName: string }[]): number {
  const targets = files.filter((f) => !!f.url);
  // Fetched and saved, so a file on the media host downloads rather than opening in a tab.
  for (const f of targets) void saveFile(f.url!, f.fileName);
  return targets.length;
}

/** A checkbox that sits over an asset thumbnail. */
export function SelectBox({ checked, onToggle, label }: { checked: boolean; onToggle: () => void; label: string }) {
  return (
    <button /* button-audit-ignore: an 18px tick box over an asset thumbnail */
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
      className="w-[28px] h-ctl-xs -m-[5px] grid place-items-center cursor-pointer"
    >
      <span
        className="w-[18px] h-[18px] rounded-sm grid place-items-center"
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
