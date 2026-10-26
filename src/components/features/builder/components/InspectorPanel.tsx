import { Icon } from "@/components/ui";
import { resolveOptions } from "@/components/features/guideline-site";
import type { BuilderPageState } from "../hooks/useBuilderPage";
import { BlockInspector } from "./BlockInspector";
import { DesignInspector } from "./DesignInspector";

/** The end panel for the selection: an authored block's content, then the design of whatever is selected. */
export function InspectorPanel(b: BuilderPageState) {
  const { ws, isAr, selected, selectedFixedId } = b;
  const hide = isAr ? "إخفاء لوحة التصميم" : "Hide the design panel";
  return (
    <div className="animate-fade-in flex w-[300px] shrink-0 flex-col gap-5 overflow-y-auto p-4 shadow-[inset_1px_0_0_var(--hairline)]">
      <div className="-mb-1 flex shrink-0 items-center justify-between gap-2">
        <span className="text-[10.5px] font-semibold tracking-[0.08em] text-text-faint uppercase">{isAr ? "التصميم" : "Design"}</span>
        <button
          type="button"
          onClick={() => b.setRightOpen(false)}
          aria-label={hide}
          title={hide}
          className="grid h-6 w-6 shrink-0 cursor-pointer place-items-center rounded-md text-text-faint"
        >
          <Icon name={isAr ? "angle-double-left" : "angle-double-right"} size={12} />
        </button>
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
