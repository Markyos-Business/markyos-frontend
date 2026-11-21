import { IconButton, SegmentedControl, ToggleButton } from "@/components/ui";
import { TOOL_TABS } from "../../constants";
import { TOOLS_DEFAULT_W } from "../../hooks/use-builder-panels";
import type { BuilderPageState } from "../../hooks/use-builder-page";
import { LayersTab } from "../layers/layers-tab";
import { ElementsTab } from "./elements-tab";
import { SectionVisibility } from "./section-visibility";
import { SiteTab } from "./site-tab";
import { TemplateTab } from "./template-tab";

/** The editor's start panel: the way back out, the pages, and the four tool tabs. */
export function ToolsPanel(b: BuilderPageState) {
  const { ws, isAr, tab, activePage, sortedPages } = b;
  const hide = isAr ? "إخفاء لوحة الأدوات" : "Hide the tools panel";

  return (
    <div
      // On a wide screen the panel sits beside the canvas at the width it was
      // dragged to; under 1024px it floats over the canvas's start edge, so
      // opening it doesn't squeeze the page being edited.
      className={`motion-safe:animate-fade-in flex shrink-0 flex-col gap-3 overflow-x-hidden overflow-y-auto bg-surface-1 p-4 ${
        b.compact ? "absolute inset-y-0 start-0 z-20 shadow-edge-pop" : "shadow-[inset_-1px_0_0_var(--hairline)] rtl:shadow-[inset_1px_0_0_var(--hairline)]"
      }`}
      style={{ width: b.compact ? TOOLS_DEFAULT_W : b.leftWidth }} /* ctl-audit-ignore: a dragged panel width, not a control */
    >
      {/* The way out lives in the editor's top bar; this row only hides the panel. */}
      <div className="-mt-1 flex shrink-0 items-center justify-end">
        <IconButton icon="angle-double-left" iconSize={16} size="xs" label={hide} title={hide} onClick={() => b.setLeftOpen(false)} className="text-text-faint" />
      </div>

      <div className="flex flex-col gap-1.5">
        <span lang={isAr ? "ar" : "en"} className={`px-1 text-[10.5px] font-semibold ${isAr ? "tracking-normal" : "tracking-[0.08em]"} text-text-faint uppercase`}>{isAr ? "الصفحات" : "Pages"}</span>
        <div className="flex flex-wrap items-center gap-ctl-row">
          {/* Which page the canvas edits: the chosen one reads as pressed. */}
          <ToggleButton variant="secondary" size="sm" pressed={!activePage} onClick={() => b.onPage(null)}>
            {isAr ? "الرئيسية" : "Home"}
          </ToggleButton>
          {sortedPages.map((p) => (
            <ToggleButton key={p.id} variant="secondary" size="sm" pressed={activePage?.id === p.id} onClick={() => b.onPage(p.id)}>
              {isAr ? p.arName : p.name}
            </ToggleButton>
          ))}
          <IconButton icon="plus" iconSize={16} variant="secondary" size="sm" shape="round" label={isAr ? "إضافة صفحة" : "Add page"} onClick={b.onAddPage} />
        </div>
      </div>

      {/* At its narrowest (288px) the kit's full-width pill still fits all four tool names. */}
      <SegmentedControl fullWidth label={isAr ? "أدوات الدليل" : "Guideline tools"} options={TOOL_TABS.map((t) => ({ value: t.key, label: isAr ? t.ar : t.en }))} value={tab} onChange={b.onTab} />

      {/* Keyed on the tab so the swap animates: the content moves, the chrome above it doesn't. */}
      <div key={tab} className="flex flex-col gap-3">
        {!activePage && tab !== "layers" && <SectionVisibility ws={ws} isAr={isAr} />}
        {tab === "layers" ? (
          <LayersTab
            ws={ws}
            pageSlug={activePage?.slug}
            lang={b.canvasLang}
            selectedId={b.selectedId}
            // Reveals as well as selects: picking a section out of the tree and
            // then having to go find it on the canvas is the same gap the
            // review panel had.
            onSelect={b.revealFlow}
            isAr={isAr}
          />
        ) : tab === "elements" ? (
          <ElementsTab isAr={isAr} onAdd={b.onAdd} onDraggingKind={b.onDraggingKind} />
        ) : tab === "template" ? (
          <TemplateTab ws={ws} isAr={isAr} onSelectStyle={b.onSelectStyle} onSelectStudioStyle={b.onSelectStudioStyle} onApplyTemplate={b.onApplyTemplate} />
        ) : (
          <SiteTab ws={ws} isAr={isAr} />
        )}
      </div>
    </div>
  );
}
