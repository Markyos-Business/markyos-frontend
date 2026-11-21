import { IconButton } from "@/components/ui";
import { resolveOptions } from "@/features/guideline-site";
import type { BuilderPageState } from "../../hooks/use-builder-page";
import { BlockInspector } from "./block-inspector";
import { DesignInspector } from "./design-inspector";

/** The end panel for the selection: an authored block's content, then the design of whatever is selected. */
export function InspectorPanel(b: BuilderPageState) {
  const { ws, isAr, selected, selectedFixedId } = b;
  const hide = isAr ? "إخفاء لوحة التصميم" : "Hide the design panel";
  return (
    <div
      className={`animate-fade-in flex w-[300px] shrink-0 flex-col gap-5 overflow-y-auto bg-surface-1 p-4 ${
        // Under 1024px it floats over the canvas's end edge, like the tools panel.
        b.compact ? "absolute inset-y-0 end-0 z-20 shadow-edge-pop" : "shadow-[inset_1px_0_0_var(--hairline)] rtl:shadow-[inset_-1px_0_0_var(--hairline)]"
      }`}
    >
      <div className="-mb-1 flex shrink-0 items-center justify-between gap-ctl-row">
        <span className="text-[10.5px] font-semibold tracking-[0.08em] text-text-faint uppercase">{isAr ? "التصميم" : "Design"}</span>
        <IconButton icon="angle-double-right" iconSize={16} size="xs" label={hide} title={hide} onClick={() => b.setRightOpen(false)} className="text-text-faint" />
      </div>

      {selected ? (
        <BlockInspector block={selected} ws={ws} isAr={isAr} onChange={b.onUpdateBlock} />
      ) : (
        <span className="text-[11px] text-text-faint">
          {isAr
            ? "هذا القسم مبني من بيانات الهوية — عدّله من صفحته الخاصة. ما يمكن ضبطه هنا هو شكله على الموقع: الخلفية، الحشو، العرض والحجم."
            : "This section is built from your brand data — edit that on its own page. What you set here is how it looks on the site: its background, padding, width and scale."}
        </span>
      )}

      <DesignInspector
        isAr={isAr}
        ws={ws}
        style={b.selectedStyle}
        // Only the derived sections have layouts and parts to choose between —
        // an authored block's shape is the block kind you picked.
        sectionId={selectedFixedId}
        options={selectedFixedId ? resolveOptions(selectedFixedId, ws.sectionOptions[selectedFixedId]) : undefined}
        onOptionsChange={b.onOptionsChange}
        view={{ breakpoint: b.breakpoint, dir: b.view.dir, scope: b.scope }}
        onChange={b.onStyleChange}
      />
    </div>
  );
}
