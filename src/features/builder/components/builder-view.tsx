import { LiveCanvas } from "@/features/guideline-site";
import type { BuilderPageState } from "../hooks/use-builder-page";
import { CanvasFrame } from "./canvas/canvas-frame";
import { CanvasToolbar } from "./canvas/canvas-toolbar";
import { InspectorPanel } from "./inspector/inspector-panel";
import { PanelReveal } from "./shared/panel-reveal";
import { BuilderTopBar } from "./shared/builder-top-bar";
import { ToolsPanel } from "./tools/tools-panel";
import { SecondaryViewBanner } from "./canvas/view-switcher";
import { PanelResizer } from "./tools/panel-resizer";
import { BuilderTooSmall } from "./shared/builder-too-small";
import { useBuilderViewport } from "../hooks/use-builder-viewport";
import { builderCopy } from "../copy";

/** The guidelines editor: one bar across the top, then tools, the live canvas with its toolbar, and the design panel. */
export function BuilderView(b: BuilderPageState) {
  const { ws, isAr, leftOpen, rightOpen, inspectorShown, compact } = b;
  const { tooSmall } = useBuilderViewport();
  // Under 768px there is no room to edit a 1200px page: say so plainly.
  if (tooSmall) return <BuilderTooSmall ws={ws} isAr={isAr} previewHref={b.previewHref} />;
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
    <BuilderTopBar {...b} />
    <div className="relative flex min-h-0 flex-1 overflow-hidden">
      {!leftOpen && <PanelReveal side="start" isAr={isAr} label={isAr ? "إظهار لوحة الأدوات" : "Show the tools panel"} onClick={() => b.setLeftOpen(true)} />}
      {/* Unmounted rather than sized to zero: a zero-width panel keeps every
          control in the tab order and in-page search, all of it invisible. */}
      {leftOpen && <ToolsPanel {...b} />}
      {leftOpen && !compact && (
        <PanelResizer width={b.leftWidth} onWidth={b.setLeftWidth} isAr={isAr} label={builderCopy(isAr).layout.resize} />
      )}

      {/* The canvas region. */}
      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-surface-1">
        <CanvasToolbar {...b} />
        {/* The frame is itself the scroll container: an outer scroller left
            this card clipping with overflow:hidden, which disables sticky for
            the guideline site's own nav inside it. */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-surface-0 px-5 pt-3 pb-5">
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
      </div>

      {inspectorShown && !rightOpen && (
        <PanelReveal side="end" isAr={isAr} label={isAr ? "إظهار لوحة التصميم" : "Show the design panel"} onClick={() => b.setRightOpen(true)} />
      )}
      {inspectorShown && rightOpen && <InspectorPanel {...b} />}
    </div>
    </div>
  );
}
