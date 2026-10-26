"use client";

import { useApp } from "@/contexts/AppContext";
import { Icon } from "@/components/ui";
import { useGuidelineViewer } from "@/components/features/guideline-site";
import type { Workspace } from "@/types";

/**
 * The fixed sections — Logo, Color, Type and friends — are derived from the
 * workspace's own brand data, so there is no block to delete when a studio
 * doesn't want one on the published site. This is where they're switched off,
 * without touching the underlying colors/logos/type themselves.
 */
export function SectionVisibility({ ws, isAr }: { ws: Workspace; isAr: boolean }) {
  const { toggleSectionHidden, setSectionStyle } = useApp();
  const v = useGuidelineViewer(ws.slug);

  if (v.availableFixed.length === 0) return null;

  /**
   * Parking lives on the section's own style, where the canvas can show it set
   * aside. `hiddenSections` is the older store for the same decision, so it is
   * still read — a workspace parked before this existed must not quietly come
   * back online — and cleared whenever a section is put back.
   */
  function setParked(sectionId: string, parked: boolean) {
    setSectionStyle(ws.id, sectionId, { hidden: parked ? true : undefined });
    if (!parked && ws.hiddenSections.includes(sectionId)) toggleSectionHidden(ws.id, sectionId);
  }

  const isParked = (id: string) => ws.hiddenSections.includes(id) || ws.sectionStyles[id]?.hidden === true;
  const parkedCount = v.availableFixed.filter((s) => isParked(s.id)).length;

  return (
    /**
     * A disclosure, not a permanently open list: at full height it pushed
     * whichever tab you picked below the fold, and the summary line says how
     * many are off without opening it.
     */
    <details className="flex shrink-0 flex-col gap-1.5">
      <summary className="flex cursor-pointer list-none items-center gap-1.5 px-1 text-[10.5px] font-semibold tracking-[0.08em] text-text-faint uppercase select-none">
        <Icon name="angle-right" size={10} className="mk-disclosure" />
        {isAr ? "أقسام الصفحة" : "Page sections"}
        <span className="ms-auto font-normal tracking-normal">
          {parkedCount > 0 ? (isAr ? `${parkedCount} مخفي` : `${parkedCount} off`) : `${v.availableFixed.length}`}
        </span>
      </summary>
      <div className="mt-1.5 flex flex-col overflow-hidden rounded-xl bg-surface-1">
        {v.availableFixed.map((s) => {
          const hidden = isParked(s.id);
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setParked(s.id, !hidden)}
              title={hidden ? (isAr ? "إظهار القسم" : "Show section") : isAr ? "إخفاء القسم" : "Hide section"}
              className={`flex h-9 cursor-pointer items-center gap-2 px-3 text-start text-[12px] ${hidden ? "text-text-faint" : "text-text"}`}
            >
              <Icon name={hidden ? "times" : "check"} size={12} className={hidden ? "text-text-faint" : "text-accent"} />
              <span className={`flex-1 truncate ${hidden ? "line-through" : ""}`}>{isAr ? s.arLabel : s.label}</span>
            </button>
          );
        })}
      </div>
      <span className="mt-1.5 block px-1 text-[11px] text-text-faint">
        {isAr ? "إخفاء قسم يزيله من الموقع المنشور دون حذف بيانات الهوية." : "Hiding a section removes it from the published site — your brand data stays."}
      </span>
    </details>
  );
}
