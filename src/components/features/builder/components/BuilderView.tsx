import { LiveCanvas } from "@/components/features/guideline-site";
import type { BuilderPageState } from "../hooks/useBuilderPage";
import { CanvasFrame } from "./CanvasFrame";
import { CanvasToolbar } from "./CanvasToolbar";
import { InspectorPanel } from "./InspectorPanel";
import { PanelReveal } from "./PanelReveal";
import { ShipCluster } from "./ShipCluster";
import { ToolsPanel } from "./tools/ToolsPanel";
import { SecondaryViewBanner } from "./ViewSwitcher";

/** The guidelines editor: tools, the live canvas with its toolbar and ship cluster, and the design panel. */
export function BuilderView(b: BuilderPageState) {
  const { ws, isAr, leftOpen, rightOpen, inspectorShown } = b;
  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      {!leftOpen && <PanelReveal side="start" isAr={isAr} label={isAr ? "إظهار لوحة الأدوات" : "Show the tools panel"} onClick={() => b.setLeftOpen(true)} />}
      {/* Unmounted rather than sized to zero: a zero-width panel keeps every
          control in the tab order and in-page search, all of it invisible. */}
      {leftOpen && <ToolsPanel {...b} />}

      {/* The canvas region, and the positioning context for the ship cluster in its corner. */}
      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-surface-1">
        <CanvasToolbar {...b} />
        {/* The frame is itself the scroll container: an outer scroller left
            this card clipping with overflow:hidden, which disables sticky for
            the guideline site's own nav inside it. */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-surface-0 px-5 pt-3">
          {b.scope && (
            <div className="mx-auto w-full max-w-[720px] shrink-0 pb-3">
              <SecondaryViewBanner ctx={b.view} isAr={isAr} />
            </div>
          )}
          <CanvasFrame breakpoint={b.breakpoint} dir={b.view.dir} isAr={isAr} reserved={b.reservedForPanel}>
            <LiveCanvas
              slug={ws.slug}
              pageSlug={b.activePage?.slug}
              selectedId={b.selectedId}
              onSelect={b.onSelect}
              lang={b.canvasLang}
              onLangChange={b.onPreviewLang}
              draggingKind={b.draggingKind}
            />
          </CanvasFrame>
        </div>
        <ShipCluster {...b} />
      </div>

      {inspectorShown && !rightOpen && (
        <PanelReveal side="end" isAr={isAr} label={isAr ? "إظهار لوحة التصميم" : "Show the design panel"} onClick={() => b.setRightOpen(true)} />
      )}
      {inspectorShown && rightOpen && <InspectorPanel {...b} />}
    </div>
  );
}
