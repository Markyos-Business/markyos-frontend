import Link from "next/link";
import { Icon } from "@/components/ui";
import { TOOL_TABS } from "../../constants";
import type { BuilderPageState } from "../../hooks/useBuilderPage";
import { LayersTab } from "../LayersTab";
import { Segments } from "../Segments";
import { ElementsTab } from "./ElementsTab";
import { SectionVisibility } from "./SectionVisibility";
import { SiteTab } from "./SiteTab";
import { TemplateTab } from "./TemplateTab";

/** The editor's start panel: the way back out, the pages, and the four tool tabs. */
export function ToolsPanel(b: BuilderPageState) {
  const { ws, isAr, tab, activePage, sortedPages } = b;
  const back = isAr ? `العودة إلى ${ws.name}` : `Back to ${ws.name}`;
  const hide = isAr ? "إخفاء لوحة الأدوات" : "Hide the tools panel";
  const pageChip = (on: boolean) =>
    `h-8 cursor-pointer rounded-full px-3 text-[12px] font-semibold ${on ? "bg-accent-soft text-accent-on-soft" : "bg-surface-1 text-text-muted"}`;

  return (
    <div className="animate-fade-in flex w-[240px] shrink-0 flex-col gap-3 overflow-x-hidden overflow-y-auto p-4 shadow-[inset_-1px_0_0_var(--hairline)]">
      {/* The way back out. The studio's own navigation is not rendered on this
          route, so the editor carries its own exit and names the brand you are
          inside: a full-screen mode with no visible way out is a trap. */}
      <div className="-mt-1 flex shrink-0 items-center gap-2">
        <Link
          href={`/w/${ws.slug}/overview`}
          aria-label={back}
          title={back}
          className="grid h-7 w-7 shrink-0 cursor-pointer place-items-center rounded-lg bg-surface-1 text-text-muted"
        >
          <Icon name={isAr ? "angle-right" : "angle-left"} size={13} />
        </Link>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-[12.5px] leading-tight font-semibold">{ws.name}</span>
          <span className="truncate text-[10.5px] text-text-faint">{isAr ? "محرر الدليل" : "Guidelines editor"}</span>
        </div>
        <button
          type="button"
          onClick={() => b.setLeftOpen(false)}
          aria-label={hide}
          title={hide}
          className="grid h-6 w-6 shrink-0 cursor-pointer place-items-center rounded-md text-text-faint"
        >
          <Icon name={isAr ? "angle-double-right" : "angle-double-left"} size={12} />
        </button>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="px-1 text-[10.5px] font-semibold tracking-[0.08em] text-text-faint uppercase">{isAr ? "الصفحات" : "Pages"}</span>
        <div className="flex flex-wrap items-center gap-1.5">
          <button type="button" onClick={() => b.onPage(null)} className={pageChip(!activePage)}>
            {isAr ? "الرئيسية" : "Home"}
          </button>
          {sortedPages.map((p) => (
            <button key={p.id} type="button" onClick={() => b.onPage(p.id)} className={pageChip(activePage?.id === p.id)}>
              {isAr ? p.arName : p.name}
            </button>
          ))}
          <button
            type="button"
            onClick={b.onAddPage}
            aria-label={isAr ? "إضافة صفحة" : "Add page"}
            className="grid h-8 w-8 cursor-pointer place-items-center rounded-full bg-surface-1 text-text-faint"
          >
            <Icon name="plus" size={12} />
          </button>
        </div>
      </div>

      <Segments asTabs options={TOOL_TABS.map((t) => ({ value: t.key, label: isAr ? t.ar : t.en }))} value={tab} onChange={b.onTab} textClass="text-[10.5px]" />

      {!activePage && tab !== "layers" && <SectionVisibility ws={ws} isAr={isAr} />}

      {/* Keyed on the tab so the swap animates: the content moves, the chrome above it doesn't. */}
      <div key={tab} className="flex flex-col gap-3">
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
