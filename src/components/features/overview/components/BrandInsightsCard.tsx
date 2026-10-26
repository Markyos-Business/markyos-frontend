import { formatRelative } from "@/lib/utils";
import type { Workspace } from "@/types";

function insightRows(ws: Workspace) {
  const s = ws.strategy;
  const logoFilled = Object.values(ws.logo).filter((slot) => slot.phase === "attached").length;
  const strategyFieldsFilled =
    [s.purpose, s.vision, s.mission, s.targetAudienceSummary, s.positioningStatement, s.uvp].filter((v) => v.trim().length > 0).length +
    (s.coreValues.length > 0 ? 1 : 0) +
    (s.voiceTraits.length > 0 ? 1 : 0);
  const fonts = [ws.typography.latinFontAssetId, ws.typography.arabicFontAssetId].filter(Boolean).length;
  return [
    { label: "Logo slots filled", arLabel: "خانات الشعار المكتملة", value: `${logoFilled}/3` },
    { label: "Colors defined", arLabel: "الألوان المحددة", value: String(ws.colors.length) },
    { label: "Custom fonts applied", arLabel: "الخطوط المخصصة المطبّقة", value: `${fonts}/2` },
    { label: "Strategy fields filled", arLabel: "حقول الاستراتيجية المكتملة", value: `${strategyFieldsFilled}/8` },
    { label: "Company departments", arLabel: "أقسام الشركة", value: String(ws.departmentViews.length) },
    { label: "Brand files uploaded", arLabel: "ملفات الهوية المرفوعة", value: String(ws.assets.length) },
  ];
}

/** How complete the brand is, as six counts. */
export function BrandInsightsCard({ ws, isAr }: { ws: Workspace; isAr: boolean }) {
  return (
    <div className="mk-surface flex flex-col gap-3.5 rounded-2xl bg-surface-1 p-5">
      <div className="flex items-center justify-between">
        <span className="text-[14px] font-semibold">{isAr ? "رؤى العلامة" : "Brand insights"}</span>
        <span className="text-[11px] text-text-faint">
          {isAr ? "محدَّث" : "Updated"} {formatRelative(ws.updatedAt)}
        </span>
      </div>
      {/*
       * One column, not two: in two columns each value sat closer to the next
       * label than to its own. Six rows down one column is unambiguous, and it
       * lines the numbers up.
       */}
      <div className="flex flex-col gap-y-2.5">
        {insightRows(ws).map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-4 text-[12.5px]">
            <span className="text-text-muted">{isAr ? r.arLabel : r.label}</span>
            <span className="font-mono font-semibold text-text">{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
