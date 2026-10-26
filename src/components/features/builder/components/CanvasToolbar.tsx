import { Button, Icon, IconButton, Kbd } from "@/components/ui";
import { BLOCK_META } from "@/components/features/guideline-site";
import type { BuilderPageState } from "../hooks/useBuilderPage";
import { ViewSwitcher } from "./ViewSwitcher";

/** The bar over the canvas: the page and its address, the shortcut hint, undo and redo, the view, and auto-fill. */
export function CanvasToolbar(b: BuilderPageState) {
  const { ws, isAr, activePage, selectedId, selected, autoFillCount } = b;
  const roundIcon = "grid h-8 w-8 cursor-pointer place-items-center rounded-full text-text-muted disabled:cursor-not-allowed disabled:opacity-30";
  return (
    <div className="flex h-12 shrink-0 items-center gap-2 px-5 shadow-rule-b">
      <span className="text-[13px] font-semibold">{activePage ? (isAr ? activePage.arName : activePage.name) : isAr ? "الرئيسية" : "Home"}</span>
      {activePage && (
        <>
          <IconButton icon="pen" label="Rename page" onClick={b.onRenamePage} className="cursor-pointer text-text-faint" />
          <IconButton icon="times" label="Delete page" title="Delete this page" onClick={b.onDeletePage} className="mk-danger-hover cursor-pointer text-text-faint" />
        </>
      )}
      <span className="truncate text-[11.5px] text-text-faint">{activePage ? `/v/${ws.slug}/p/${activePage.slug}` : `/v/${ws.slug}`}</span>
      {/*
        The hint takes all the slack, outside the control group. It says
        something different depending on the selection, and different widths
        made the view switcher slide sideways on every click. Prose can reflow;
        a control somebody is aiming at may not move.
      */}
      <span className="hidden min-w-0 flex-1 items-center justify-end gap-2 text-[11.5px] text-text-faint xl:flex">
        {selectedId ? (
          <>
            {isAr ? "المحدد:" : "Selected:"}
            <span className="text-text-muted">{selected ? BLOCK_META[selected.kind].label : selectedId}</span>
            <Kbd>Esc</Kbd>
            {isAr ? "لإلغاء التحديد" : "to deselect"}
            {selected && (
              <>
                <Kbd>Del</Kbd>
                {isAr ? "للحذف" : "to delete"}
              </>
            )}
          </>
        ) : (
          <>
            {isAr ? "اضغط على أي نص لتحريره مباشرة" : "Click any text to edit it in place"}
            <Kbd>⌘Z</Kbd>
            {isAr ? "للتراجع" : "to undo"}
          </>
        )}
      </span>

      {/* The controls, pinned to the end edge; `ms-auto` carries them there
          below xl, where the hint is not rendered. */}
      <span className="ms-auto flex shrink-0 items-center gap-2.5 xl:ms-2.5">
        {/* Undo and redo as a pair: a lone undo can walk you back but not
            forward again, which makes trying something out cost more. */}
        <span className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => b.undo()}
            disabled={!b.canUndo}
            title={isAr ? "تراجع (Ctrl+Z)" : "Undo (Ctrl+Z)"}
            aria-label={isAr ? "تراجع" : "Undo"}
            className={roundIcon}
          >
            <Icon name="undo" size={13} />
          </button>
          <button
            type="button"
            onClick={() => b.redo()}
            disabled={!b.canRedo}
            title={isAr ? "إعادة (Ctrl+Shift+Z)" : "Redo (Ctrl+Shift+Z)"}
            aria-label={isAr ? "إعادة" : "Redo"}
            className={roundIcon}
          >
            {/* The undo glyph flipped: rotational arrows, so the pair reads the
                same in both directions and needs no RTL variant. */}
            <Icon name="undo" size={13} className="-scale-x-100" />
          </button>
        </span>
        <ViewSwitcher breakpoint={b.breakpoint} onBreakpoint={b.onBreakpoint} lang={b.canvasLang} onLang={b.onPreviewLang} isAr={isAr} />
        {!activePage && (
          <Button
            variant="soft"
            size="xs"
            disabled={autoFillCount === 0}
            onClick={b.onAutoFill}
            title={
              autoFillCount > 0
                ? isAr
                  ? `يضيف أقسامًا جاهزة من مدير الأصول (${autoFillCount} ملفًا).`
                  : `Adds ready-made sections from your Assets Manager (${autoFillCount} file${autoFillCount === 1 ? "" : "s"}).`
                : isAr
                  ? "لا توجد نماذج تطبيقية أو ملفات تصدير بعد."
                  : "No mockups or exports in Assets yet."
            }
            className="shrink-0"
          >
            {isAr ? "تعبئة تلقائية" : "Auto-fill"}
          </Button>
        )}
      </span>
    </div>
  );
}
